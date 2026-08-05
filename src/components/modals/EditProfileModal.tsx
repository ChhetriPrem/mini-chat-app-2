import React, { useEffect, useState } from 'react';
import { X, User as UserIcon, AtSign, FileText, Globe, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
];

const COUNTRIES: { name: string; flag: string }[] = [
  { name: 'India', flag: '🇮🇳' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'UK', flag: '🇬🇧' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Canada', flag: '🇨🇦' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateUser } = useAuth();

  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [country, setCountry] = useState(user.country);

  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [handleMsg, setHandleMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset local form state whenever the modal is (re)opened with the latest profile data
  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setHandle(user.handle);
      setBio(user.bio);
      setAvatar(user.avatar);
      setCountry(user.country);
      setError('');
      setSuccess('');
      setHandleStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Live handle-availability check against the real profiles table
  useEffect(() => {
    if (!isOpen) return;
    const clean = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (clean === user.handle.toLowerCase()) {
      setHandleStatus('idle');
      setHandleMsg('');
      return;
    }

    if (!clean || clean.length < 3) {
      setHandleStatus('invalid');
      setHandleMsg('Handle must be at least 3 alphanumeric characters');
      return;
    }

    setHandleStatus('checking');
    const timer = setTimeout(async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('handle', clean)
            .neq('id', profile?.id || '')
            .maybeSingle();

          if (data) {
            setHandleStatus('taken');
            setHandleMsg(`@${clean} is already taken`);
          } else {
            setHandleStatus('available');
            setHandleMsg(`@${clean} is available!`);
          }
        } catch {
          setHandleStatus('idle');
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [handle, isOpen, profile?.id, user.handle]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Display name cannot be empty.');
      return;
    }
    if (handleStatus === 'taken' || handleStatus === 'invalid') {
      setError('Please choose a valid, available handle.');
      return;
    }

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const countryFlag = COUNTRIES.find((c) => c.name === country)?.flag || user.countryFlag;

    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        handle: cleanHandle,
        bio: bio.trim(),
        avatar,
        country,
        countryFlag,
      });
      setSuccess('Profile updated successfully! ✅');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 900);
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0f0826] border border-indigo-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4 text-white max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-pink-400" />
          <span>Edit Profile</span>
        </h2>

        {error && (
          <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300 font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-bold text-center">
            {success}
          </div>
        )}

        {/* Avatar Selector */}
        <div>
          <div className="flex items-center justify-center mb-2">
            <img src={avatar} alt="avatar preview" className="w-16 h-16 rounded-full object-cover ring-4 ring-pink-500/50" />
          </div>
          <label className="text-[10px] font-bold text-slate-300 mb-1 block">Choose Avatar</label>
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            {PRESET_AVATARS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setAvatar(url)}
                className={`shrink-0 rounded-full p-0.5 border-2 transition-all ${
                  avatar === url ? 'border-pink-500 scale-110 ring-2 ring-pink-500/50' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} className="w-9 h-9 rounded-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center space-x-1">
            <UserIcon className="w-3 h-3 text-indigo-400" />
            <span>Display Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Handle */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center space-x-1">
            <AtSign className="w-3 h-3 text-indigo-400" />
            <span>Handle / @Username</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your_handle"
              className={`w-full bg-black/50 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                handleStatus === 'taken' || handleStatus === 'invalid'
                  ? 'border-red-500'
                  : handleStatus === 'available'
                  ? 'border-emerald-500'
                  : 'border-white/15 focus:border-indigo-500'
              }`}
            />
            {handleStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute right-3 top-3" />}
            {handleStatus === 'available' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-3" />}
            {handleStatus === 'taken' && <AlertCircle className="w-3.5 h-3.5 text-red-400 absolute right-3 top-3" />}
          </div>
          {handleMsg && (
            <p className={`text-[9px] mt-0.5 ${handleStatus === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>{handleMsg}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center space-x-1">
            <FileText className="w-3 h-3 text-indigo-400" />
            <span>Bio</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 140))}
            placeholder="Tell people about yourself..."
            rows={2}
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <p className="text-[9px] text-slate-500 mt-0.5 text-right">{bio.length}/140</p>
        </div>

        {/* Country */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center space-x-1">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Country</span>
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};