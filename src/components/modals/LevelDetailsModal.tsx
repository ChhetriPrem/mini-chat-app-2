import React, { useState } from 'react';
import { X, Trophy, Heart, Crown, Sparkles, Shield, Gift, Zap, CheckCircle2, Lock } from 'lucide-react';
import {
  calculateWealthLevel,
  calculateCharismaLevel,
  getWealthLevelTitle,
  getCharismaLevelTitle,
  getWealthPrivileges,
  getCharismaPrivileges,
  getWealthBadgeStyle,
  getCharismaBadgeStyle,
  getThresholdForLevel,
} from '../../lib/levels';
import { User } from '../../types';

interface LevelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  initialTab?: 'wealth' | 'charisma' | 'svip';
}

export function LevelDetailsModal({
  isOpen,
  onClose,
  user,
  initialTab = 'wealth',
}: LevelDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'wealth' | 'charisma' | 'svip'>(initialTab);

  if (!isOpen) return null;

  const coinsSpent = user.totalCoinsSpent || Math.pow(user.level || 1, 2) * 100;
  const diamondsEarned = user.totalDiamondsEarned || user.diamonds || 1200;

  const wealthStats = calculateWealthLevel(coinsSpent);
  const charismaStats = calculateCharismaLevel(diamondsEarned);

  // SVIP Tiering logic (1 to 9)
  const currentSvipTier = user.svipLevel || (user.svip ? 1 : 0);

  // Sample milestone levels for the 1-100 table display
  const milestoneLevels = [1, 2, 5, 10, 15, 20, 30, 40, 50, 60, 75, 90, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#1a0b2e] via-[#120722] to-[#0a0414] border border-purple-500/30 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Level & Status Details</h2>
              <p className="text-[10px] text-gray-400">Progression from LV.1 to LV.100</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-black/40 border-b border-white/10 flex gap-1.5">
          <button
            onClick={() => setActiveTab('wealth')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'wealth'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Wealth LV</span>
          </button>

          <button
            onClick={() => setActiveTab('charisma')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'charisma'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Charisma LV</span>
          </button>

          <button
            onClick={() => setActiveTab('svip')}
            className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'svip'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            <span>SVIP Tier</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* TAB 1: WEALTH LEVEL (GIFTS SENT) */}
          {activeTab === 'wealth' && (
            <div className="space-y-4">
              {/* Giant Badge Banner */}
              <div className="bg-gradient-to-br from-amber-950/60 via-yellow-950/40 to-black border border-amber-500/40 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-1 shadow-2xl ring-4 ring-amber-500/30">
                  <div className="w-full h-full rounded-full bg-black/80 flex flex-col items-center justify-center border border-amber-300/50">
                    <Trophy className="w-6 h-6 text-amber-300 mb-0.5" />
                    <span className="text-xs font-black text-amber-200">LV.{wealthStats.level}</span>
                  </div>
                </div>

                <div>
                  <span className={`inline-block text-xs font-black px-3 py-1 rounded-full ${getWealthBadgeStyle(wealthStats.level)}`}>
                    {wealthStats.title}
                  </span>
                  <p className="text-[11px] text-amber-200/80 mt-1.5 font-medium">
                    Gifts Sent EXP: <strong className="text-amber-300">{coinsSpent.toLocaleString()} coins spent</strong>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 text-left bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs font-bold text-amber-200">
                    <span>Level {wealthStats.level} Progress</span>
                    <span>{wealthStats.exp.toLocaleString()} / {wealthStats.nextExp.toLocaleString()} EXP</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-amber-500/20">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${wealthStats.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-right">
                    {100 - wealthStats.progressPercent}% until LV.{Math.min(100, wealthStats.level + 1)}
                  </p>
                </div>
              </div>

              {/* Unlocked Privileges */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <h3 className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unlocked Wealth Privileges</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {getWealthPrivileges(wealthStats.level).map((perk, i) => (
                    <div key={i} className="flex items-center space-x-1.5 bg-black/30 p-2 rounded-xl border border-white/5 text-[11px] text-gray-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1 - 100 Milestones Table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Wealth Level Milestones (1 - 100)</span>
                  </h3>
                  <span className="text-[10px] text-amber-400 font-medium">1 Coin = 1 EXP</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {milestoneLevels.map((lvl) => {
                    const req = getThresholdForLevel(lvl);
                    const isUnlocked = wealthStats.level >= lvl;
                    const isCurrent = wealthStats.level === lvl;

                    return (
                      <div
                        key={lvl}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isCurrent
                            ? 'bg-amber-500/20 border-amber-400/80 text-amber-200 ring-1 ring-amber-400/50'
                            : isUnlocked
                            ? 'bg-white/5 border-white/10 text-gray-200'
                            : 'bg-black/40 border-white/5 text-gray-500 opacity-70'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${getWealthBadgeStyle(lvl)}`}>
                            {lvl}
                          </span>
                          <div>
                            <p className="font-bold text-white">{getWealthLevelTitle(lvl)}</p>
                            <span className="text-[9px] text-gray-400">{req.toLocaleString()} total coins sent</span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <span className="text-[10px] font-black text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400 flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHARISMA LEVEL (GIFTS RECEIVED) */}
          {activeTab === 'charisma' && (
            <div className="space-y-4">
              {/* Giant Badge Banner */}
              <div className="bg-gradient-to-br from-pink-950/60 via-purple-950/40 to-black border border-pink-500/40 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-rose-500 to-purple-700 p-1 shadow-2xl ring-4 ring-pink-500/30">
                  <div className="w-full h-full rounded-full bg-black/80 flex flex-col items-center justify-center border border-pink-300/50">
                    <Heart className="w-6 h-6 text-pink-400 mb-0.5" />
                    <span className="text-xs font-black text-pink-200">LV.{charismaStats.level}</span>
                  </div>
                </div>

                <div>
                  <span className={`inline-block text-xs font-black px-3 py-1 rounded-full ${getCharismaBadgeStyle(charismaStats.level)}`}>
                    {charismaStats.title}
                  </span>
                  <p className="text-[11px] text-pink-200/80 mt-1.5 font-medium">
                    Charisma EXP: <strong className="text-pink-300">{diamondsEarned.toLocaleString()} 💎 received</strong>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 text-left bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs font-bold text-pink-200">
                    <span>Level {charismaStats.level} Progress</span>
                    <span>{charismaStats.exp.toLocaleString()} / {charismaStats.nextExp.toLocaleString()} EXP</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-pink-500/20">
                    <div
                      className="bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 h-full rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${charismaStats.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-right">
                    {100 - charismaStats.progressPercent}% until LV.{Math.min(100, charismaStats.level + 1)}
                  </p>
                </div>
              </div>

              {/* Unlocked Privileges */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <h3 className="text-xs font-bold text-pink-300 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-pink-400" />
                  <span>Unlocked Charisma Perks</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {getCharismaPrivileges(charismaStats.level).map((perk, i) => (
                    <div key={i} className="flex items-center space-x-1.5 bg-black/30 p-2 rounded-xl border border-white/5 text-[11px] text-gray-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1 - 100 Milestones Table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                    <span>Charisma Milestones (1 - 100)</span>
                  </h3>
                  <span className="text-[10px] text-pink-400 font-medium">1 Diamond = 1 EXP</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {milestoneLevels.map((lvl) => {
                    const req = getThresholdForLevel(lvl);
                    const isUnlocked = charismaStats.level >= lvl;
                    const isCurrent = charismaStats.level === lvl;

                    return (
                      <div
                        key={lvl}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isCurrent
                            ? 'bg-pink-500/20 border-pink-400/80 text-pink-200 ring-1 ring-pink-400/50'
                            : isUnlocked
                            ? 'bg-white/5 border-white/10 text-gray-200'
                            : 'bg-black/40 border-white/5 text-gray-500 opacity-70'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${getCharismaBadgeStyle(lvl)}`}>
                            {lvl}
                          </span>
                          <div>
                            <p className="font-bold text-white">{getCharismaLevelTitle(lvl)}</p>
                            <span className="text-[9px] text-gray-400">{req.toLocaleString()} 💎 received</span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <span className="text-[10px] font-black text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400 flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SVIP TIERS */}
          {activeTab === 'svip' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-950/70 via-purple-950/60 to-black border border-amber-400/50 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
                <Crown className="w-10 h-10 text-yellow-400 mx-auto animate-bounce" />
                <h3 className="text-base font-black text-amber-300">SVIP Royal Club</h3>
                <p className="text-xs text-gray-300">Exclusive privileges, golden entrance mounts, & global priority</p>

                <div className="pt-2">
                  <span className="inline-block bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black text-xs px-3 py-1 rounded-full border border-amber-200 shadow-lg">
                    Current Rank: {user.svip ? `SVIP ${currentSvipTier}` : 'Not SVIP'}
                  </span>
                </div>
              </div>

              {/* SVIP Tiers 1 through 9 */}
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((tier) => {
                  const isActive = currentSvipTier >= tier;
                  return (
                    <div
                      key={tier}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-400/60 text-amber-200'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-black text-xs flex items-center justify-center border border-amber-200 shadow-md shrink-0">
                          S{tier}
                        </span>
                        <div>
                          <p className="font-bold text-white text-xs">SVIP Tier {tier}</p>
                          <p className="text-[10px] text-gray-300">
                            {tier <= 3 ? 'Golden Car Entrance + Room Banner' : tier <= 6 ? 'Global Room Announce + 3x Diamond Cashout' : 'Supreme Sovereign Aura + Personal Concierge'}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Unlock at Store
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-black/60 text-center text-[10px] text-gray-400">
          💡 Send virtual gifts to level up <strong className="text-amber-300">Wealth LV</strong> • Receive gifts while streaming for <strong className="text-pink-300">Charisma LV</strong>
        </div>

      </div>
    </div>
  );
}
