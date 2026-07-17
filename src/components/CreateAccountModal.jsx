import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  BookOpen, 
  Calendar, 
  Sparkles,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { generateUniqueCampusId } from '../services/authService';

const DEPARTMENTS = [
  'Computer Science (CSE)',
  'Electronics & Communications (ECE)',
  'Mechanical Engineering (ME)',
  'Biotechnology (BT)',
  'Business Administration (BBA)',
  'Liberal Arts & Social Sciences',
  'Sciences (Physics/Chemistry/Maths)'
];

const YEARS = [
  '🌱 Fresher 1st year',
  '📘 Second Year',
  '🚀 3rd year',
  '🎓 Senior (Final Year)',
  'Postgraduate / Masters',
  'PhD / Doctorate'
];

const AVAILABLE_INTERESTS = [
  'Study Groups',
  'Competitive Gaming',
  'Hackathons & Coding',
  'Outdoors & Trekking',
  'Fitness & Athletics',
  'Music & Concerts',
  'Gourmet Food & Cafes',
  'Debate & Public Speaking'
];

const CreateAccountModal = ({ onRegister, onBack, onError }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onError('Please enter your full name.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Generate unique Campus ID
      const generatedId = await generateUniqueCampusId();
      
      // 2. Trigger register callback
      await onRegister(generatedId, {
        name: name.trim(),
        department,
        year,
        interests: selectedInterests
      });
    } catch (err) {
      console.error('Registration failed:', err);
      onError(err.message || 'Failed to register your profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl backdrop-blur-md relative"
    >
      {/* Header back navigation */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-xl bg-slate-900 border border-slate-850 text-gray-500 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      <div className="text-center mb-6 pt-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Create Profile</h2>
        <p className="text-[11px] text-gray-500 mt-1">Set up your university dashboard credentials</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Name input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              required
              maxLength={40}
              placeholder="e.g. G. Viswanathan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-650 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        {/* Department select */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#06090f] border border-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold appearance-none cursor-pointer"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Year select */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Academic Year</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#06090f] border border-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold appearance-none cursor-pointer"
            >
              {YEARS.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interests selection */}
        <div className="space-y-2 pt-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Interests (Optional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-[96px] overflow-y-auto pr-1">
            {AVAILABLE_INTERESTS.map(interest => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border cursor-pointer
                    ${isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' 
                      : 'bg-slate-950/40 border-slate-900 text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-98 mt-6"
        >
          <span>{isSubmitting ? 'Generating credentials...' : 'Create Campus Profile'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
};

export default CreateAccountModal;
