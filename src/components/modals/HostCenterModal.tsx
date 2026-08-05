import React, { useState } from 'react';
import { X, Headphones, Video, Mic, DollarSign, Radio, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HostCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGoLive: () => void;
}

export function HostCenterModal({ isOpen, onClose, onOpenGoLive }: HostCenterModalProps) {
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#250d38] via-[#160724] to-[#0a0212] border border-purple-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Headphones className="w-5 h-5 text-purple-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Host & Streamer Center</h2>
              <p className="text-[10px] text-gray-400">Launch live rooms, track audio earnings & view host ranking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-purple-600 text-white text-xs font-black rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* Quick Launch Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenGoLive();
              }}
              className="bg-gradient-to-br from-purple-600 to-pink-600 p-3.5 rounded-2xl text-left text-white shadow-xl hover:scale-105 transition-transform border border-purple-400/40"
            >
              <Mic className="w-6 h-6 mb-1 text-pink-200" />
              <h3 className="text-xs font-black">Voice Party Room</h3>
              <p className="text-[9px] text-purple-100">8-Seat Audio Stage</p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenGoLive();
              }}
              className="bg-gradient-to-br from-indigo-600 to-blue-600 p-3.5 rounded-2xl text-left text-white shadow-xl hover:scale-105 transition-transform border border-indigo-400/40"
            >
              <Video className="w-6 h-6 mb-1 text-blue-200" />
              <h3 className="text-xs font-black">Video Broadcast</h3>
              <p className="text-[9px] text-blue-100">Solo / PK Video Stream</p>
            </button>
          </div>

          {/* Host Stats */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-pink-400" />
              <span>Host Live Activity (This Month)</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-gray-400 block">Stream Hours</span>
                <span className="text-sm font-black text-white">24.5 hrs</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-gray-400 block">Recv Diamonds</span>
                <span className="text-sm font-black text-amber-300">💎 {user.diamonds.toLocaleString()}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                <span className="text-[9px] text-gray-400 block">Host Rank</span>
                <span className="text-sm font-black text-pink-400">#14</span>
              </div>
            </div>
          </div>

          {/* Creator Rules */}
          <div className="bg-purple-950/40 border border-purple-500/20 p-3 rounded-2xl space-y-1.5 text-[10px] text-purple-200">
            <p className="font-bold text-white text-xs">💡 Creator Guidelines</p>
            <p>1. Hosts earn 60-70% diamond conversion on all received gifts.</p>
            <p>2. Keep voice rooms respectful and adhere to safety policies.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
