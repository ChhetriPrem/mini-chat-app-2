import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Check, UserPlus, ShieldCheck, Crown, Users2, Sparkles, Trophy, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LevelDetailsModal } from './LevelDetailsModal';
import {
  calculateWealthLevel,
  calculateCharismaLevel,
  getWealthBadgeStyle,
  getCharismaBadgeStyle,
} from '../../lib/levels';

interface ViewProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onOpenChatWithUser: (user: { id: string; name: string; avatar: string; handle: string }) => void;
}

interface RemoteProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  country?: string;
  countryFlag?: string;
  level?: number;
  wealthLevel?: number;
  charismaLevel?: number;
  vipLevel?: number;
  svip?: boolean;
  svipLevel?: number;
  isVerified?: boolean;
  isAgency?: boolean;
  followers?: number;
  following?: number;
  friends?: number;
  visitors?: number;
  totalCoinsSpent?: number;
  totalDiamondsEarned?: number;
  isOnline?: boolean;
  isMutual?: boolean;
}

export const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ userId, onClose, onOpenChatWithUser }) => {
  const { followingIds, toggleFollow, visitProfile, fetchUserProfileById } = useAuth();
  const [remote, setRemote] = useState<RemoteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLevelDetailsOpen, setIsLevelDetailsOpen] = useState(false);
  const [levelDetailsTab, setLevelDetailsTab] = useState<'wealth' | 'charisma' | 'svip'>('wealth');

  useEffect(() => {
    if (!userId) {
      setRemote(null);
      return;
    }
    setLoading(true);
    fetchUserProfileById(userId).then((data) => {
      setRemote(data);
      setLoading(false);
      // Log a real, DB-tracked visit the moment their profile card is actually viewed.
      visitProfile(userId).then((updatedVisitors) => {
        if (typeof updatedVisitors === 'number') {
          setRemote((prev) => (prev ? { ...prev, visitors: updatedVisitors } : prev));
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!userId) return null;

  const isFollowing = followingIds.has(userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#110729] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !remote ? (
          <div className="py-16 text-center text-xs text-gray-400 animate-pulse">Loading profile...</div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="relative">
                <img
                  src={remote.avatar}
                  alt={remote.name}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-400/70 shadow-2xl"
                />
                {remote.svip && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-300" />}
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#110729] ${
                    remote.isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                  }`}
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <h2 className="text-lg font-black text-white">{remote.name}</h2>
                {remote.countryFlag && <span className="text-base">{remote.countryFlag}</span>}
              </div>
              <p className="text-xs text-gray-400">@{remote.handle}</p>

              {remote.bio && <p className="text-xs text-purple-200/90 max-w-xs">{remote.bio}</p>}

              <div className="flex items-center space-x-1.5 flex-wrap justify-center pt-1 gap-y-1">
                {(() => {
                  const wStats = calculateWealthLevel(remote.totalCoinsSpent ?? ((remote.level || remote.wealthLevel || 1) * (remote.level || remote.wealthLevel || 1) * 100));
                  const cStats = calculateCharismaLevel(remote.totalDiamondsEarned ?? ((remote.charismaLevel || 1) * (remote.charismaLevel || 1) * 100));

                  return (
                    <>
                      <button
                        onClick={() => {
                          setLevelDetailsTab('wealth');
                          setIsLevelDetailsOpen(true);
                        }}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 hover:scale-105 transition-transform ${getWealthBadgeStyle(wStats.level)}`}
                      >
                        <Trophy className="w-2.5 h-2.5" />
                        <span>Wealth LV.{wStats.level}</span>
                      </button>

                      <button
                        onClick={() => {
                          setLevelDetailsTab('charisma');
                          setIsLevelDetailsOpen(true);
                        }}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 hover:scale-105 transition-transform ${getCharismaBadgeStyle(cStats.level)}`}
                      >
                        <Heart className="w-2.5 h-2.5" />
                        <span>Charisma LV.{cStats.level}</span>
                      </button>
                    </>
                  );
                })()}

                {remote.svip && (
                  <button
                    onClick={() => {
                      setLevelDetailsTab('svip');
                      setIsLevelDetailsOpen(true);
                    }}
                    className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-[10px] font-black px-2.5 py-0.5 rounded-full text-black border border-amber-200 shadow-md flex items-center space-x-0.5 hover:scale-105 transition-transform"
                  >
                    <Crown className="w-2.5 h-2.5" />
                    <span>SVIP{remote.svipLevel ? ` ${remote.svipLevel}` : ''}</span>
                  </button>
                )}
                {remote.isAgency && (
                  <span className="bg-purple-900/60 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-200">
                    Agency
                  </span>
                )}
                {remote.isVerified && (
                  <span className="bg-pink-900/60 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/30 text-pink-200 flex items-center space-x-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Verified</span>
                  </span>
                )}
                {remote.isMutual && (
                  <span className="bg-indigo-900/60 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 text-indigo-200 flex items-center space-x-0.5">
                    <Users2 className="w-2.5 h-2.5" />
                    <span>Mutual</span>
                  </span>
                )}
              </div>
            </div>

            {/* Real DB-backed stats */}
            <div className="grid grid-cols-4 gap-2 text-center bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div>
                <span className="text-sm font-black text-white">{(remote.friends ?? 0).toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 font-medium">Friends</p>
              </div>
              <div>
                <span className="text-sm font-black text-white">{(remote.following ?? 0).toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 font-medium">Following</p>
              </div>
              <div>
                <span className="text-sm font-black text-white">{(remote.followers ?? 0).toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 font-medium">Followers</p>
              </div>
              <div>
                <span className="text-sm font-black text-white">{(remote.visitors ?? 0).toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 font-medium">Visitors</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => toggleFollow(remote.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  isFollowing
                    ? 'bg-white/10 text-slate-200 border border-white/20'
                    : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md'
                }`}
              >
                {isFollowing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </button>

              <button
                onClick={() =>
                  onOpenChatWithUser({ id: remote.id, name: remote.name, avatar: remote.avatar, handle: remote.handle })
                }
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 rounded-xl text-xs font-black text-white flex items-center justify-center space-x-1.5 shadow-md transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Level Details Modal */}
      {remote && (
        <LevelDetailsModal
          isOpen={isLevelDetailsOpen}
          onClose={() => setIsLevelDetailsOpen(false)}
          user={{
            id: remote.id,
            name: remote.name,
            handle: remote.handle,
            avatar: remote.avatar,
            bio: remote.bio || '',
            country: remote.country || 'India',
            countryFlag: remote.countryFlag || '🇮🇳',
            level: remote.level || 1,
            wealthLevel: remote.wealthLevel || remote.level || 1,
            charismaLevel: remote.charismaLevel || 1,
            vipLevel: remote.vipLevel || 0,
            svip: remote.svip || false,
            svipLevel: remote.svipLevel || 0,
            isVerified: remote.isVerified || false,
            followers: remote.followers || 0,
            following: remote.following || 0,
            friends: remote.friends || 0,
            visitors: remote.visitors || 0,
            coins: 1000,
            diamonds: 0,
            totalCoinsSpent: remote.totalCoinsSpent,
            totalDiamondsEarned: remote.totalDiamondsEarned,
          }}
          initialTab={levelDetailsTab}
        />
      )}
    </div>
  );
};