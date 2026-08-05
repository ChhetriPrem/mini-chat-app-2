import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { LiveStreamView } from './views/LiveStreamView';
import { LiveFeedView } from './views/LiveFeedView';
import { ReelsView } from './views/ReelsView';
import { MessagesView } from './views/MessagesView';
import { ProfileView } from './views/ProfileView';
import { CreatorDashboardView } from './views/CreatorDashboardView';
import { WalletModal } from './components/modals/WalletModal';
import { GoLiveModal } from './components/modals/GoLiveModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { SearchModal } from './components/modals/SearchModal';
import { AuthModal } from './components/modals/AuthModal';
import { AdminPanelModal } from './components/modals/AdminPanelModal';
import { TasksModal } from './components/modals/TasksModal';
import { GiftDrawer } from './components/GiftDrawer';
import { AuthPage } from './views/AuthPage';
import { StreamRoom, RoomType } from './types';
import { useAuth } from './context/AuthContext';

// Inner app — only rendered when user is fully authenticated & non-null
function AuthenticatedApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'reel' | 'live' | 'message' | 'profile'>('home');
  const [activeHomeTab, setActiveHomeTab] = useState<'hot' | 'recommend'>('hot');
  const [selectedRoom, setSelectedRoom] = useState<StreamRoom | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string; avatar: string; handle: string } | null>(null);
  const [currentPath, setCurrentPath] = React.useState<string>(window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReelGiftOpen, setIsReelGiftOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);

  const openAdmin = () => {
    if (window.location.pathname !== '/admin') window.history.pushState({}, '', '/admin');
    setCurrentPath('/admin');
    setIsAdminOpen(true);
  };

  const closeAdmin = () => {
    if (window.location.pathname === '/admin') window.history.pushState({}, '', '/');
    setCurrentPath('/');
    setIsAdminOpen(false);
  };

  // user is guaranteed non-null here because AuthenticatedApp only mounts inside SocketProvider
  // which is only rendered after isAuthenticated === true
  const handleStartStream = async (title: string, category: string, type: RoomType, mode?: 'solo' | 'multi') => {
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, category, type,
          mode: mode || 'multi',
          country: user!.country || 'India',
          countryFlag: user!.countryFlag || '🇮🇳',
          tags: ['Live', category],
          host: user,
        }),
      });
      if (res.ok) { setSelectedRoom(await res.json()); return; }
    } catch (err) {
      console.error('Failed to create stream via API, using fallback:', err);
    }

    const fallbackRoom: StreamRoom = {
      id: `room_live_${Date.now()}`,
      title, type, mode: mode || 'multi', category,
      country: user!.country || 'India',
      countryFlag: user!.countryFlag || '🇮🇳',
      coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      viewerCount: 1, likeCount: 0,
      tags: ['Live', category],
      isHot: true, isRecommended: true, durationSeconds: 0,
      pinnedMessage: `Welcome everyone to ${title}! 👋`,
      host: user!,
      guests: [],
    };
    setSelectedRoom(fallbackRoom);
  };

  const isDirectAdminPage = currentPath.toLowerCase().startsWith('/admin');
  if (isDirectAdminPage) {
    return <AdminPanelModal isOpen={true} isPage={true} onClose={closeAdmin} />;
  }

  return (
    <div className="bg-[#0a0518] min-h-screen text-white font-sans selection:bg-pink-500 selection:text-white">
      <div className="max-w-md mx-auto min-h-screen relative bg-[#0f0826] shadow-2xl border-x border-white/5 overflow-x-hidden transform-gpu">
        {activeTab === 'home' && !selectedRoom && (
          <Header
            activeHomeTab={activeHomeTab}
            setActiveHomeTab={setActiveHomeTab}
            onSearchClick={() => setIsSearchOpen(true)}
            onLeaderboardClick={() => setIsLeaderboardOpen(true)}
            onWalletClick={() => setIsWalletOpen(true)}
            onNotificationsClick={() => setIsNotificationsOpen(true)}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onAdminClick={openAdmin}
          />
        )}

        {activeTab === 'home' && <HomeView activeHomeTab={activeHomeTab} onSelectRoom={(room) => setSelectedRoom(room)} onGoLiveClick={() => setIsGoLiveOpen(true)} />}
        {activeTab === 'reel' && <LiveFeedView onSelectStream={(room) => setSelectedRoom(room)} onOpenGiftDrawer={() => setIsReelGiftOpen(true)} />}
        {activeTab === 'message' && <MessagesView targetUser={selectedChatUser} onClearTargetUser={() => setSelectedChatUser(null)} />}
        {activeTab === 'profile' && (
          <ProfileView
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenCreatorDashboard={() => setActiveTab('live')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenChatWithUser={(targetUser) => { setSelectedChatUser(targetUser); setActiveTab('message'); }}
            onBack={() => setActiveTab('home')}
            onOpenAdminPanel={openAdmin}
          />
        )}
        {activeTab === 'live' && <CreatorDashboardView onGoLiveClick={() => setIsGoLiveOpen(true)} />}

        {!selectedRoom && (
          <>
            <button
              onClick={() => setIsTasksOpen(true)}
              aria-label="Open Tasks"
              className="fixed z-40 right-4 bottom-24 max-w-md mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-lg shadow-purple-500/40 flex items-center justify-center text-xl"
              style={{ right: 'calc(50% - 12.5rem + 1rem)' }}
            >
              🎯
            </button>
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onGoLiveClick={() => setIsGoLiveOpen(true)} />
          </>
        )}

        {selectedRoom && (
          <LiveStreamView
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
        <GoLiveModal isOpen={isGoLiveOpen} onClose={() => setIsGoLiveOpen(false)} onStartStream={handleStartStream} />
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <AdminPanelModal isOpen={isAdminOpen} onClose={closeAdmin} />
        <TasksModal isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} />
        <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectRoom={(room) => setSelectedRoom(room)} />
        <GiftDrawer isOpen={isReelGiftOpen} onClose={() => setIsReelGiftOpen(false)} onSendGift={(_gift, _count) => setIsReelGiftOpen(false)} onOpenWallet={() => setIsWalletOpen(true)} />
      </div>
    </div>
  );
}

// Mid-layer: handles loading + auth gate, then wraps SocketProvider only for authed users
function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0518] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25H12a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25z" />
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // SocketProvider is ONLY mounted after authentication is confirmed
  // This guarantees user is never null inside SocketContext or any child component
  return (
    <SocketProvider>
      <AuthenticatedApp />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
