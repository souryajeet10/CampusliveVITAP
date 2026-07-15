import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const DatePicker = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to format Date to YYYY-MM-DD
  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const selectedDate = value ? new Date(value) : null;
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get days in month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day) => {
    const clickedDate = new Date(year, month, day);
    if (clickedDate >= today) {
      onChange(formatDateString(clickedDate));
      setIsOpen(false);
    }
  };

  // Generate day cells
  const dayCells = [];
  // Empty spaces for previous month's days offset
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateToCheck = new Date(year, month, d);
    dateToCheck.setHours(0, 0, 0, 0);
    const isDisabled = dateToCheck < today;
    const isSelected = selectedDate && dateToCheck.getTime() === selectedDate.getTime();
    const isToday = dateToCheck.getTime() === today.getTime();

    dayCells.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleDateSelect(d)}
        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer
          ${isSelected 
            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
            : isToday
              ? 'border border-indigo-500/50 text-indigo-400'
              : 'text-slate-300 hover:bg-slate-800'
          }
          ${isDisabled ? 'text-gray-600 cursor-not-allowed hover:bg-transparent' : ''}
        `}
      >
        {d}
      </button>
    );
  }

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 rounded-lg bg-[#06090f] border flex items-center justify-between text-slate-200 focus:outline-none transition-all font-semibold text-xs
          ${error ? 'border-rose-500/50 focus:border-rose-500/80' : 'border-slate-900 focus:border-indigo-500/80'}
        `}
      >
        <span>{value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select Date'}</span>
        <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close calendar */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-11 left-0 z-50 p-4 rounded-xl bg-[#0b0f19]/95 border border-slate-900 shadow-2xl backdrop-blur-md w-[280px] animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {weekdays.map((day) => (
                <div key={day} className="text-[10px] font-bold text-gray-500 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {dayCells}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DatePicker;
