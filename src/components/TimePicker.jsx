import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimePicker = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('PM');

  // Sync internal state when value prop changes (expected format "HH:MM" in 24h format)
  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(':');
      let hVal = parseInt(hStr, 10);
      const mVal = mStr || '00';
      const isPm = hVal >= 12;
      
      hVal = hVal % 12;
      hVal = hVal ? hVal : 12; // 0 becomes 12
      
      setHour(String(hVal).padStart(2, '0'));
      setMinute(mVal);
      setAmpm(isPm ? 'PM' : 'AM');
    }
  }, [value]);

  const updateTime = (h, m, p) => {
    let hour24 = parseInt(h, 10);
    if (p === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (p === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    const formattedHour = String(hour24).padStart(2, '0');
    onChange(`${formattedHour}:${m}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  // Format internal state to 12h display
  const displayValue = value ? `${hour}:${minute} ${ampm}` : 'Select Time';

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 rounded-lg bg-[#06090f] border flex items-center justify-between text-slate-200 focus:outline-none transition-all font-semibold text-xs
          ${error ? 'border-rose-500/50 focus:border-rose-500/80' : 'border-slate-900 focus:border-indigo-500/80'}
        `}
      >
        <span>{displayValue}</span>
        <Clock className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-11 left-0 z-50 p-4 rounded-xl bg-[#0b0f19]/95 border border-slate-900 shadow-2xl backdrop-blur-md w-[220px] animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-3">
            <div className="flex gap-2 justify-center">
              {/* Hours Column */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-gray-500 uppercase mb-1">Hour</span>
                <div className="h-32 overflow-y-auto w-12 border border-slate-900 rounded-lg scrollbar-none py-1 space-y-0.5">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHour(h);
                        updateTime(h, minute, ampm);
                      }}
                      className={`w-full py-1 text-xs font-bold text-center transition-colors rounded
                        ${hour === h ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-gray-500 uppercase mb-1">Min</span>
                <div className="h-32 overflow-y-auto w-12 border border-slate-900 rounded-lg scrollbar-none py-1 space-y-0.5">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMinute(m);
                        updateTime(hour, m, ampm);
                      }}
                      className={`w-full py-1 text-xs font-bold text-center transition-colors rounded
                        ${minute === m ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM Column */}
              <div className="flex flex-col items-center justify-center pt-4">
                <div className="flex flex-col gap-1.5 border border-slate-900 p-1 rounded-lg">
                  {['AM', 'PM'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setAmpm(p);
                        updateTime(hour, minute, p);
                      }}
                      className={`w-10 py-1 text-[10px] font-bold text-center transition-colors rounded cursor-pointer
                        ${ampm === p ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] hover:bg-indigo-500/20 transition-colors"
            >
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TimePicker;
