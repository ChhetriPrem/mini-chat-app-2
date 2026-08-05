import React, { useState } from 'react';
import { X, Shield, Crown, Sparkles, Check, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIP_TIERS = [
  { level: 1, name: 'VIP 1 Bronze', coinsReq: 5000, perks: ['VIP Badge in Room', 'Exclusive Chat Color', '1.1x EXP Boost'] },
  { level: 2, name: 'VIP 2 Silver', coinsReq: 15000, perks: ['Special Room Entry Notice', 'Silver Profile Border', '1.2x EXP Boost'] },
  { level: 3, name: 'VIP 3 Gold', coinsReq: 35000, perks: ['Golden Chat Bubble', 'Room Kick Protection', '1.3x EXP Boost'] },
  { level: 4, name: 'VIP 4 Platinum', coinsReq: 75000, perks: ['Platinum Car Entrance Effect', 'Custom Emote Slot', '1.5x EXP Boost'] },
  { level: 5, name: 'VIP 5 Diamond', coinsReq: 150000, perks: ['Global Room Broadcast Notice', 'Diamond Badge', '2.0x EXP Boost'] },
  { level: 6, name: 'VIP 6 Crown', coinsReq: 300000, perks: ['Crown Overlord Avatar Frame', 'Priority Stage Mic', '2.5x EXP Boost'] },
  { level: 7, name: 'VIP 7 Supreme', coinsReq: 500000, perks: ['Golden Dragon Mount', 'Personal Account Manager', '3.0x EXP Boost'] },
];

export function VIPModal({ isOpen, onClose }: VIPModalProps) {
  const { user, deductCoins, updateUser } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleUpgradeVip = (tier: typeof VIP_TIERS[0]) => {
    if (user.vipLevel >= tier.level) {
      showToast(`You already have ${tier.name}!`);
      return;
    }

    if (!deductCoins(tier.coinsReq)) {
      showToast(`Requires ${tier.coinsReq.toLocaleString()} Coins balance!`);
      return;
    }

    updateUser({
      vipLevel: tier.level,
    });
    showToast(`Upgraded to ${tier.name}! 🛡️`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#2b1807] via-[#1a0e04] to-[#0d0702] border border-amber-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Shield className="w-5 h-5 text-amber-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-amber-300">VIP Privileges & Tiers</h2>
              <p className="text-[10px] text-amber-200/80">Upgrade VIP levels to unlock golden badges & mounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Level Status */}
        <div className="p-3 bg-amber-950/60 border-b border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-200 font-bold block">Current Status</span>
            <span className="text-sm font-black text-amber-300">
              {user.vipLevel > 0 ? `VIP ${user.vipLevel} Active` : 'Non-VIP Member'}
            </span>
          </div>
          <span className="text-xs font-black text-white bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
            🪙 {user.coins.toLocaleString()} Coins
          </span>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-xs font-black rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* VIP Tiers List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {VIP_TIERS.map((tier) => {
            const isUnlocked = user.vipLevel >= tier.level;

            return (
              <div
                key={tier.level}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-amber-500/10 border-amber-400/60 text-amber-200'
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/40">
                      V{tier.level}
                    </span>
                    <h3 className="text-xs font-black text-white">{tier.name}</h3>
                  </div>

                  {isUnlocked ? (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpgradeVip(tier)}
                      className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[10px] rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      Unlock ({tier.coinsReq.toLocaleString()} Coins)
                    </button>
                  )}
                </div>

                {/* Perk list */}
                <div className="grid grid-cols-2 gap-1.5 pt-2">
                  {tier.perks.map((perk, i) => (
                    <div key={i} className="text-[10px] text-amber-100/90 flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
