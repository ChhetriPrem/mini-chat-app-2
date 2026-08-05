import React, { useState } from 'react';
import { X, FileText, Image, Heart, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MyPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PostItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

const SAMPLE_POSTS: PostItem[] = [
  {
    id: 'p1',
    authorName: 'Aarav (Patron)',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: 'Just finished an awesome 2-hour voice room stream! Thanks to all who sent virtual gifts today! 👑🔥',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    likes: 142,
    comments: 18,
    timeAgo: '2h ago',
  },
  {
    id: 'p2',
    authorName: 'Aarav (Patron)',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: 'Who wants to join my voice stage tonight at 9 PM IST? Drop your ID below! 🎤✨',
    likes: 89,
    comments: 24,
    timeAgo: '1d ago',
  },
];

export function MyPostsModal({ isOpen, onClose }: MyPostsModalProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>(SAMPLE_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: PostItem = {
      id: 'p_' + Date.now(),
      authorName: user.name,
      authorAvatar: user.avatar,
      content: newPostContent,
      likes: 0,
      comments: 0,
      timeAgo: 'Just now',
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    showToast('Post published to Feed! 📝');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#18112e] via-[#0f0a1f] to-[#080512] border border-blue-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40">
              <FileText className="w-5 h-5 text-blue-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">My Posts & Feed</h2>
              <p className="text-[10px] text-gray-400">Share updates, pictures & announcements with fans</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-blue-600 text-white text-xs font-black rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Scrollable Feed */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* New Post Creator Box */}
          <form onSubmit={handleCreatePost} className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-start space-x-2.5">
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40 shrink-0" />
              <textarea
                placeholder="What's on your mind? Share with your fans..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none h-16"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => showToast('Image attachment coming soon!')}
                className="flex items-center space-x-1 text-[11px] text-blue-300 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 hover:bg-blue-500/20"
              >
                <Image className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-xs font-black text-white shadow-md hover:scale-105 flex items-center space-x-1"
              >
                <span>Post</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Posts List */}
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center space-x-2.5">
                  <img src={post.authorAvatar} alt={post.authorName} className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{post.authorName}</h4>
                    <span className="text-[10px] text-gray-400">{post.timeAgo}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-200 leading-relaxed">{post.content}</p>

                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post Attachment" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                )}

                <div className="flex items-center space-x-4 pt-1 border-t border-white/5 text-[11px] text-gray-400">
                  <button
                    onClick={() => {
                      setPosts(posts.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1 } : p)));
                    }}
                    className="flex items-center space-x-1 hover:text-pink-400"
                  >
                    <Heart className="w-3.5 h-3.5 text-pink-500" />
                    <span>{post.likes}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>{post.comments} Comments</span>
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
