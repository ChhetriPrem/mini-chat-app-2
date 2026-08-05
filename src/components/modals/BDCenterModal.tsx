import React, { useState } from 'react';
import { X, Briefcase, TrendingUp, DollarSign, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BDCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BDCenterModal({ isOpen, onClose }: BDCenterModalProps) {
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const monthlyDiamonds = user.diamonds || 1200;
  const estimatedSalaryUsd = (monthlyDiamonds / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#0e271f] via-[#091a15] to-[#040e0b] border border-emerald-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Briefcase className="w-5 h-5 text-emerald-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">BD Center (Creator Business)</h2>
              <p className="text-[10px] text-gray-400">Host performance analytics, contracts & salary forecasts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-emerald-500 text-black text-xs font-black rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* Performance Overview Banner */}
          <div className="bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-black border border-emerald-400/50 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-emerald-300">Monthly Earnings Forecast</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Tier A Host
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">Diamonds Earned</span>
                <span className="text-base font-black text-white">💎 {monthlyDiamonds.toLocaleString()}</span>
              </div>

              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">Estimated Salary</span>
                <span className="text-base font-black text-emerald-400">${estimatedSalaryUsd} USD</span>
              </div>
            </div>

            <button
              onClick={() => showToast('Withdrawal request submitted to BD manager! 💰')}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-xs font-black text-black shadow-md hover:scale-[1.01] transition-transform"
            >
              Request Monthly Salary Payout
            </button>
          </div>

          {/* Official BD Tier Checklist */}
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2.5">
            <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Official Creator Tier Goals</span>
            </h3>

            <div className="space-y-2">
              {[
                { tier: 'Star Host', target: '10,000 Diamonds', reward: '$100 USD / mo', done: true },
                { tier: 'Superstar Host', target: '50,000 Diamonds', reward: '$500 USD / mo', done: monthlyDiamonds >= 50000 },
                { tier: 'Global Celebrity', target: '200,000 Diamonds', reward: '$2,000 USD / mo', done: false },
              ].map((t, idx) => (
                <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{t.tier}</p>
                    <span className="text-[10px] text-gray-400">Target: {t.target}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-emerald-400 block text-[11px]">{t.reward}</span>
                    {t.done ? (
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center justify-end space-x-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Achieved</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-400">In Progress</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
