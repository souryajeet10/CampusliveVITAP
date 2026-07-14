import { motion } from 'framer-motion';
import { X, QrCode, Download } from 'lucide-react';

const QRModal = ({ isOpen, onClose, campusId }) => {
  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(campusId)}&bgcolor=ffffff&color=0f172a&margin=15`;

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CampusLive_QR_${campusId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-850 bg-[#080b11] p-6 shadow-2xl z-10 text-center flex flex-col items-center space-y-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-gray-500 hover:text-white transition-colors cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Campus ID QR Code</h3>
        </div>

        {/* QR Wrapper */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-md">
          <img
            src={qrImageUrl}
            alt={`QR Code for ${campusId}`}
            className="w-48 h-48 block"
            loading="lazy"
          />
        </div>

        <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
          {campusId}
        </p>
        
        <p className="text-[10px] text-gray-500 max-w-xs leading-normal">
          Hold this QR Code up to any campus checkpoint terminal or scanner to check-in instantly.
        </p>

        <button
          onClick={handleDownloadQR}
          className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download QR Code Image</span>
        </button>
      </motion.div>
    </div>
  );
};

export default QRModal;
