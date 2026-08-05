import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateWealthLevel, calculateCharismaLevel } from '../lib/levels';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

export interface Profile {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  country?: string;
  country_flag?: string;
  level?: number;
  wealth_level?: number;
  charisma_level?: number;
  vip_level?: number;
  svip?: boolean;
  svip_level?: number;
  is_verified?: boolean;
  coins?: number;
  diamonds?: number;
  total_coins_spent?: number;
  total_diamonds_earned?: number;
  followers?: number;
  following?: number;
  friends?: number;
  visitors?: number;
  is_agency?: boolean;
}

export interface FollowedProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  country?: string;
  countryFlag?: string;
  isOnline: boolean;
  isMutual: boolean;
}

interface AuthContextType {
  user: User | null;
  session: any;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: { name: string; handle: string; email: string; password: string; avatar?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginUserWithPassword: (emailOrHandle: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupUser: (params: { name: string; handle: string; email: string; password: string; avatar?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginGuest: () => void;
  buyCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  addDiamonds: (amount: number) => void;
  updateUser: (updates: Partial<User>) => void;
  followingIds: Set<string>;
  toggleFollow: (userId: string) => void;
  refreshProfile: () => Promise<void>;
  followingProfiles: FollowedProfile[];
  followingLoading: boolean;
  refreshFollowingList: () => Promise<void>;
  visitProfile: (profileId: string) => Promise<number | null>;
  fetchUserProfileById: (id: string) => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const fetchProfile = async (userId: string, sessionRef?: any) => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else if (!data) {
        const sess = sessionRef || session;
        const newProfile: Partial<Profile> = {
          id: userId,
          name: sess?.user?.user_metadata?.full_name || sess?.user?.user_metadata?.name || sess?.user?.email?.split('@')[0] || 'User',
          handle: sess?.user?.user_metadata?.handle || `user_${userId.slice(0, 6)}`,
          avatar: sess?.user?.user_metadata?.avatar_url || sess?.user?.user_metadata?.avatar || FALLBACK_AVATAR,
        };
        const { data: inserted } = await supabase.from('profiles').insert(newProfile).select().single();
        if (inserted) setProfile(inserted);
      }
    } catch (err) {
      console.error('Error fetching Supabase profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) {
          setSession(data.session);
          if (data.session?.user) {
            fetchProfile(data.session.user.id, data.session).finally(() => {
              if (mounted) setIsLoading(false);
            });
          } else {
            setIsLoading(false);
          }
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          if (newSession?.user) {
            fetchProfile(newSession.user.id, newSession);
          } else {
            setProfile(null);
          }
        }
      });

      return () => {
        mounted = false;
        listener.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id, session);
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase not configured.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: error.message };
    if (data.user) await fetchProfile(data.user.id, data.session);
    return { success: true };
  };

