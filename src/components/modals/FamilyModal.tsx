import React, { useState } from 'react';
import { X, Users, Shield, Trophy, UserPlus, Sparkles, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FamilyItem {
  id: string;
  name: string;
  tag: string;
  level: number;
  membersCount: number;
  maxMembers: number;
  leaderName: string;
  avatar: string;
  announcement: string;
}

const SAMPLE_FAMILIES: FamilyItem[] = [
  { id: 'fam1', name: 'Royal Phoenix Clan', tag: 'RPX', level: 12, membersCount: 48, maxMembers: 50, leaderName: 'Aarav (Patron)', avatar: '👑', announcement: 'Daily voice party at 9 PM! Top gifters get custom badges!' },
  { id: 'fam2', name: 'Celestial Stars', tag: 'CST', level: 9, membersCount: 35, maxMembers: 50, leaderName: 'Priya Live', avatar: '⭐', announcement: 'Welcome to all creators! Share videos and host live streams together.' },
  { id: 'fam3', name: 'Vanguard Gaming', tag: 'VNG', level: 6, membersCount: 22, maxMembers: 30, leaderName: 'Rohan Gamer', avatar: '⚡', announcement: 'Voice rooms open 24/7 for gamers and live chat lovers.' },
];

export function FamilyModal({ isOpen, onClose }: FamilyModalProps) {
  const { user } = useAuth();
  const [userFamily, setUserFamily] = useState<FamilyItem | null>(SAMPLE_FAMILIES[0]);
  const [activeTab, setActiveTab] = useState<'my' | 'explore' | 'create'>('my');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyTag, setNewFamilyTag] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName || !newFamilyTag) return;

    const created: FamilyItem = {
      id: 'fam_' + Date.now(),
      name: newFamilyName,
      tag: newFamilyTag.toUpperCase(),
      level: 1,
      membersCount: 1,
      maxMembers: 20,
      leaderName: user.name,
      avatar: '🛡️',
      announcement: 'Welcome to our brand new Family! Let us grow together.',
    };

    setUserFamily(created);
    setActiveTab('my');
    setNewFamilyName('');
    setNewFamilyTag('');
    showToast(`Family "${created.name}" created successfully! 🎉`);
  };

  const handleJoinFamily = (fam: FamilyItem) => {
    setUserFamily(fam);
    setActiveTab('my');
    showToast(`Joined ${fam.name}! 👥`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#180a33] via-[#100624] to-[#080214] border border-indigo-500/30 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Users className="w-5 h-5 text-indigo-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Family & Clan System</h2>
              <p className="text-[10px] text-gray-400">Join a family, level up together & share bonuses</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-2.5 bg-black/40 border-b border-white/10 flex gap-1.5">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            My Family
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'explore' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Explore Families
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            + Create
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">

          {/* TAB 1: MY FAMILY */}
          {activeTab === 'my' && (
            userFamily ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-black border border-indigo-400/40 p-4 rounded-2xl text-center space-y-2 relative overflow-hidden">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl border border-indigo-300">
                    {userFamily.avatar}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white">{userFamily.name}</h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                      [{userFamily.tag}] • LV.{userFamily.level}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 bg-black/40 p-2.5 rounded-xl border border-white/5 font-medium">
                    📢 "{userFamily.announcement}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-center pt-2">
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-gray-400 block">Members</span>
                      <span className="text-xs font-black text-indigo-300">{userFamily.membersCount} / {userFamily.maxMembers}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <span className="text-xs font-bold text-gray-400 block">Family Leader</span>
                      <span className="text-xs font-black text-amber-300">{userFamily.leaderName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Opening Family Chat... 💬')}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-xs font-extrabold text-white flex items-center justify-center space-x-1.5 shadow-md hover:scale-[1.01] transition-transform"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Family Group Chat</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Users className="w-10 h-10 text-gray-500 mx-auto opacity-50" />
                <p className="text-xs text-gray-300 font-medium">You haven't joined a family yet</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 bg-indigo-600 rounded-full text-xs font-bold text-white shadow-md hover:bg-indigo-500"
                >
                  Browse Families
                </button>
              </div>
            )
          )}

          {/* TAB 2: EXPLORE FAMILIES */}
          {activeTab === 'explore' && (
            <div className="space-y-2.5">
              {SAMPLE_FAMILIES.map((fam) => (
                <div key={fam.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between hover:bg-white/10 transition-all">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-2xl p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">{fam.avatar}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{fam.name}</h4>
                      <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 pt-0.5">
                        <span className="text-indigo-300 font-bold">[{fam.tag}]</span>
                        <span>• LV.{fam.level}</span>
                        <span>• {fam.membersCount}/{fam.maxMembers} Members</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinFamily(fam)}
                    className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-[10px] font-black text-white hover:scale-105 transition-all shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CREATE FAMILY */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateFamily} className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Phoenix"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Family Tag (3 Letters)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. RPX"
                  value={newFamilyTag}
                  onChange={(e) => setNewFamilyTag(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-[10px] text-indigo-200">
                💡 Creating a Family costs <strong>1,000 Coins</strong> and unlocks custom room tags & group chat.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl text-xs font-black text-white shadow-lg hover:opacity-90"
              >
                Create Family (1,000 Coins)
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
