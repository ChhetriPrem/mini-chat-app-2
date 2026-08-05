import React, { useState } from 'react';
import { X, Video, Heart, Eye, Plus, Play, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MyVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReelItem {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  duration: string;
}

const SAMPLE_VIDEOS: ReelItem[] = [
  { id: 'v1', title: 'Highlight from tonight voice room PK! 🔥', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600', views: 1240, likes: 320, duration: '0:15' },
  { id: 'v2', title: 'Singing my favorite song live! 🎤✨', thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600', views: 890, likes: 210, duration: '0:30' },
  { id: 'v3', title: 'Late night chill chat with family clan 👑', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600', views: 3400, likes: 950, duration: '0:45' },
];

export function MyVideosModal({ isOpen, onClose }: MyVideosModalProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<ReelItem[]>(SAMPLE_VIDEOS);
  const [activePlayback, setActivePlayback] = useState<ReelItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleUploadVideo = () => {
    const newVideo: ReelItem = {
      id: 'v_' + Date.now(),
      title: 'New Creator Short Reel Clip',
      thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
      views: 1,
      likes: 0,
      duration: '0:20',
    };
    setVideos([newVideo, ...videos]);
    showToast('Short video reel uploaded successfully! 🎬');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#330d24] via-[#1d0715] to-[#0a0207] border border-pink-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40">
              <Video className="w-5 h-5 text-pink-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">My Short Videos & Reels</h2>
              <p className="text-[10px] text-gray-400">Manage uploaded video clips & view engagement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload bar */}
        <div className="p-3 bg-pink-950/40 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs text-pink-200 font-bold">{videos.length} Videos Uploaded</span>
          <button
            onClick={handleUploadVideo}
            className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs rounded-full shadow-md flex items-center space-x-1 hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Reel</span>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-pink-600 text-white text-xs font-black rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Video Player Overlay */}
        {activePlayback && (
          <div className="p-3 bg-black/90 border-b border-pink-500/40 space-y-2">
            <div className="flex justify-between items-center text-xs text-white">
              <span className="font-bold truncate">{activePlayback.title}</span>
              <button onClick={() => setActivePlayback(null)} className="text-gray-400 hover:text-white">Close Player</button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-white/10 flex items-center justify-center">
              <img src={activePlayback.thumbnail} alt="Playback" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center animate-pulse shadow-lg">
                  <Play className="w-6 h-6 fill-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {videos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActivePlayback(vid)}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all cursor-pointer group relative"
              >
                <div className="aspect-[3/4] relative bg-black">
                  <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2 flex flex-col justify-between">
                    <span className="self-end bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {vid.duration}
                    </span>

                    <div>
                      <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{vid.title}</p>
                      <div className="flex items-center space-x-2 text-[9px] text-gray-300 pt-1">
                        <span className="flex items-center space-x-0.5">
                          <Eye className="w-2.5 h-2.5 text-blue-300" />
                          <span>{vid.views}</span>
                        </span>
                        <span className="flex items-center space-x-0.5">
                          <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                          <span>{vid.likes}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
