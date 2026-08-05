import React, { useState } from 'react';
import { X, Heart, Sparkles, UserPlus, Crown, Flame, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CPSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CPSpaceModal({ isOpen, onClose }: CPSpaceModalProps) {
  const { user, followingProfiles } = useAuth();
  const [cpPartner, setCpPartner] = useState<any | null>(null);
  const [intimacyScore, setIntimacyScore] = useState(1314);
  const [cpRingLevel, setCpRingLevel] = useState(2);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSendProposal = (prof: any) => {
    setCpPartner({
      id: prof.id,
      name: prof.name,
      avatar: prof.avatar,
      handle: prof.handle,
    });
    setIntimacyScore(520);
    setCpRingLevel(1);
    showToast(`CP proposal accepted! You and ${prof.name} are now a CP 💕`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#330a21] via-[#1d0513] to-[#0a0207] border border-pink-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40">
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">CP (Couple) Connection Space</h2>
              <p className="text-[10px] text-pink-200">Pair up with a partner, increase Intimacy & earn CP rings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-bold rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* ACTIVE CP CARD */}
          {cpPartner ? (
            <div className="bg-gradient-to-br from-pink-950/80 via-rose-950/60 to-black border border-pink-400/50 p-4 rounded-2xl text-center space-y-3 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-center space-x-4">
                {/* User Avatar */}
                <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-pink-500/60" />
                  <span className="text-xs absolute -bottom-1 -right-1 bg-pink-500 text-white p-1 rounded-full">💖</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-2xl animate-pulse">💖</span>
                  <span className="text-[10px] font-black text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                    LV.{cpRingLevel} Ring
                  </span>
                </div>

                {/* Partner Avatar */}
                <div className="relative">
                  <img src={cpPartner.avatar} alt={cpPartner.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-pink-500/60" />
                  <span className="text-xs absolute -bottom-1 -right-1 bg-pink-500 text-white p-1 rounded-full">💖</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-white">{user.name} ❤️ {cpPartner.name}</h3>
                <p className="text-[11px] text-pink-200 mt-0.5">Intimacy Score: <strong className="text-pink-400 font-extrabold">{intimacyScore.toLocaleString()} pts</strong></p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIntimacyScore(intimacyScore + 100);
                    showToast('Sent Intimacy Gift! +100 Intimacy Points 💕');
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl text-xs font-black text-white shadow-md hover:scale-[1.02]"
                >
                  Send CP Gift (+100)
                </button>
                <button
                  onClick={() => {
                    setCpPartner(null);
                    showToast('CP Connection ended.');
                  }}
                  className="py-2 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-gray-300"
                >
                  End CP
                </button>
              </div>
            </div>
          ) : (
            /* NO CP: PROPOSE TO CONTACTS */
            <div className="space-y-3">
              <div className="bg-pink-950/40 border border-pink-500/30 p-3 rounded-2xl text-center space-y-1">
                <Heart className="w-8 h-8 text-pink-400 mx-auto animate-bounce" />
                <h3 className="text-xs font-black text-white">Find Your CP Partner</h3>
                <p className="text-[10px] text-pink-200">Send a CP proposal to one of your followed contacts</p>
              </div>

              <h4 className="text-xs font-bold text-gray-300">Select a followed contact to propose:</h4>

              <div className="space-y-2">
                {followingProfiles.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Follow creators first to propose CP!</p>
                ) : (
                  followingProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className="bg-white/5 border border-white/10 p-2.5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img src={prof.avatar} alt={prof.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/40" />
                        <div>
                          <p className="text-xs font-bold text-white">{prof.name}</p>
                          <span className="text-[10px] text-gray-400">@{prof.handle}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendProposal(prof)}
                        className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-[10px] rounded-full shadow-md hover:scale-105"
                      >
                        Propose CP 💍
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CP Privileges Info */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-pink-300 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CP Perks & Privileges</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300">
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">💍 Joint Entrance Banner in Live Rooms</div>
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">💖 Special Heart Badge on Profile</div>
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">👑 CP Leaderboard Ranking</div>
              <div className="bg-black/30 p-2 rounded-xl border border-white/5">💬 Private CP Direct Chat Room</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
