import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Activity,
  Users,
  Tv,
  Coins,
  DollarSign,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Crown,
  Key,
  FileText,
  Clock,
  Settings,
  X,
  UserCheck,
  ShoppingBag,
  CheckSquare,
  Shield,
  Heart,
  Building,
  Briefcase,
  MessageSquare,
  CreditCard,
  Video,
  Sparkles,
  Award,
  Trash2,
  Plus,
  Edit2,
  Check,
  Building2,
  Flame,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPage?: boolean;
}

interface AdminSession {
  username: string;
  role: string;
  token: string;
  lastLogin: string;
}

interface AnalyticsData {
  totalUsers: number;
  activeStreams: number;
  totalViewers: number;
  totalCoinsCirculating: number;
  totalDiamondsEarned: number;
  activeConnections: number;
  directMessagesCount: number;
  offlineRechargeRevenueUsd: number;
  pendingHostAppsCount: number;
  pendingBdAppsCount: number;
  systemHealth: string;
  serverUptimeHours: string;
  memoryUsageMB: string;
}

interface ChartDataPoint {
  day: string;
  users: number;
  streams: number;
  revenue: number;
}

interface UserItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  coins: number;
  diamonds: number;
  level: number;
  wealthLevel: number;
  charismaLevel: number;
  vipLevel: number;
  svip: boolean;
  isVerified?: boolean;
  isAgency?: boolean;
}

interface StreamItem {
  id: string;
  title: string;
  category: string;
  viewerCount: number;
  likeCount: number;
  isHot: boolean;
  isRecommended: boolean;
  pinnedMessage?: string;
  host: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  roleLevel: string;
  action: string;
  target: string;
  ip: string;
  severity: 'INFO' | 'WARNING' | 'SECURITY';
}

interface SystemConfig {
  maintenanceMode: boolean;
  coinRatePerUsd: number;
  hostCommissionPercent: number;
  aiModerationSensitivity: string;
  maxStreamBitrateKbps: number;
  allowOfflineRecharges: boolean;
}

