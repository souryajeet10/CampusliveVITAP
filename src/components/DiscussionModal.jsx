import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, LogIn, Trash2 } from 'lucide-react';
import { subscribeDiscussion, sendDiscussionMessage, deleteDiscussionMessage } from '../services/discussionService';
import { getRelativeTime } from '../utils/time';

/**
 * Premium standalone popup modal for the public discussion thread of a Lost & Found pin.
 */
export const DiscussionModal = ({ isOpen, onClose, pin, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to messages when modal is open
  useEffect(() => {
    if (!isOpen || !pin?.id) {
      setMessages([]);
      return;
    }

    const unsub = subscribeDiscussion(
      pin.id,
      (msgs) => setMessages(msgs),
      (err) => console.error('Discussion error:', err)
    );

    return () => unsub();
  }, [isOpen, pin?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen || !pin) return null;

  const handleSend = async () => {
    if (!currentUser?.id || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendDiscussionMessage(pin.id, {
        senderId: currentUser.id,
        senderName: currentUser.name || 'CampusLive User',
        text
      });
      setText('');
      setTimeout(() => inputRef.current?.focus(), 50);
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

  const handleDeleteMsg = async (msgId) => {
    try {
      await deleteDiscussionMessage(pin.id, msgId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-[#0b0f19]/95 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Item Discussion</h3>
                  <p className="text-[10px] text-gray-500 truncate max-w-[240px] font-semibold mt-0.5">{pin.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-slate-900 text-gray-450 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Message Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-slate-950/20"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 text-gray-700 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">No messages in this thread yet</p>
                  <p className="text-[10px] text-gray-600 mt-1 max-w-[200px]">Ask a question or offer details to help coordinate the return.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = currentUser?.id && msg.senderId === currentUser.id;
                  const isReporter = pin.createdBy && msg.senderId === pin.createdBy;
                  const timestamp = msg.createdAt?.seconds
                    ? getRelativeTime(msg.createdAt.seconds * 1000)
                    : 'just now';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={`flex flex-col rounded-xl p-3 border
                        ${isOwn
                          ? 'bg-indigo-600/10 border-indigo-500/20 ml-6 items-end text-right'
                          : 'bg-slate-900/60 border-slate-800/80 mr-6 items-start text-left'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1 w-full justify-between">
                        {isOwn ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeleteMsg(msg.id)}
                                className="text-rose-500/60 hover:text-rose-400 p-0.5 rounded hover:bg-slate-900 transition-colors mr-1 cursor-pointer"
                                title="Delete Message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <span className="text-[8px] text-gray-600 shrink-0">{timestamp}</span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isReporter && (
                                <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 rounded">
                                  Reporter
                                </span>
                              )}
                              <span className="text-[10px] font-extrabold text-indigo-400 truncate">You</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-extrabold text-gray-300 truncate">
                                {msg.senderName || 'CampusLive User'}
                              </span>
                              {isReporter && (
                                <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 rounded shrink-0">
                                  Reporter
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] text-gray-600 shrink-0">{timestamp}</span>
                              {currentUser?.role === 'supreme_admin' && (
                                <button
                                  onClick={() => handleDeleteMsg(msg.id)}
                                  className="text-rose-500/60 hover:text-rose-400 p-0.5 rounded hover:bg-slate-900 transition-colors ml-1 cursor-pointer"
                                  title="Delete Message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed break-words whitespace-pre-wrap w-full font-semibold">
                        {msg.text}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex-shrink-0">
              {currentUser?.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 500))}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question or reply..."
                      disabled={sending}
                      className="flex-1 h-10 px-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all font-semibold"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!text.trim() || sending}
                      className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer active:scale-95 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-650 px-1">
                    <span>Keep discussion friendly and helpful.</span>
                    {text.length > 0 && (
                      <span className={text.length > 450 ? 'text-amber-500 font-bold' : ''}>
                        {text.length} / 500
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-center space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                    <LogIn className="w-4 h-4" />
                    <span>Authentication Required</span>
                  </div>
                  <p className="text-[10px] text-gray-600">Please log in to post a message in this discussion.</p>
                </div>
              )}
              {error && (
                <p className="text-[10px] text-rose-450 mt-2 font-bold text-center">{error}</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