  const signUp = async ({ name, handle, email, password, avatar, bio }: {
    name: string; handle: string; email: string; password: string; avatar?: string; bio?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase not configured.' };

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim()) return { success: false, error: 'Please enter your display name.' };
    if (!cleanHandle) return { success: false, error: 'Please enter a valid handle.' };
    if (!cleanEmail.includes('@')) return { success: false, error: 'Please enter a valid email.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const { data: existingHandle } = await supabase.from('profiles').select('id').eq('handle', cleanHandle).maybeSingle();
    if (existingHandle) return { success: false, error: 'Handle is already taken.' };

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: name.trim(), handle: cleanHandle, avatar: avatar || FALLBACK_AVATAR, bio: bio || '' } },
    });

    if (error) return { success: false, error: error.message };
    if (data.user) await fetchProfile(data.user.id, data.session);
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase not configured.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signInWithFacebook = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase not configured.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const loginGuest = () => {};

  const buyCoins = async (amount: number) => {
    if (profile && isSupabaseConfigured() && supabase) {
      const newCoins = (profile.coins || 0) + amount;
      setProfile((p) => p ? { ...p, coins: newCoins } : null);
      await supabase.from('profiles').update({ coins: newCoins }).eq('id', profile.id);
    }
  };

  const deductCoins = (amount: number): boolean => {
    const currentCoins = profile?.coins ?? 0;
    if (currentCoins >= amount) {
      const newCoins = currentCoins - amount;
      setProfile((p) => p ? { ...p, coins: newCoins } : null);
      if (isSupabaseConfigured() && supabase && profile)
        supabase.from('profiles').update({ coins: newCoins }).eq('id', profile.id);
      return true;
    }
    return false;
  };

  const addDiamonds = async (amount: number) => {
    if (profile && isSupabaseConfigured() && supabase) {
      const newDiamonds = (profile.diamonds || 0) + amount;
      setProfile((p) => p ? { ...p, diamonds: newDiamonds } : null);
      await supabase.from('profiles').update({ diamonds: newDiamonds }).eq('id', profile.id);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.countryFlag !== undefined) dbUpdates.country_flag = updates.countryFlag;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.wealthLevel !== undefined) dbUpdates.wealth_level = updates.wealthLevel;
    if (updates.charismaLevel !== undefined) dbUpdates.charisma_level = updates.charismaLevel;
    if (updates.vipLevel !== undefined) dbUpdates.vip_level = updates.vipLevel;
    if (updates.svip !== undefined) dbUpdates.svip = updates.svip;
    if (updates.svipLevel !== undefined) dbUpdates.svip_level = updates.svipLevel;
    if (updates.isAgency !== undefined) dbUpdates.is_agency = updates.isAgency;
    if (updates.coins !== undefined) dbUpdates.coins = updates.coins;
    if (updates.diamonds !== undefined) dbUpdates.diamonds = updates.diamonds;
    if (updates.totalCoinsSpent !== undefined) dbUpdates.total_coins_spent = updates.totalCoinsSpent;
    if (updates.totalDiamondsEarned !== undefined) dbUpdates.total_diamonds_earned = updates.totalDiamondsEarned;
    if (updates.followers !== undefined) dbUpdates.followers = updates.followers;
    if (updates.following !== undefined) dbUpdates.following = updates.following;
    if (updates.friends !== undefined) dbUpdates.friends = updates.friends;
    if (updates.visitors !== undefined) dbUpdates.visitors = updates.visitors;

    if (profile) {
      setProfile((p) => (p ? { ...p, ...dbUpdates } : null));
      if (isSupabaseConfigured() && supabase)
        await supabase.from('profiles').update(dbUpdates).eq('id', profile.id);
    }
  };

  const [followingProfiles, setFollowingProfiles] = useState<FollowedProfile[]>([]);
  const [followingLoading, setFollowingLoading] = useState<boolean>(false);

  const refreshFollowingList = async () => {
    if (!profile?.id) { setFollowingIds(new Set()); setFollowingProfiles([]); return; }
    setFollowingLoading(true);
    try {
      const res = await fetch(`/api/user/following?userId=${profile.id}`);
      const data = res.ok ? await res.json() : [];
      if (Array.isArray(data)) {
        setFollowingProfiles(data);
        setFollowingIds(new Set(data.map((item: any) => item.id)));
      }
    } catch (err) {
      console.error('Failed to load following list:', err);
    } finally {
      setFollowingLoading(false);
    }
  };

  useEffect(() => { refreshFollowingList(); }, [profile?.id]);

  const toggleFollow = async (targetUserId: string) => {
    const wasFollowing = followingIds.has(targetUserId);
    setFollowingIds((prev) => { const next = new Set(prev); wasFollowing ? next.delete(targetUserId) : next.add(targetUserId); return next; });
    if (wasFollowing) setFollowingProfiles((prev) => prev.filter((p) => p.id !== targetUserId));
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, followerId: profile?.id }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.followerCounts) setProfile((p) => (p ? { ...p, ...data.followerCounts } : p));
      if (!wasFollowing) refreshFollowingList();
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const visitProfile = async (profileId: string): Promise<number | null> => {
    if (!profile?.id || profileId === profile.id) return null;
    try {
      const res = await fetch('/api/user/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, visitorId: profile.id }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.visitors === 'number' ? data.visitors : null;
    } catch (err) { return null; }
  };

  const fetchUserProfileById = async (id: string): Promise<any | null> => {
    try {
      const res = await fetch(`/api/user/profile/${id}?viewerId=${profile?.id || ''}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) { return null; }
  };

  const coinsSpent = profile?.total_coins_spent ?? 0;
  const diamondsEarned = profile?.total_diamonds_earned ?? (profile?.diamonds ?? 0);
  const wealthStats = calculateWealthLevel(coinsSpent);
  const charismaStats = calculateCharismaLevel(diamondsEarned);

  const user: User | null = profile
    ? {
        id: profile.id,
        name: profile.name || 'User',
        handle: profile.handle || 'user',
        avatar: profile.avatar || FALLBACK_AVATAR,
        country: profile.country || 'India',
        countryFlag: profile.country_flag || '🇮🇳',
        level: wealthStats.level,
        wealthLevel: wealthStats.level,
        charismaLevel: charismaStats.level,
        vipLevel: profile.vip_level || 0,
        svip: profile.svip || false,
        svipLevel: profile.svip_level || (profile.svip ? 1 : 0),
        isVerified: profile.is_verified || false,
        bio: profile.bio || '',
        followers: profile.followers || 0,
        following: profile.following || 0,
        friends: profile.friends || 0,
        visitors: profile.visitors || 0,
        isAgency: profile.is_agency || false,
        coins: profile.coins ?? 5000,
        diamonds: profile.diamonds ?? 0,
        totalCoinsSpent: coinsSpent,
        totalDiamondsEarned: diamondsEarned,
      }
    : null;

  // ✅ CRITICAL FIX: isAuthenticated requires BOTH a valid session AND a loaded profile.
  // Previously it was `!!session?.user`, which became true BEFORE the async fetchProfile
  // resolved — causing `user` to be null while components already assumed it was set.
  // Now the app only transitions to "authenticated" state once user data is fully ready.
  const isAuthenticated = !!session?.user && !!profile;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithFacebook,
        signOut,
        loginUserWithPassword: signIn,
        signupUser: signUp,
        logout: signOut,
        loginGuest,
        buyCoins,
        deductCoins,
        addDiamonds,
        updateUser,
        followingIds,
        toggleFollow,
        refreshProfile,
        followingProfiles,
        followingLoading,
        refreshFollowingList,
        visitProfile,
        fetchUserProfileById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
