import React, { useState, useEffect } from 'react';
import { X, Trophy, Heart } from 'lucide-react';
import { StreamRoom } from '../../types';
import { calculateWealthLevel, calculateCharismaLevel } from '../../lib/levels';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'creators' | 'gifters'>('creators');
  const [streams, setStreams] = useState<StreamRoom[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/streams')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setStreams(data);
        })
        .catch((err) => console.error('Failed to load leaderboard streams:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#150a30] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="text-base font-black text-white">Daily Leaderboard</h2>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setTab('creators')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'creators' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Hosts (Charisma) 🎤
          </button>
          <button
            onClick={() => setTab('gifters')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'gifters' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Gifters (Wealth) 👑
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {streams.map((s, idx) => {
            const charLvl = s.host.charismaLevel || calculateCharismaLevel(s.host.totalDiamondsEarned || s.host.diamonds || 1200).level;
            const wealthLvl = s.host.wealthLevel || s.host.level || calculateWealthLevel(s.host.totalCoinsSpent || 1500).level;

            return (
              <div
                key={s.id}
                className="bg-white/5 border border-white/10 p-2.5 rounded-2xl flex items-center space-x-3 justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`font-extrabold text-sm shrink-0 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                    #{idx + 1}
                  </span>
                  <img src={s.host.avatar} alt={s.host.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/50 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{s.host.name}</p>
                    <div className="flex items-center space-x-1 pt-0.5">
                      {tab === 'creators' ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center space-x-0.5">
                          <Heart className="w-2.5 h-2.5" />
                          <span>Charm LV.{charLvl}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-0.5">
                          <Trophy className="w-2.5 h-2.5" />
                          <span>Wealth LV.{wealthLvl}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {tab === 'creators' ? (
                    <span className="text-xs font-black text-pink-300">💎 {((s.host.diamonds || 500) * (idx + 1)).toLocaleString()}</span>
                  ) : (
                    <span className="text-xs font-black text-amber-300">🪙 {((s.host.coins || 1000) * (idx + 1) * 3).toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
