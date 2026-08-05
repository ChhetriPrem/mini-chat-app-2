import React, { useState } from 'react';
import { X, Zap, Coins, Phone, ShieldCheck, Sparkles, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OfflineRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RechargePackage {
  id: string;
  coins: number;
  bonus: number;
  priceInr: number;
  popular?: boolean;
}

const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: 'p1', coins: 1000, bonus: 100, priceInr: 99 },
  { id: 'p2', coins: 5000, bonus: 750, priceInr: 499, popular: true },
  { id: 'p3', coins: 12000, bonus: 2500, priceInr: 999 },
  { id: 'p4', coins: 30000, bonus: 8000, priceInr: 2499 },
  { id: 'p5', coins: 70000, bonus: 20000, priceInr: 4999 },
];

export function OfflineRechargeModal({ isOpen, onClose }: OfflineRechargeModalProps) {
  const { user, buyCoins } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<RechargePackage>(RECHARGE_PACKAGES[1]);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleInstantRecharge = (pkg: RechargePackage) => {
    const totalAdded = pkg.coins + pkg.bonus;
    buyCoins(totalAdded);
    showToast(`Recharged +${totalAdded.toLocaleString()} Coins! (Includes +${pkg.bonus} Bonus) 🎉`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#2b2108] via-[#1a1403] to-[#0a0801] border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-amber-300">Offline & Agent Recharge</h2>
              <p className="text-[10px] text-amber-200/80">Direct top-up with extra bonus coins & agent support</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status */}
        <div className="p-3 bg-amber-950/60 border-b border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-gray-300 font-bold">Current Coins Balance:</span>
          <span className="text-sm font-black text-amber-300 flex items-center space-x-1">
            <Coins className="w-4 h-4" />
            <span>{user.coins.toLocaleString()} Coins</span>
          </span>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-amber-400 text-black text-xs font-black rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">

          <h3 className="text-xs font-bold text-amber-200">Select Coin Package:</h3>

          <div className="space-y-2.5">
            {RECHARGE_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPkg.id === pkg.id
                    ? 'bg-amber-500/15 border-amber-400 shadow-amber-500/20 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🪙</span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black text-white">{pkg.coins.toLocaleString()} Coins</span>
                      {pkg.bonus > 0 && (
                        <span className="text-[9px] font-extrabold bg-amber-400 text-black px-1.5 py-0.2 rounded-full">
                          +{pkg.bonus.toLocaleString()} Extra
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">Total: {(pkg.coins + pkg.bonus).toLocaleString()} Coins</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-amber-300 block">₹{pkg.priceInr}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstantRecharge(pkg);
                    }}
                    className="mt-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[10px] rounded-full shadow-md hover:scale-105"
                  >
                    Top Up Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Official Agent Direct Line */}
          <div className="bg-black/40 border border-white/10 p-3 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-amber-300 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Official WhatsApp / Agent Top-Up Hotline</span>
            </h4>
            <p className="text-[10px] text-gray-300">
              Need custom bulk recharge (₹10,000+) with bank transfer / UPI? Contact our verified official agent:
            </p>
            <button
              onClick={() => showToast('Connecting to Official Recharge Agent on WhatsApp... 📞')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-white flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Verified Agent (+91 98765 43210)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
