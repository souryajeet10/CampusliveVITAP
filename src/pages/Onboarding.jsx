import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  KeyRound, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import CreateAccountModal from '../components/CreateAccountModal';
import LoginModal from '../components/LoginModal';
import CampusIdCard from '../components/CampusIdCard';
import { useAuth } from '../hooks/useAuth';

const Onboarding = () => {
  const { login, register } = useAuth();
  
  // Modes: 'landing' | 'register' | 'login' | 'success'
  const [mode, setMode] = useState('landing');
  const [tempCredentials, setTempCredentials] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegisterSuccess = async (generatedId, profileFields) => {
    try {
      setErrorMessage('');
      // Save credentials state to show in Success Card first
      setTempCredentials({ id: generatedId, ...profileFields });
      setMode('success');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  const handleLoginSuccess = async (campusId) => {
    try {
      setErrorMessage('');
      await login(campusId);
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed.');
    }
  };

  const handleFinalizeOnboarding = async () => {
    if (!tempCredentials) return;
    try {
      // Actually login/commit registration session to context
      await register(tempCredentials.id, tempCredentials);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initialize session.');
    }
  };

  const handleError = (message) => {
    setErrorMessage(message);
    // Auto fade error after 5s
    setTimeout(() => setErrorMessage(''), 5000);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#06090f] text-slate-200 flex flex-col items-center justify-center p-6 font-sans overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Error alert toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2.5 shadow-xl shadow-rose-950/20"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="flex-1 text-left">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo / App Brand */}
        {mode !== 'success' && (
          <motion.div 
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center shadow-lg shadow-indigo-600/15 border border-indigo-400/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-wider">CampusLive</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full text-center space-y-8"
            >
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  The Social Layer of Every Campus
                </h1>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Discover live activities, find club communities, and connect with students instantly in real-time.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3.5 w-full">
                <button
                  onClick={() => setMode('register')}
                  className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer active:scale-98"
                >
                  <span>Create Account</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMode('login')}
                  className="w-full h-12 rounded-2xl bg-slate-950/40 hover:bg-slate-900 border border-slate-900 text-slate-350 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Login with Campus ID</span>
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'register' && (
            <CreateAccountModal
              key="register"
              onRegister={handleRegisterSuccess}
              onBack={() => setMode('landing')}
              onError={handleError}
            />
          )}

          {mode === 'login' && (
            <LoginModal
              key="login"
              onLogin={handleLoginSuccess}
              onBack={() => setMode('landing')}
              onError={handleError}
            />
          )}

          {mode === 'success' && tempCredentials && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-center space-y-6"
            >
              <div className="space-y-2 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider">🎉 Profile Created!</h1>
                <p className="text-xs text-gray-500 max-w-xs leading-normal">
                  Save your Campus ID. You will need it to verify your access from any device.
                </p>
              </div>

              <CampusIdCard
                campusId={tempCredentials.id}
                name={tempCredentials.name}
                department={tempCredentials.department}
                year={tempCredentials.year}
                onContinue={handleFinalizeOnboarding}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 text-[10px] text-gray-650 font-semibold tracking-wide uppercase">
        CampusLive Security &bull; Credentials Manager
      </div>
    </div>
  );
};

export default Onboarding;
