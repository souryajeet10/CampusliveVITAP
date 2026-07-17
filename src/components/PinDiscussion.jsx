import { useState, useEffect, useRef, memo } from 'react';
import { MessageCircle, Send, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { subscribeDiscussion, sendDiscussionMessage } from '../services/discussionService';
import { getRelativeTime } from '../utils/time';

/**
 * Collapsible public discussion thread for a Lost & Found pin.
 *
 * Props:
 *  - pinId        {string}  Firestore document ID of the pin
 *  - currentUser  {object|null}  { id, name } or null when logged out
 *  - compact      {boolean} If true, uses tighter sizing for Leaflet popups
 */
const PinDiscussion = memo(({ pinId, currentUser, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to messages only when the thread is expanded
  useEffect(() => {
    if (!expanded || !pinId) return;

    const unsub = subscribeDiscussion(
      pinId,
      (msgs) => setMessages(msgs),
      (err) => console.error('Discussion error:', err)
    );

    return () => unsub();
  }, [expanded, pinId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!currentUser?.id || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendDiscussionMessage(pinId, {
        senderId: currentUser.id,
        senderName: currentUser.name || 'CampusLive User',
        text
      });
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messageCount = messages.length;

  return (
    <div className={`w-full ${compact ? 'mt-2' : 'mt-3'}`}>
      {/* Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between gap-1.5 rounded-lg border transition-all cursor-pointer select-none
          ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
          ${expanded
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            : 'bg-slate-900/40 border-slate-800/60 text-gray-400 hover:text-gray-300 hover:border-slate-700'
          }`}
      >
        <div className="flex items-center gap-1.5">
          <MessageCircle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span className={`font-bold ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
            {expanded ? 'Discussion' : 'View / Join Discussion'}
            {messageCount > 0 && (
              <span className="ml-1 text-indigo-400/80">({messageCount})</span>
            )}
          </span>
        </div>
        {expanded
          ? <ChevronUp className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          : <ChevronDown className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        }
      </button>

      {/* Expanded Thread */}
      {expanded && (
        <div className={`mt-2 rounded-xl border border-slate-800/60 bg-slate-950/40 overflow-hidden ${compact ? '' : ''}`}>
          {/* Message List */}
          <div
            ref={scrollRef}
            className={`overflow-y-auto custom-scrollbar space-y-1 ${compact ? 'max-h-[140px] p-2' : 'max-h-[200px] p-3'}`}
          >
            {messages.length === 0 ? (
              <div className={`text-center text-gray-500 py-4 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                <MessageCircle className="w-5 h-5 mx-auto mb-1.5 text-gray-600" />
                <p className="font-semibold">No messages yet</p>
                <p className="text-gray-600 mt-0.5">Be the first to start the discussion.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = currentUser?.id && msg.senderId === currentUser.id;
                const timestamp = msg.createdAt?.seconds
                  ? getRelativeTime(msg.createdAt.seconds * 1000)
                  : 'just now';

                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-2 ${compact ? 'p-1.5' : 'p-2'}
                      ${isOwn
                        ? 'bg-indigo-500/8 border border-indigo-500/15 ml-4'
                        : 'bg-slate-900/30 border border-slate-800/40 mr-4'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`font-bold truncate ${compact ? 'text-[8px]' : 'text-[9px]'}
                        ${isOwn ? 'text-indigo-400' : 'text-gray-300'}`}
                      >
                        {isOwn ? 'You' : (msg.senderName || 'CampusLive User')}
                      </span>
                      <span className={`text-gray-600 shrink-0 ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
                        {timestamp}
                      </span>
                    </div>
                    <p className={`text-gray-300 leading-relaxed break-words ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                      {msg.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className={`border-t border-slate-800/50 ${compact ? 'p-1.5' : 'p-2.5'}`}>
            {currentUser?.id ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={sending}
                  className={`flex-1 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all font-semibold
                    ${compact ? 'h-7 px-2 text-[9px]' : 'h-8 px-3 text-[10px]'}`}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className={`rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer active:scale-90
                    ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}
                  title="Send message"
                >
                  <Send className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                </button>
              </div>
            ) : (
              <div className={`flex items-center justify-center gap-1.5 text-gray-500 py-1 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                <LogIn className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                <span className="font-semibold">Log in to join the discussion</span>
              </div>
            )}

            {error && (
              <p className={`text-rose-400 mt-1 font-semibold ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
                {error}
              </p>
            )}

            {/* Character counter when typing */}
            {text.length > 0 && (
              <div className={`text-right mt-0.5 ${compact ? 'text-[7px]' : 'text-[8px]'}
                ${text.length > 450 ? 'text-amber-400' : 'text-gray-600'}`}
              >
                {text.length}/500
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

PinDiscussion.displayName = 'PinDiscussion';

export default PinDiscussion;
