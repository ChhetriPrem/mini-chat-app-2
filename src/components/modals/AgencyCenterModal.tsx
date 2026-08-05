import React, { useState } from 'react';
import { X, Briefcase, Users2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AgencyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgencyCenterModal({ isOpen, onClose }: AgencyCenterModalProps) {
  const { user, updateUser } = useAuth();
  const [agencyCodeInput, setAgencyCodeInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleJoinAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyCodeInput) return;

    updateUser({ isAgency: true });
    setAgencyCodeInput('');
    showToast('Successfully joined Official Agency! Agency badge added to profile. 🏢');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#21113b] via-[#140a26] to-[#0a0414] border border-purple-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Briefcase className="w-5 h-5 text-purple-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Agency Portal & Talent Hub</h2>
              <p className="text-[10px] text-gray-400">Join an official agency or manage agency hosts</p>
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

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* Current Agency Status */}
          {user.isAgency ? (
            <div className="bg-gradient-to-br from-purple-950/80 via-indigo-950/60 to-black border border-purple-400/50 p-4 rounded-2xl text-center space-y-2">
              <span className="p-3 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-block">
                <ShieldCheck className="w-8 h-8" />
              </span>
              <h3 className="text-sm font-black text-white">Official Agency Verified</h3>
              <p className="text-xs text-purple-200">You are a registered host under <strong>Royal Talent Agency (Code: 8899)</strong></p>

              <div className="grid grid-cols-2 gap-2 pt-2 text-left text-[11px]">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-400 block text-[9px]">Commission Share</span>
                  <span className="font-bold text-emerald-400">70% Direct Payout</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-400 block text-[9px]">Agency Manager</span>
                  <span className="font-bold text-purple-300">Aarav Agency Boss</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-2xl text-center space-y-1">
                <Users2 className="w-8 h-8 text-purple-300 mx-auto" />
                <h3 className="text-xs font-black text-white">Join an Official Agency</h3>
                <p className="text-[10px] text-purple-200">Get higher cashout limits, priority promotion & dedicated managers</p>
              </div>

              <form onSubmit={handleJoinAgency} className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Enter Agency Invitation Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 8899"
                    value={agencyCodeInput}
                    onChange={(e) => setAgencyCodeInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-black text-white shadow-md hover:opacity-90 flex items-center justify-center space-x-1"
                >
                  <span>Submit Agency Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