type ModuleTab =
  | 'analytics'
  | 'users'
  | 'store'
  | 'tasks'
  | 'family'
  | 'vip'
  | 'cp'
  | 'bd'
  | 'agency'
  | 'posts'
  | 'offlineRecharges'
  | 'hosts'
  | 'videos'
  | 'streams'
  | 'logs'
  | 'config';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, isPage = false }) => {
  const { user, updateUser } = useAuth();

  // Auth State
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('vibelive_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginUsername, setLoginUsername] = useState('admin_master');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginRole, setLoginRole] = useState('Level 3 - Super Admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ModuleTab>('analytics');

  // Module Data States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Users
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editCoins, setEditCoins] = useState<number>(0);
  const [editDiamonds, setEditDiamonds] = useState<number>(0);
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editVipLevel, setEditVipLevel] = useState<number>(0);
  const [editSvip, setEditSvip] = useState<boolean>(false);

  // Store Items
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Mounts');
  const [newItemPrice, setNewItemPrice] = useState(5000);

  // Tasks
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [taskFormId, setTaskFormId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCoins, setNewTaskCoins] = useState(200);
  const [newTaskExp, setNewTaskExp] = useState(100);
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskType, setNewTaskType] = useState('daily');
  const [newTaskTargetCount, setNewTaskTargetCount] = useState(1);
  const [newTaskStatus, setNewTaskStatus] = useState('Active');

  // Families
  const [familiesList, setFamiliesList] = useState<any[]>([]);

  // VIP Tiers
  const [vipsList, setVipsList] = useState<any[]>([]);

  // CP Pairs
  const [cpList, setCpList] = useState<any[]>([]);

  // BD Center
  const [bdList, setBdList] = useState<any[]>([]);

  // Agency Center
  const [agencyList, setAgencyList] = useState<any[]>([]);

  // Community Posts
  const [postsList, setPostsList] = useState<any[]>([]);

  // Offline Recharges
  const [offlineRechargesList, setOfflineRechargesList] = useState<any[]>([]);

  // Host Center
  const [hostsList, setHostsList] = useState<any[]>([]);

  // Videos Reels
  const [videosList, setVideosList] = useState<any[]>([]);

  // Streams
  const [streamList, setStreamList] = useState<StreamItem[]>([]);

  // Security Logs & Config
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminSession) {
      loadTabContent(activeTab);
    }
  }, [adminSession, activeTab]);

  const loadTabContent = (tab: ModuleTab) => {
    if (tab === 'analytics') fetchAnalytics();
    else if (tab === 'users') fetchUsers();
    else if (tab === 'store') fetchStore();
    else if (tab === 'tasks') fetchTasks();
    else if (tab === 'family') fetchFamilies();
    else if (tab === 'vip') fetchVips();
    else if (tab === 'cp') fetchCps();
    else if (tab === 'bd') fetchBd();
    else if (tab === 'agency') fetchAgency();
    else if (tab === 'posts') fetchPosts();
    else if (tab === 'offlineRecharges') fetchOfflineRecharges();
    else if (tab === 'hosts') fetchHosts();
    else if (tab === 'videos') fetchVideos();
    else if (tab === 'streams') fetchStreams();
    else if (tab === 'logs') fetchAuditLogs();
    else if (tab === 'config') fetchSystemConfig();
  };

  const showStatus = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          role: loginRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const session: AdminSession = {
          username: data.admin.username,
          role: data.admin.role,
          token: data.token,
          lastLogin: data.admin.lastLogin,
        };
        setAdminSession(session);
        sessionStorage.setItem('vibelive_admin_session', JSON.stringify(session));
      } else {
        setLoginError(data.error || 'Invalid administrator security credentials.');
      }
    } catch {
      setLoginError('Authentication server connection error.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleAdminSignOut = () => {
    setAdminSession(null);
    sessionStorage.removeItem('vibelive_admin_session');
  };

  // Helper for authenticated requests
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminSession?.token || ''}`,
      'X-Admin-Role': adminSession?.role || 'Level 3 - Super Admin',
    };
  };

  // API Callers
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/admin/analytics', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        if (data.chartData?.userGrowth) setChartData(data.chartData.userGrowth);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(searchQuery)}`, { headers: getAuthHeaders() });
      if (res.ok) setUserList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchStore = async () => {
    try {
      const res = await fetch('/api/admin/store', { headers: getAuthHeaders() });
      if (res.ok) setStoreItems(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks', { headers: getAuthHeaders() });
      if (res.ok) setTasksList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchFamilies = async () => {
    try {
      const res = await fetch('/api/admin/families', { headers: getAuthHeaders() });
      if (res.ok) setFamiliesList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchVips = async () => {
    try {
      const res = await fetch('/api/admin/vips', { headers: getAuthHeaders() });
      if (res.ok) setVipsList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchCps = async () => {
    try {
      const res = await fetch('/api/admin/cps', { headers: getAuthHeaders() });
      if (res.ok) setCpList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchBd = async () => {
    try {
      const res = await fetch('/api/admin/bd', { headers: getAuthHeaders() });
      if (res.ok) setBdList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAgency = async () => {
    try {
      const res = await fetch('/api/admin/agency', { headers: getAuthHeaders() });
      if (res.ok) setAgencyList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts', { headers: getAuthHeaders() });
      if (res.ok) setPostsList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchOfflineRecharges = async () => {
    try {
      const res = await fetch('/api/admin/offline-recharges', { headers: getAuthHeaders() });
      if (res.ok) setOfflineRechargesList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchHosts = async () => {
    try {
      const res = await fetch('/api/admin/hosts', { headers: getAuthHeaders() });
      if (res.ok) setHostsList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/videos', { headers: getAuthHeaders() });
      if (res.ok) setVideosList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchStreams = async () => {
    try {
      const res = await fetch('/api/admin/streams', { headers: getAuthHeaders() });
      if (res.ok) setStreamList(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/admin/system/config', { headers: getAuthHeaders() });
      if (res.ok) setSystemConfig(await res.json());
    } catch (e) { console.error(e); }
  };

  // User Actions
  const handleSelectUser = (u: UserItem) => {
    setSelectedUser(u);
    setEditCoins(u.coins || 0);
    setEditDiamonds(u.diamonds || 0);
    setEditLevel(u.level || 1);
    setEditVipLevel(u.vipLevel || 0);
    setEditSvip(Boolean(u.svip));
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: selectedUser.id,
          updates: {
            coins: editCoins,
            diamonds: editDiamonds,
            level: editLevel,
            vipLevel: editVipLevel,
            svip: editSvip,
          }
        }),
      });

      if (res.ok) {
        if (selectedUser.id === user.id) {
          await updateUser({
            coins: editCoins,
            diamonds: editDiamonds,
            level: editLevel,
            vipLevel: editVipLevel,
            svip: editSvip,
          });
        }
        showStatus(`User ${selectedUser.name} updated.`);
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  // Store Item Save / Delete
  const handleSaveStoreItem = async () => {
    if (!newItemName) return;
    const res = await fetch('/api/admin/store/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: newItemName,
        category: newItemCategory,
        price: newItemPrice,
        days: 30,
        icon: newItemCategory === 'Mounts' ? '🏎️' : newItemCategory === 'Avatar Frame' ? '👑' : '💎',
        status: 'Active',
        salesCount: 0
      })
    });
    if (res.ok) {
      showStatus(`Store item "${newItemName}" added.`);
      setNewItemName('');
      fetchStore();
    }
  };

  const handleDeleteStoreItem = async (id: string) => {
    const res = await fetch('/api/admin/store/delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      showStatus('Store item deleted.');
      fetchStore();
    }
  };

  // Task Save, Edit, and Delete
  const resetTaskForm = () => {
    setTaskFormId(null);
    setNewTaskTitle('');
    setNewTaskCoins(200);
    setNewTaskExp(100);
    setNewTaskCategory('General');
    setNewTaskType('daily');
    setNewTaskTargetCount(1);
    setNewTaskStatus('Active');
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle) return;
    const res = await fetch('/api/admin/tasks/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: taskFormId || undefined,
        title: newTaskTitle,
        rewardCoins: newTaskCoins,
        rewardExp: newTaskExp,
        type: newTaskType,
        status: newTaskStatus,
        targetCount: newTaskTargetCount,
        category: newTaskCategory,
      })
    });
    if (res.ok) {
      showStatus(taskFormId ? `Task mission updated in database.` : `Task "${newTaskTitle}" created in database.`);
      resetTaskForm();
      fetchTasks();
    }
  };

  const handleEditTaskClick = (t: any) => {
    setTaskFormId(t.id);
    setNewTaskTitle(t.title || '');
    setNewTaskCoins(t.rewardCoins || 100);
    setNewTaskExp(t.rewardExp || 50);
    setNewTaskCategory(t.category || 'General');
    setNewTaskType(t.type || 'daily');
    setNewTaskTargetCount(t.targetCount || 1);
    setNewTaskStatus(t.status || 'Active');
  };

  const handleDeleteTask = async (id: string) => {
    const res = await fetch('/api/admin/tasks/delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      showStatus('Task mission deleted from database.');
      if (taskFormId === id) resetTaskForm();
      fetchTasks();
    }
  };

  // Offline Recharge Action
  const handleRechargeAction = async (id: string, status: 'Approved' | 'Rejected') => {
    const res = await fetch('/api/admin/offline-recharges/action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      showStatus(`Offline recharge request ${status}.`);
      fetchOfflineRecharges();
      fetchUsers();
    }
  };

  // Stream Action
  const handleStreamAction = async (roomId: string, action: string, payload: any = {}) => {
    const res = await fetch('/api/admin/streams/action', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ roomId, action, payload }),
    });
    if (res.ok) {
      showStatus(`Stream action executed: ${action}`);
      fetchStreams();
    }
  };

  // System Maintenance
  const handleToggleMaintenance = async () => {
    if (!systemConfig) return;
    const newMode = !systemConfig.maintenanceMode;
    const res = await fetch('/api/admin/system/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        updates: { maintenanceMode: newMode },
        actor: adminSession?.username,
      }),
    });
    if (res.ok) {
      setSystemConfig((prev) => prev ? { ...prev, maintenanceMode: newMode } : null);
      showStatus(`System Maintenance Mode set to: ${newMode ? 'ACTIVE' : 'OFF'}`);
    }
  };

  if (!isOpen && !isPage) return null;

  // Unauthenticated Gate
  if (!adminSession) {
    return (
      <div className={isPage ? "min-h-screen w-full bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans" : "fixed inset-0 z-[100] bg-[#090d16]/95 backdrop-blur-2xl flex items-center justify-center p-4 text-slate-100 font-sans"}>
        <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Enterprise Control Gate</h1>
              <p className="text-xs text-slate-400">Authenticated System Operations Portal</p>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Operator Identifier</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin_master"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Security Key Passphrase</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Default security key: <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">admin123</code></p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Authorization Clearance</label>
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="Level 3 - Super Admin">Level 3: Super Admin (Full Control)</option>
                <option value="Level 2 - Operations Lead">Level 2: Ops Lead (Moderation & Users)</option>
                <option value="Level 1 - Auditor">Level 1: System Auditor (Read-Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={authenticating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {authenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <> <Lock className="w-4 h-4" /> <span>Authenticate & Launch Console</span> </>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Nav Items Definition
  const navItems: { tab: ModuleTab; label: string; icon: any; count?: number }[] = [
    { tab: 'analytics', label: 'Overview & KPIs', icon: Activity },
    { tab: 'users', label: 'User Directory', icon: Users, count: userList.length },
    { tab: 'store', label: 'Store Control', icon: ShoppingBag, count: storeItems.length },
    { tab: 'tasks', label: 'Tasks Center', icon: CheckSquare, count: tasksList.length },
    { tab: 'family', label: 'Family Clans', icon: Shield, count: familiesList.length },
    { tab: 'vip', label: 'VIP & SVIP', icon: Crown, count: vipsList.length },
    { tab: 'cp', label: 'CP Couples', icon: Heart, count: cpList.length },
    { tab: 'bd', label: 'BD Center', icon: Briefcase, count: bdList.length },
    { tab: 'agency', label: 'Agency Center', icon: Building2, count: agencyList.length },
    { tab: 'posts', label: 'Community Feed', icon: MessageSquare, count: postsList.length },
    { tab: 'offlineRecharges', label: 'Offline Recharge', icon: CreditCard, count: offlineRechargesList.filter(r => r.status === 'Pending').length },
    { tab: 'hosts', label: 'Host Center', icon: Radio, count: hostsList.length },
    { tab: 'videos', label: 'Video Reels', icon: Video, count: videosList.length },
    { tab: 'streams', label: 'Live Streams', icon: Tv, count: streamList.length },
    { tab: 'logs', label: 'Security Logs', icon: FileText },
    { tab: 'config', label: 'Platform Config', icon: Settings },
  ];

  const containerClasses = isPage
    ? "min-h-screen w-full bg-[#090d16] text-slate-100 flex flex-col font-sans"
    : "fixed inset-0 z-[100] bg-[#090d16] text-slate-100 flex flex-col font-sans overflow-hidden";

  return (
    <div className={containerClasses}>
      
      {/* Top Professional Header */}
      <header className="bg-[#111827] border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Enterprise Operations & Control Center</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                ADMIN / PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Node Cluster: <span className="text-slate-300 font-mono">asia-southeast1</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="hidden md:flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-slate-200">{adminSession.username}</span>
          </div>

          <button
            onClick={handleAdminSignOut}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
            title="Lock Console"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1"
          >
            <span>Exit Console</span>
            <X className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {statusNotification && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-4 py-2 text-xs font-medium text-indigo-200 flex items-center space-x-2 animate-fade-in shrink-0">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-52 sm:w-60 bg-[#0d1322] border-r border-slate-800 p-3 shrink-0 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Platform Admin Control
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-[11px] mt-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Cluster Health</span>
              <span className="text-emerald-400 font-bold">100% OK</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Server Uptime: {analytics?.serverUptimeHours || '0.2'} Hours</p>
          </div>
        </aside>

        {/* Workspace Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[#090d16]">
          
          {/* 1. OVERVIEW & KPIS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Platform System Analytics</h2>
                  <p className="text-xs text-slate-400">Live operational stats, total circulation, and revenue trends</p>
                </div>
                <button
                  onClick={fetchAnalytics}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                  <span>Refresh KPIs</span>
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Total Accounts</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics?.totalUsers ?? '...'}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">+12.4% this week</p>
                </div>

                <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Active Streams</span>
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics?.activeStreams ?? '...'}</p>
                  <p className="text-[11px] text-cyan-300 font-medium">{analytics?.totalViewers ?? 0} Live Viewers</p>
                </div>

                <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Coins Circulation</span>
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-300">
                    {analytics ? (analytics.totalCoinsCirculating / 1000).toFixed(1) + 'k' : '...'}
                  </p>
                  <p className="text-[11px] text-slate-400">User Wallet Balances</p>
                </div>

                <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Recharge Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${analytics ? analytics.offlineRechargeRevenueUsd.toLocaleString() : '...'}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">+18.2% gross margin</p>
                </div>
              </div>

              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Weekly Revenue & User Registration Chart
                </h3>
                <div className="h-40 w-full flex items-end space-x-3 pt-4 border-b border-slate-800 pb-2">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                        ${d.revenue}
                      </div>
                      <div
                        style={{ height: `${Math.min(100, Math.max(15, (d.revenue / 15000) * 100))}%` }}
                        className="w-full bg-indigo-600 rounded-t-md group-hover:bg-indigo-500 transition-all"
                      />
                      <span className="text-[10px] font-medium text-slate-400 mt-2">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">User Directory & Balances</h2>
                  <p className="text-xs text-slate-400">Edit coins, diamonds, levels, and VIP status</p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(); }}
                      placeholder="Search ID, handle, name..."
                      className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button onClick={fetchUsers} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all">Search</button>
                </div>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] font-semibold">
                      <th className="p-3">User</th>
                      <th className="p-3">ID</th>
                      <th className="p-3">Coins</th>
                      <th className="p-3">Diamonds</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">VIP</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {userList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 flex items-center space-x-2.5">
                          <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700" />
                          <div>
                            <p className="font-semibold text-white flex items-center space-x-1">
                              <span>{u.name}</span>
                              {u.svip && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-400">@{u.handle}</p>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{u.id}</td>
                        <td className="p-3 font-bold text-amber-300">🟡 {u.coins?.toLocaleString()}</td>
                        <td className="p-3 font-bold text-cyan-300">💎 {u.diamonds?.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-300">Lv.{u.level || 1}</td>
                        <td className="p-3">
                          {u.svip ? <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">SVIP</span> : u.vipLevel > 0 ? <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-bold">VIP {u.vipLevel}</span> : <span className="text-slate-500 text-[10px]">Normal</span>}
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleSelectUser(u)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[11px] font-medium transition-all">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedUser && (
                <div className="bg-[#111827] border border-indigo-500/40 p-4 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-white">Edit Account: {selectedUser.name} ({selectedUser.id})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Coins</label>
                      <input type="number" value={editCoins} onChange={(e) => setEditCoins(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-amber-300 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Diamonds</label>
                      <input type="number" value={editDiamonds} onChange={(e) => setEditDiamonds(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-cyan-300 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Level</label>
                      <input type="number" value={editLevel} onChange={(e) => setEditLevel(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">VIP Level</label>
                      <input type="number" value={editVipLevel} onChange={(e) => setEditVipLevel(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-purple-300 font-bold" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setEditSvip(!editSvip)} className={`px-3 py-1 rounded text-xs font-bold ${editSvip ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>SVIP: {editSvip ? 'ENABLED' : 'DISABLED'}</button>
                    <button onClick={handleSaveUser} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded transition-all">Commit Updates</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. STORE CONTROL */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Virtual Item Store Control</h2>
                  <p className="text-xs text-slate-400">Manage mounts, avatar frames, chat bubbles, and entry effects</p>
                </div>
              </div>

              {/* Add Store Item */}
              <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="New Item Name (e.g., Gold Lamborghini)"
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white placeholder-slate-500 flex-1 min-w-[200px]"
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white rounded px-3 py-1.5"
                >
                  <option value="Mounts">Mounts</option>
                  <option value="Avatar Frame">Avatar Frame</option>
                  <option value="Chat Bubble">Chat Bubble</option>
                  <option value="Entry Effect">Entry Effect</option>
                </select>
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  placeholder="Price in Coins"
                  className="bg-slate-900 border border-slate-800 text-amber-300 rounded px-3 py-1.5 w-32 font-bold"
                />
                <button
                  onClick={handleSaveStoreItem}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Store Item</span>
                </button>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] font-semibold">
                      <th className="p-3">Item</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Coin Price</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Sales</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {storeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white flex items-center space-x-2">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.name}</span>
                        </td>
                        <td className="p-3 text-slate-300">{item.category}</td>
                        <td className="p-3 font-bold text-amber-300">🟡 {item.price?.toLocaleString()}</td>
                        <td className="p-3 text-slate-400">{item.days} Days</td>
                        <td className="p-3 text-slate-300 font-mono">{item.salesCount || 0}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">{item.status}</span></td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteStoreItem(item.id)} className="p-1.5 text-red-400 hover:bg-slate-800 rounded" title="Delete Item">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TASKS CENTER */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white">Task & Quest Management (DB Backed)</h2>
                  <p className="text-xs text-slate-400">Configure daily, weekly, and host mission coin rewards in database</p>
                </div>
                {taskFormId && (
                  <button
                    onClick={resetTaskForm}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg self-start sm:self-auto"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Task Form */}
              <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                <div className="font-bold text-indigo-300 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{taskFormId ? 'Edit Mission / Quest' : 'Create New Mission / Quest'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 text-[11px]">Task Title</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task Title (e.g., Send 10 Gifts)"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Category</label>
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="General">General</option>
                      <option value="Viewer">Viewer</option>
                      <option value="Gifting">Gifting</option>
                      <option value="Host">Host</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Mission Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="daily">Daily Mission</option>
                      <option value="weekly">Weekly Mission</option>
                      <option value="host">Host Mission</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Reward Coins</label>
                    <input
                      type="number"
                      value={newTaskCoins}
                      onChange={(e) => setNewTaskCoins(Number(e.target.value))}
                      placeholder="Coins"
                      className="w-full bg-slate-900 border border-slate-800 text-amber-300 font-bold rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Reward EXP</label>
                    <input
                      type="number"
                      value={newTaskExp}
                      onChange={(e) => setNewTaskExp(Number(e.target.value))}
                      placeholder="EXP"
                      className="w-full bg-slate-900 border border-slate-800 text-purple-300 font-bold rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Target Count</label>
                    <input
                      type="number"
                      value={newTaskTargetCount}
                      onChange={(e) => setNewTaskTargetCount(Number(e.target.value))}
                      placeholder="Target"
                      className="w-full bg-slate-900 border border-slate-800 text-white font-semibold rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Status</label>
                    <select
                      value={newTaskStatus}
                      onChange={(e) => setNewTaskStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveTask}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{taskFormId ? 'Update Task' : 'Create Task'}</span>
                  </button>
                </div>
              </div>

              {/* Tasks Table */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">Task Mission</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Reward Coins</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tasksList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-white">{t.title}</p>
                          <p className="text-[10px] text-slate-500">Target: {t.targetCount || 1} | ID: {t.id}</p>
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-medium text-slate-300">
                            {t.category || 'General'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-amber-300">
                          🟡 +{t.rewardCoins} <span className="text-[10px] text-purple-300 font-normal ml-1">+{t.rewardExp || 50} EXP</span>
                        </td>
                        <td className="p-3 uppercase text-[10px] font-mono text-slate-400">{t.type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleEditTaskClick(t)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[11px] font-medium transition-all"
                            title="Edit Task"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1 text-red-400 hover:bg-slate-800 rounded inline-flex items-center justify-center align-middle"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. FAMILY CLANS */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Family Clans Management</h2>
                <p className="text-xs text-slate-400">Manage community clans, verification badges, and clan levels</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">Family Clan Name</th>
                      <th className="p-3">Leader</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Members</th>
                      <th className="p-3">Verified Badge</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {familiesList.map((f) => (
                      <tr key={f.id}>
                        <td className="p-3 font-bold text-white flex items-center space-x-1.5">
                          <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>{f.name}</span>
                        </td>
                        <td className="p-3 text-slate-300">{f.leaderName}</td>
                        <td className="p-3 font-semibold text-slate-200">Level {f.level}</td>
                        <td className="p-3 font-mono text-slate-400">{f.membersCount} / {f.maxMembers}</td>
                        <td className="p-3">
                          {f.verified ? <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold">VERIFIED</span> : <span className="text-slate-500">Standard</span>}
                        </td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">{f.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. VIP & SVIP TIERS */}
          {activeTab === 'vip' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">VIP & SVIP Subscription Tiers</h2>
                <p className="text-xs text-slate-400">Configure prices, coin costs, and privileges for VIP tiers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {vipsList.map((vip) => (
                  <div key={vip.level} className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Crown className={`w-5 h-5 ${vip.level === 4 ? 'text-amber-400' : 'text-purple-400'}`} />
                        <h3 className="font-bold text-white text-sm">{vip.name}</h3>
                      </div>
                      <span className="font-mono font-bold text-amber-300 text-xs">${vip.priceUsd} / mo</span>
                    </div>

                    <p className="text-slate-300">Coin Price: <span className="font-bold text-amber-300">🟡 {vip.coinPrice?.toLocaleString()}</span></p>
                    <p className="text-slate-400 text-[11px]"><span className="font-semibold text-slate-300">Perks:</span> {vip.perks}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. CP COUPLES */}
          {activeTab === 'cp' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">CP (Couples) Intimacy System</h2>
                <p className="text-xs text-slate-400">View intimate couple pairs, intimacy levels, and rings</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">Partner 1</th>
                      <th className="p-3">Partner 2</th>
                      <th className="p-3">Intimacy Level</th>
                      <th className="p-3">CP Ring</th>
                      <th className="p-3">Days Together</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cpList.map((cp) => (
                      <tr key={cp.id}>
                        <td className="p-3 font-semibold text-pink-300">{cp.user1Name}</td>
                        <td className="p-3 font-semibold text-pink-300">{cp.user2Name}</td>
                        <td className="p-3 font-bold text-amber-300 flex items-center space-x-1">
                          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                          <span>Lv.{cp.intimacyLevel}</span>
                        </td>
                        <td className="p-3 text-slate-300">{cp.ringName}</td>
                        <td className="p-3 font-mono text-slate-400">{cp.daysTogether} Days</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded text-[10px] font-bold">{cp.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. BD CENTER */}
          {activeTab === 'bd' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">BD Center (Business Development)</h2>
                <p className="text-xs text-slate-400">Manage regional BD managers, agency targets, and overrides</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">BD Group</th>
                      <th className="p-3">Manager</th>
                      <th className="p-3">Agencies</th>
                      <th className="p-3">Target / Achieved</th>
                      <th className="p-3">Commission Override</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bdList.map((bd) => (
                      <tr key={bd.id}>
                        <td className="p-3 font-bold text-white">{bd.name}</td>
                        <td className="p-3 text-slate-300">{bd.manager}</td>
                        <td className="p-3 font-mono text-slate-400">{bd.agenciesManaged} Agencies</td>
                        <td className="p-3 text-emerald-400 font-mono">${bd.achievedUsd?.toLocaleString()} / ${bd.monthlyTargetUsd?.toLocaleString()}</td>
                        <td className="p-3 font-bold text-indigo-300">{bd.commissionRate}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">{bd.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. AGENCY CENTER */}
          {activeTab === 'agency' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Agency Management Center</h2>
                <p className="text-xs text-slate-400">Registered agencies, total hosts, monthly revenue splits</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">Code</th>
                      <th className="p-3">Agency Name</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3">Hosts Bound</th>
                      <th className="p-3">Monthly Coins Revenue</th>
                      <th className="p-3">Split %</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {agencyList.map((ag) => (
                      <tr key={ag.id}>
                        <td className="p-3 font-mono text-indigo-300">{ag.agencyCode}</td>
                        <td className="p-3 font-bold text-white">{ag.name}</td>
                        <td className="p-3 text-slate-300">{ag.ownerName}</td>
                        <td className="p-3 font-mono text-slate-400">{ag.totalHosts} Hosts</td>
                        <td className="p-3 font-bold text-amber-300">🟡 {ag.monthlyCoinsGenerated?.toLocaleString()}</td>
                        <td className="p-3 font-bold text-indigo-300">{ag.commissionPercent}%</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">{ag.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. COMMUNITY POSTS */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Community Feed Moderation</h2>
                <p className="text-xs text-slate-400">Inspect user post submissions, pin announcements, delete content</p>
              </div>

              <div className="space-y-3 text-xs">
                {postsList.map((post) => (
                  <div key={post.id} className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{post.author}</span>
                        <span className="text-[11px] text-slate-500">@{post.handle} • {post.createdAt}</span>
                        {post.isPinned && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold">PINNED</span>}
                      </div>
                      <p className="text-slate-200">{post.content}</p>
                      <p className="text-[11px] text-slate-400">❤️ {post.likes} Likes • 💬 {post.comments} Comments</p>
                    </div>

                    <button
                      onClick={async () => {
                        await fetch('/api/admin/posts/delete', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ id: post.id }) });
                        showStatus('Post deleted.');
                        fetchPosts();
                      }}
                      className="px-2.5 py-1 bg-red-950/60 text-red-300 border border-red-800/60 rounded font-medium hover:bg-red-900 transition-all shrink-0 text-[11px]"
                    >
                      Delete Post
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. OFFLINE RECHARGE QUEUE */}
          {activeTab === 'offlineRecharges' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Offline Recharge Review Queue</h2>
                <p className="text-xs text-slate-400">Manual payment transfers, bank slips, and top-up credits</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">User</th>
                      <th className="p-3">USD Amount</th>
                      <th className="p-3">Coin Credit</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Reference No</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {offlineRechargesList.map((rech) => (
                      <tr key={rech.id}>
                        <td className="p-3 font-semibold text-white">{rech.userName} ({rech.userId})</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">${rech.amountUsd} USD</td>
                        <td className="p-3 font-bold text-amber-300">🟡 +{rech.coinAmount?.toLocaleString()}</td>
                        <td className="p-3 text-slate-300">{rech.paymentMethod}</td>
                        <td className="p-3 font-mono text-slate-400">{rech.referenceNo}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rech.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' : rech.status === 'Rejected' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {rech.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {rech.status === 'Pending' ? (
                            <>
                              <button onClick={() => handleRechargeAction(rech.id, 'Approved')} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px]">Approve & Credit</button>
                              <button onClick={() => handleRechargeAction(rech.id, 'Rejected')} className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white font-semibold rounded text-[11px]">Reject</button>
                            </>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 12. HOST CENTER */}
          {activeTab === 'hosts' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Host Broadcasters Center</h2>
                <p className="text-xs text-slate-400">Streamer target hours, contract applications, salary tiers</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">Broadcaster Name</th>
                      <th className="p-3">Agency</th>
                      <th className="p-3">Monthly Stream Hours</th>
                      <th className="p-3">Estimated Salary</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Contract Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {hostsList.map((h) => (
                      <tr key={h.id}>
                        <td className="p-3 font-bold text-white">{h.name}</td>
                        <td className="p-3 text-slate-300">{h.agencyName}</td>
                        <td className="p-3 font-mono text-slate-300">{h.completedHours} / {h.monthlyTargetHours} Hrs</td>
                        <td className="p-3 font-bold text-emerald-400">${h.monthlyEarningsUsd} USD</td>
                        <td className="p-3 font-semibold text-amber-300">{h.rating}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">{h.contractStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 13. VIDEO REELS */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Short Video Reels Moderation</h2>
                <p className="text-xs text-slate-400">View short video submissions, delete violating clips</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {videosList.map((v) => (
                  <div key={v.id} className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-xs">{v.title}</h3>
                      <button
                        onClick={async () => {
                          await fetch('/api/admin/videos/delete', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ id: v.id }) });
                          showStatus('Video deleted.');
                          fetchVideos();
                        }}
                        className="text-red-400 hover:bg-slate-800 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-[11px]">Author: <span className="text-slate-200">{v.author}</span></p>
                    <p className="text-slate-400 text-[11px]">👁️ {v.views?.toLocaleString()} Views • ❤️ {v.likes?.toLocaleString()} Likes</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 14. LIVE STREAMS */}
          {activeTab === 'streams' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Active Stream Rooms</h2>
                  <p className="text-xs text-slate-400">Monitor and terminate active broadcast rooms</p>
                </div>
                <button onClick={fetchStreams} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center space-x-1"><RefreshCw className="w-3.5 h-3.5" /><span>Refresh</span></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {streamList.map((room) => (
                  <div key={room.id} className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img src={room.host.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                        <div>
                          <h3 className="font-bold text-white">{room.title}</h3>
                          <p className="text-slate-400 text-[11px]">Host: {room.host.name}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-semibold">{room.viewerCount} Viewers</span>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                      <button onClick={() => handleStreamAction(room.id, 'toggle-hot')} className={`px-2.5 py-1 rounded text-[11px] font-bold ${room.isHot ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>{room.isHot ? 'HOT 🔥' : 'Mark Hot'}</button>
                      <button onClick={() => handleStreamAction(room.id, 'toggle-recommend')} className={`px-2.5 py-1 rounded text-[11px] font-bold ${room.isRecommended ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{room.isRecommended ? 'Featured ⭐' : 'Feature'}</button>
                      <button onClick={() => { if (confirm('Terminate stream?')) handleStreamAction(room.id, 'end'); }} className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-800/60 rounded text-[11px] font-semibold ml-auto">Terminate</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. SECURITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Security & Audit Log</h2>
                <p className="text-xs text-slate-400">Recorded operator activities and system alerts</p>
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-white font-semibold">{log.actor}</td>
                        <td className="p-3 text-slate-200">{log.action}</td>
                        <td className="p-3 text-slate-400">{log.target}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.severity === 'SECURITY' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 16. SYSTEM CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">System Global Parameters</h2>
                <p className="text-xs text-slate-400">Global toggles, maintenance lock, exchange rates</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Platform Maintenance Lock</h3>
                    <p className="text-slate-400 text-[11px]">Lock app access for emergency database migrations</p>
                  </div>
                  <button
                    onClick={handleToggleMaintenance}
                    className={`px-4 py-1.5 rounded font-bold text-xs transition-all ${
                      systemConfig?.maintenanceMode ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {systemConfig?.maintenanceMode ? 'MAINTENANCE ACTIVE' : 'SYSTEM OPERATIONAL'}
                  </button>
                </div>

                <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl space-y-2">
                  <h3 className="font-bold text-white">Base Exchange Rate</h3>
                  <p className="text-slate-400 text-[11px]">1 USD = <span className="font-bold text-amber-300 font-mono">1,000 Coins</span></p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
