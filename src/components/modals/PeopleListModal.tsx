import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, UserCheck, UserPlus, Lock, Check, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface PersonListItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  country?: string;
  countryFlag?: string;
  isOnline: boolean;
  isMutual: boolean;
  visitedAt?: string | null;
}

export type PeopleListKind = 'friends' | 'following' | 'followers' | 'visitors';

const KIND_CONFIG: Record<PeopleListKind, { title: string; icon: React.ReactNode; emptyText: string; endpoint: string }> = {
  friends: { title: 'Friends', icon: <UserCheck className="w-5 h-5" />, emptyText: "You don't have any mutual friends yet", endpoint: '/api/user/friends' },
  following: { title: 'Following', icon: <UserCheck className="w-5 h-5" />, emptyText: "You're not following anyone yet", endpoint: '/api/user/following' },
  followers: { title: 'Followers', icon: <UserCheck className="w-5 h-5" />, emptyText: 'No followers yet', endpoint: '/api/user/followers' },
  visitors: { title: 'Visitors', icon: <Eye className="w-5 h-5" />, emptyText: 'No one has visited your profile yet', endpoint: '/api/user/visitors' },
};

interface PeopleListModalProps {
  kind: PeopleListKind;
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithUser: (user: { id: string; name: string; avatar: string; handle: string }) => void;
  onViewProfile?: (userId: string) => void;
}

export const PeopleListModal: React.FC<PeopleListModalProps> = ({
  kind,
  isOpen,
  onClose,
  onOpenChatWithUser,
  onViewProfile,
}) => {
  const { user, followingIds, toggleFollow } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<PersonListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const config = KIND_CONFIG[kind];

  // Always fetch fresh from the server when opened — this list is only
  // ever real, DB-backed data, never a locally-cached or mock snapshot.
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    setLoading(true);
    fetch(`${config.endpoint}?userId=${user.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPeople(Array.isArray(data) ? data : []))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, [isOpen, kind, user?.id]);

  if (!isOpen) return null;

  const filtered = people.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleMessageUser = (targetUser: PersonListItem) => {
    onOpenChatWithUser({ id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar, handle: targetUser.handle });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#130a2e] border border-white/10 rounded-t-3xl sm:rounded-3xl p-4 space-y-4 max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl text-white shadow-lg">
              {config.icon}
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-1.5">
                <span>{config.title}</span>
                <span className="text-xs font-bold text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                  {loading ? '…' : people.length}
                </span>
              </h2>
              <p className="text-[10px] text-gray-400">Live data from your account — updates every time you open this</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, handle or bio..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 animate-pulse">Loading {config.title.toLowerCase()}...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              {config.icon}
              <p className="text-xs text-gray-400 font-medium">{people.length === 0 ? config.emptyText : 'No matches found'}</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isCurrentlyFollowed = followingIds.has(item.id);
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                  <button
                    onClick={() => onViewProfile?.(item.id)}
                    className="flex items-center space-x-3 min-w-0 flex-1 pr-2 text-left"
                    title={`View ${item.name}'s profile`}
                  >
                    <div className="relative shrink-0">
                      <img src={item.avatar} alt={item.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/60" />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#130a2e] ${
                          item.isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/50 animate-pulse' : 'bg-gray-500'
                        }`}
                        title={item.isOnline ? 'Online now' : 'Offline'}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white truncate">{item.name}</span>
                        {item.countryFlag && <span className="text-xs">{item.countryFlag}</span>}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-gray-400 truncate">@{item.handle}</span>
                        {item.isMutual && (
                          <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded-full">
                            Mutual
                          </span>
                        )}
                      </div>
                      {kind === 'visitors' && item.visitedAt ? (
                        <span className="text-[9px] text-purple-300/80 truncate">Visited {new Date(item.visitedAt).toLocaleString()}</span>
                      ) : item.bio ? (
                        <p className="text-[10px] text-gray-300/80 truncate mt-0.5">{item.bio}</p>
                      ) : null}
                    </div>
                  </button>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => toggleFollow(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${
                        isCurrentlyFollowed
                          ? 'bg-white/10 border-white/20 text-gray-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300'
                          : 'bg-gradient-to-r from-purple-600 to-pink-500 border-pink-400 text-white shadow-md'
                      }`}
                    >
                      {isCurrentlyFollowed ? <Check className="w-3 h-3 inline" /> : <UserPlus className="w-3 h-3 inline" />}
                    </button>

                    <button
                      onClick={() => handleMessageUser(item)}
                      className="p-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center space-x-1 text-xs font-bold"
                      title={`Message ${item.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300">
          <div className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">Direct messages are end-to-end encrypted</span>
          </div>
          <span className="text-gray-400 font-mono text-[9px]">vibelive_e2ee</span>
        </div>
      </div>
    </div>
  );
};
