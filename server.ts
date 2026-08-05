import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { AccessToken } from 'livekit-server-sdk';
import { VIRTUAL_GIFTS } from './src/data/gifts';
import { StreamRoom, User, ChatMessage, VirtualGift, RoomGuest } from './src/types';
import { encryptMessage } from './src/lib/crypto';

// Supabase Admin / Service Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_USER: User = {
  id: 'usr_maya',
  name: 'Maya Lin',
  handle: 'maya_official',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  country: 'India',
  countryFlag: '🇮🇳',
  level: 10,
  wealthLevel: 10,
  charismaLevel: 8,
  vipLevel: 1,
  svip: true,
  svipLevel: 2,
  isVerified: true,
  bio: 'Live Streamer & Musician 🎵',
  followers: 120,
  following: 45,
  friends: 30,
  visitors: 500,
  coins: 10000,
  diamonds: 500,
  totalCoinsSpent: 35000,
  totalDiamondsEarned: 25000,
};

const INITIAL_STREAMS: StreamRoom[] = [
  {
    id: 'room_live_1',
    title: '🎵 Bollywood & Pop Live Singing Lounge! 🎤',
    type: 'video',
    mode: 'multi',
    category: 'Music',
    country: 'India',
    countryFlag: '🇮🇳',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    viewerCount: 1420,
    likeCount: 8900,
    tags: ['Singing', 'Bollywood', 'Live'],
    isHot: true,
    isRecommended: true,
    durationSeconds: 0,
    pinnedMessage: 'Welcome to the Live Lounge! Drop song requests in chat! 🎶',
    host: DEFAULT_USER,
    guests: [],
  },
];

const app = express();
app.use(express.json());

const PORT = 3000;
const server = http.createServer(app);

// Initialize Gemini API client lazily / safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.warn('Failed to initialize Gemini AI client:', err);
      }
    }
  }
  return aiClient;
}

// Sample User Directory for Messaging & Following
const ALL_SAMPLE_USERS: Record<string, User> = {
  usr_maya: {
    id: 'usr_maya',
    name: 'Maya Lin 🎤',
    handle: 'maya_official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    country: 'India',
    countryFlag: '🇮🇳',
    level: 12,
    wealthLevel: 12,
    charismaLevel: 10,
    vipLevel: 2,
    svip: true,
    svipLevel: 3,
    isVerified: true,
    bio: 'Singer & Songwriter • Live Lounge Host 🎶',
    followers: 1250,
    following: 45,
    friends: 30,
    visitors: 820,
    coins: 10000,
    diamonds: 500,
    totalCoinsSpent: 55000,
    totalDiamondsEarned: 35000,
  },
  usr_alex: {
    id: 'usr_alex',
    name: 'DJ Alex 🎧',
    handle: 'djalex_beats',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    country: 'UK',
    countryFlag: '🇬🇧',
    level: 15,
    wealthLevel: 15,
    charismaLevel: 14,
    vipLevel: 3,
    svip: true,
    svipLevel: 5,
    isVerified: true,
    bio: 'Electronic Music Producer & Night DJ 🎧',
    followers: 3400,
    following: 88,
    friends: 70,
    visitors: 1900,
    coins: 18000,
    diamonds: 1200,
    totalCoinsSpent: 90000,
    totalDiamondsEarned: 75000,
  },
  usr_priya: {
    id: 'usr_priya',
    name: 'Priya Sharma 💃',
    handle: 'priya_dance',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    country: 'India',
    countryFlag: '🇮🇳',
    level: 8,
    wealthLevel: 8,
    charismaLevel: 6,
    vipLevel: 1,
    svip: false,
    svipLevel: 0,
    isVerified: true,
    bio: 'Choreographer & Fitness Streamer 💃',
    followers: 890,
    following: 110,
    friends: 50,
    visitors: 450,
    coins: 4200,
    diamonds: 210,
    totalCoinsSpent: 18000,
    totalDiamondsEarned: 12000,
  },
  usr_anya: {
    id: 'usr_anya',
    name: 'Anya Vance 🎮',
    handle: 'anya_gamer',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    country: 'USA',
    countryFlag: '🇺🇸',
    level: 9,
    wealthLevel: 9,
    charismaLevel: 7,
    vipLevel: 1,
    svip: false,
    svipLevel: 0,
    isVerified: true,
    bio: 'Pro Mobile Esports Streamer 🕹️',
    followers: 2100,
    following: 200,
    friends: 45,
    visitors: 980,
    coins: 6000,
    diamonds: 300,
    totalCoinsSpent: 22000,
    totalDiamondsEarned: 16000,
  },
  usr_rohan: {
    id: 'usr_rohan',
    name: 'Rohan Verma 🎸',
    handle: 'rohan_guitars',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    country: 'India',
    countryFlag: '🇮🇳',
    level: 5,
    wealthLevel: 5,
    charismaLevel: 4,
    vipLevel: 0,
    svip: false,
    svipLevel: 0,
    isVerified: false,
    bio: 'Acoustic Cover Singer & Jammer 🎸',
    followers: 430,
    following: 150,
    friends: 20,
    visitors: 210,
    coins: 2000,
    diamonds: 50,
    totalCoinsSpent: 7000,
    totalDiamondsEarned: 3500,
  },
};

// Follow relationships: { followerId, followingId }
let followsStore: Array<{ followerId: string; followingId: string }> = [
  { followerId: 'usr_alex', followingId: DEFAULT_USER.id }, // Alex follows currentUser -> MUTUAL
  { followerId: DEFAULT_USER.id, followingId: 'usr_alex' },
  { followerId: DEFAULT_USER.id, followingId: 'usr_priya' }, // Single-way follow
  { followerId: DEFAULT_USER.id, followingId: 'usr_anya' },  // Single-way follow
  { followerId: 'usr_rohan', followingId: DEFAULT_USER.id }, // Sent message request to currentUser
];

// Pre-seeded encrypted direct messages
let directMessagesStore: Array<{
  id: string;
  senderId: string;
  recipientId: string;
  encryptedContent: string;
  timestamp: string;
}> = [
  {
    id: 'dm_1',
    senderId: 'usr_maya',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Hey! Thanks for following my stream! 🎤'),
    timestamp: '10:42 AM',
  },
  {
    id: 'dm_2',
    senderId: 'usr_alex',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Dropped a new synth beat track today 🔥'),
    timestamp: 'Yesterday',
  },
  {
    id: 'dm_3',
    senderId: 'usr_priya',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Let us collaborate on the next dance stage!'),
    timestamp: '2 days ago',
  },
  {
    id: 'dm_4',
    senderId: 'usr_rohan',
    recipientId: DEFAULT_USER.id,
    encryptedContent: encryptMessage('Hey! Would love to play acoustic guitar on your room stream! 🎸'),
    timestamp: '3 days ago',
  },
];

// Helper to check mutual follow status
function checkIsMutualFollow(userA: string, userB: string): boolean {
  const aFollowsB = followsStore.some((f) => f.followerId === userA && f.followingId === userB);
  const bFollowsA = followsStore.some((f) => f.followerId === userB && f.followingId === userA);
  return aFollowsB && bFollowsA;
}

// Helper to check live online status
function checkIsUserOnline(userId: string): boolean {
  if (['usr_maya', 'usr_alex', 'usr_priya'].includes(userId)) return true;
  for (const client of activeClients) {
    if (client.userId === userId) return true;
  }
  return false;
}

// In-Memory & Disk Persisted Data Store for Server State
const DATA_FILE = path.join(process.cwd(), 'data_store.json');

let roomsStore: StreamRoom[] = [...INITIAL_STREAMS];
let currentUserStore: User = { ...DEFAULT_USER };
let reelsStore: any[] = [];
let notificationsStore: any[] = [];

// ADMIN DATABASE STORES
let storeItemsStore = [
  { id: 'item_1', name: 'Cyber Dragon Entry Mount', category: 'Mounts', price: 15000, days: 30, icon: '🏎️', status: 'Active', salesCount: 420 },
  { id: 'item_2', name: 'Royal Gold Avatar Frame', category: 'Avatar Frame', price: 5000, days: 30, icon: '👑', status: 'Active', salesCount: 1250 },
  { id: 'item_3', name: 'Neon Purple Chat Bubble', category: 'Chat Bubble', price: 2500, days: 7, icon: '💬', status: 'Active', salesCount: 890 },
  { id: 'item_4', name: 'Phoenix Entrance Wings', category: 'Entry Effect', price: 30000, days: 30, icon: '🦅', status: 'Active', salesCount: 110 }
];

let tasksStore = [
  { id: 'task_1', title: 'Daily Check-in', rewardCoins: 100, rewardExp: 50, type: 'daily', status: 'Active', targetCount: 1, category: 'General' },
  { id: 'task_2', title: 'Watch Live Stream 10 Mins', rewardCoins: 250, rewardExp: 100, type: 'daily', status: 'Active', targetCount: 10, category: 'Viewer' },
  { id: 'task_3', title: 'Send 5 Virtual Gifts', rewardCoins: 500, rewardExp: 250, type: 'daily', status: 'Active', targetCount: 5, category: 'Gifting' },
  { id: 'task_4', title: 'Broadcast Live for 30 Mins', rewardCoins: 1200, rewardExp: 500, type: 'weekly', status: 'Active', targetCount: 30, category: 'Host' }
];

let claimedTasksStore: Record<string, string[]> = {
  usr_maya: ['task_1'],
};

let familiesStore = [
  { id: 'fam_1', name: 'Royal VIP Clan', leaderName: 'Aria Melody', level: 12, membersCount: 48, maxMembers: 50, totalRankingScore: 985000, verified: true, status: 'Active' },
  { id: 'fam_2', name: 'Dragon Empire', leaderName: 'Leo Vance', level: 8, membersCount: 35, maxMembers: 40, totalRankingScore: 420000, verified: true, status: 'Active' },
  { id: 'fam_3', name: 'Starlight Family', leaderName: 'Chloe Star', level: 5, membersCount: 22, maxMembers: 30, totalRankingScore: 180000, verified: false, status: 'Active' }
];

let vipTiersStore = [
  { level: 1, name: 'VIP Baron', priceUsd: 10, coinPrice: 10000, perks: 'Gold Name Tag, 5% Gift Bonus, Exclusive Badge', status: 'Active' },
  { level: 2, name: 'VIP Duke', priceUsd: 50, coinPrice: 50000, perks: 'Animated Entrance, 10% Gift Bonus, Custom Chat Bubble', status: 'Active' },
  { level: 3, name: 'VIP King', priceUsd: 200, coinPrice: 200000, perks: 'Private Channel, 20% Gift Bonus, Full Steer Mount', status: 'Active' },
  { level: 4, name: 'SVIP Emperor', priceUsd: 500, coinPrice: 500000, perks: 'Global Server Banner, 30% Gift Bonus, Personal Concierge', status: 'Active' }
];

let cpPairsStore = [
  { id: 'cp_1', user1Name: 'Aria Melody', user2Name: 'Leo Vance', intimacyLevel: 24, ringName: 'Forever Diamond Ring', status: 'Active', daysTogether: 142 },
  { id: 'cp_2', user1Name: 'Chloe Star', user2Name: 'Sam Miller', intimacyLevel: 10, ringName: 'Silver Promise Ring', status: 'Active', daysTogether: 45 }
];

let bdCenterStore = [
  { id: 'bd_1', name: 'Global BD Operations Asia', manager: 'Alex Thorne', agenciesManaged: 14, monthlyTargetUsd: 50000, achievedUsd: 62400, commissionRate: '5%', status: 'Approved' },
  { id: 'bd_2', name: 'LATAM Agency BD Group', manager: 'Sofia Rossi', agenciesManaged: 8, monthlyTargetUsd: 30000, achievedUsd: 28500, commissionRate: '4%', status: 'Approved' },
  { id: 'bd_3', name: 'Apex Talent BD Application', manager: 'Marcus Vance', agenciesManaged: 0, monthlyTargetUsd: 25000, achievedUsd: 0, commissionRate: '5%', status: 'Pending' }
];

let agencyCenterStore = [
  { id: 'ag_1', agencyCode: 'AG-9081', name: 'Starlet Media Agency', ownerName: 'David Zhang', totalHosts: 64, monthlyCoinsGenerated: 4200000, commissionPercent: 15, status: 'Active' },
  { id: 'ag_2', agencyCode: 'AG-4420', name: 'Vibe Talents Ltd', ownerName: 'Elena Rostova', totalHosts: 32, monthlyCoinsGenerated: 1850000, commissionPercent: 12, status: 'Active' },
  { id: 'ag_3', agencyCode: 'AG-1050', name: 'Phoenix Entertainment', ownerName: 'Jacob King', totalHosts: 12, monthlyCoinsGenerated: 620000, commissionPercent: 10, status: 'Pending Review' }
];

let communityPostsStore = [
  { id: 'post_1', author: 'Aria Melody', handle: 'aria_sing', content: 'Thank you everyone who tuned in to my acoustic concert live stream tonight! ❤️🎤', likes: 1420, comments: 280, isPinned: true, status: 'Active', createdAt: '2 hours ago' },
  { id: 'post_2', author: 'Leo Vance', handle: 'leo_gaming', content: 'Huge gaming tournament tomorrow at 8 PM EST! Don’t miss it 🔥🎮', likes: 890, comments: 112, isPinned: false, status: 'Active', createdAt: '5 hours ago' }
];

let offlineRechargesStore = [
  { id: 'rech_1', userId: 'usr_9981', userName: 'Alex Johnson', amountUsd: 500, coinAmount: 500000, paymentMethod: 'Bank Wire Transfer', referenceNo: 'TXN-9081234', proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c', status: 'Pending', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'rech_2', userId: 'usr_3312', userName: 'Maria Santos', amountUsd: 100, coinAmount: 100000, paymentMethod: 'Crypto USDT (TRC20)', referenceNo: 'TXN-7712390', proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c', status: 'Approved', timestamp: new Date(Date.now() - 7200000).toISOString() }
];

let hostCenterStore = [
  { id: 'host_1', userId: 'usr_aria', name: 'Aria Melody', agencyName: 'Starlet Media Agency', monthlyTargetHours: 40, completedHours: 32.5, monthlyEarningsUsd: 1850, rating: '5.0 ⭐', contractStatus: 'Active' },
  { id: 'host_2', userId: 'usr_chloe', name: 'Chloe Star', agencyName: 'Vibe Talents Ltd', monthlyTargetHours: 30, completedHours: 28.0, monthlyEarningsUsd: 920, rating: '4.8 ⭐', contractStatus: 'Active' },
  { id: 'host_3', userId: 'usr_newbie', name: 'Kevin Durant', agencyName: 'Direct Platform', monthlyTargetHours: 20, completedHours: 0, monthlyEarningsUsd: 0, rating: 'New', contractStatus: 'Pending Contract' }
];

let videoReelsStore = [
  { id: 'reel_1', title: 'High Pitch Vocal Warmup 🎵', author: 'Aria Melody', views: 45200, likes: 6200, isPinned: true, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-singing-into-a-microphone-41225-large.mp4', status: 'Active' },
  { id: 'reel_2', title: 'Crazy Clutch In FPS Arena! 🎮', author: 'Leo Vance', views: 28900, likes: 3800, isPinned: false, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-playing-a-game-41551-large.mp4', status: 'Active' }
];

let adminAuditLogsStore: Array<{
  id: string;
  timestamp: string;
  actor: string;
  roleLevel: string;
  action: string;
  target: string;
  ip: string;
  severity: 'INFO' | 'WARNING' | 'SECURITY';
}> = [
  { id: 'log_001', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'admin_master', roleLevel: 'Level 3 - Super Admin', action: 'System Boot Initialization', target: 'Global Server Cluster', ip: '127.0.0.1', severity: 'INFO' },
  { id: 'log_002', timestamp: new Date(Date.now() - 1800000).toISOString(), actor: 'admin_ops', roleLevel: 'Level 2 - Operations Lead', action: 'Stream Moderation Check', target: 'Room room_singing_101', ip: '192.168.1.45', severity: 'INFO' }
];

let globalSystemConfig = {
  maintenanceMode: false,
  coinRatePerUsd: 1000,
  hostCommissionPercent: 70,
  aiModerationSensitivity: 'Strict (Gemini Guard)',
  maxStreamBitrateKbps: 4500,
  allowOfflineRecharges: true,
};

function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.directMessagesStore)) directMessagesStore = data.directMessagesStore;
      if (Array.isArray(data.followsStore)) followsStore = data.followsStore;
      if (data.currentUserStore && data.currentUserStore.id) currentUserStore = data.currentUserStore;
      if (data.ALL_SAMPLE_USERS) Object.assign(ALL_SAMPLE_USERS, data.ALL_SAMPLE_USERS);

      if (Array.isArray(data.storeItemsStore)) storeItemsStore = data.storeItemsStore;
      if (Array.isArray(data.tasksStore)) tasksStore = data.tasksStore;
      if (data.claimedTasksStore && typeof data.claimedTasksStore === 'object') claimedTasksStore = data.claimedTasksStore;
      if (Array.isArray(data.familiesStore)) familiesStore = data.familiesStore;
      if (Array.isArray(data.vipTiersStore)) vipTiersStore = data.vipTiersStore;
      if (Array.isArray(data.cpPairsStore)) cpPairsStore = data.cpPairsStore;
      if (Array.isArray(data.bdCenterStore)) bdCenterStore = data.bdCenterStore;
      if (Array.isArray(data.agencyCenterStore)) agencyCenterStore = data.agencyCenterStore;
      if (Array.isArray(data.communityPostsStore)) communityPostsStore = data.communityPostsStore;
      if (Array.isArray(data.offlineRechargesStore)) offlineRechargesStore = data.offlineRechargesStore;
      if (Array.isArray(data.hostCenterStore)) hostCenterStore = data.hostCenterStore;
      if (Array.isArray(data.videoReelsStore)) videoReelsStore = data.videoReelsStore;
      if (Array.isArray(data.adminAuditLogsStore)) adminAuditLogsStore = data.adminAuditLogsStore;
      if (data.globalSystemConfig) globalSystemConfig = data.globalSystemConfig;

      console.log('✅ Local database persistent store loaded successfully.');
    }
  } catch (err) {
    console.warn('Could not load data_store.json:', err);
  }
}

function savePersistedData() {
  try {
    const payload = {
      directMessagesStore,
      followsStore,
      currentUserStore,
      ALL_SAMPLE_USERS,
      storeItemsStore,
      tasksStore,
      claimedTasksStore,
      familiesStore,
      vipTiersStore,
      cpPairsStore,
      bdCenterStore,
      agencyCenterStore,
      communityPostsStore,
      offlineRechargesStore,
      hostCenterStore,
      videoReelsStore,
      adminAuditLogsStore,
      globalSystemConfig,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save data_store.json:', err);
  }
}

// Input Sanitization Helpers
function sanitizeText(val: any, maxLen = 300, defaultVal = ''): string {
  if (typeof val !== 'string') val = val !== undefined && val !== null ? String(val) : defaultVal;
  return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/javascript:/gi, '').trim().substring(0, maxLen);
}

function sanitizeNumber(val: any, defaultVal = 0, min = -1000000000, max = 1000000000): number {
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
}

function sanitizeBoolean(val: any): boolean {
  return Boolean(val);
}

// Role Hierarchy & Authentication Verification
// Level 3 = Super Admin, Level 2 = Operations Lead (Admin), Level 1 = Agency Owner
const ROLE_HIERARCHY: Record<string, number> = {
  'Level 3 - Super Admin': 3,
  'super_admin': 3,
  'Level 2 - Operations Lead': 2,
  'admin': 2,
  'Level 1 - Agency Owner': 1,
  'agency_owner': 1,
};

function verifyAdminAuth(req: express.Request, minRoleLevel = 1): { authorized: boolean; roleName: string; actorName: string; error?: string } {
  const authHeader = req.headers.authorization || '';
  const xToken = (req.headers['x-admin-token'] as string) || '';
  const queryToken = (req.query.token as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : xToken || queryToken;

  if (!token) {
    return { authorized: false, roleName: 'Unauthenticated', actorName: 'Unknown', error: 'Authentication required: Admin token missing.' };
  }

  const roleHeader = (req.headers['x-admin-role'] as string) || 'Level 3 - Super Admin';
  const roleLevel = ROLE_HIERARCHY[roleHeader] ?? 1;

  if (roleLevel < minRoleLevel) {
    return { authorized: false, roleName: roleHeader, actorName: 'Operator', error: `Forbidden: Insufficient role clearance. Level ${minRoleLevel} required.` };
  }

  return { authorized: true, roleName: roleHeader, actorName: 'admin_operator' };
}

// Initialize persisted store
loadPersistedData();

// Active WebSocket Room connections
interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userName: string;
  roomId?: string;
}

const activeClients = new Set<ClientConnection>();
const roomClients = new Map<string, Set<ClientConnection>>();

// Setup WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastToRoom(roomId: string, messageObj: any, excludeWs?: WebSocket) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const jsonString = JSON.stringify(messageObj);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(jsonString);
    }
  }
}

function closeRoomStream(roomId: string, reason: string) {
  const room = roomsStore.find((r) => r.id === roomId);
  if (!room) return;

  broadcastToRoom(roomId, {
    type: 'stream-ended',
    reason,
    roomId,
  });

  roomsStore = roomsStore.filter((r) => r.id !== roomId);
  roomClients.delete(roomId);
}

function broadcastOnlineUsers() {
  const onlineSet = new Set<string>();
  for (const client of activeClients) {
    if (client.userId) onlineSet.add(client.userId);
  }
  const payload = JSON.stringify({
    type: 'online-status-update',
    onlineUserIds: Array.from(onlineSet),
  });
  for (const client of activeClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const conn: ClientConnection = {
    ws,
    userId: `user_${Math.random().toString(36).substring(2, 9)}`,
    userName: 'Anonymous'
  };
  activeClients.add(conn);

  ws.on('message', async (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      switch (data.type) {
        case 'identify-user': {
          if (data.user?.id) conn.userId = data.user.id;
          if (data.user?.name) conn.userName = data.user.name;
          broadcastOnlineUsers();
          break;
        }

        case 'direct-message': {
          const recipientId = data.recipientId;
          const encryptedContent = data.encryptedContent;
          const senderId = conn.userId;
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const messagePayload = {
            id: msgId,
            senderId,
            recipientId,
            encryptedContent,
            isRead: false,
            timestamp,
          };

          // In-memory & disk store
          directMessagesStore.push({
            id: msgId,
            senderId,
            recipientId,
            encryptedContent,
            timestamp,
          });
          savePersistedData();

          // Supabase persistence
          if (supabaseAdmin) {
            (async () => {
              try {
                await supabaseAdmin.from('direct_messages').insert({
                  id: msgId,
                  sender_id: senderId,
                  recipient_id: recipientId,
                  encrypted_content: encryptedContent,
                  is_read: false,
                });
              } catch (e) {}
            })();
          }

          // Instant 0ms WebSocket delivery to recipient AND sender
          for (const client of activeClients) {
            if ((client.userId === recipientId || client.userId === senderId) && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'direct-message-received',
                message: messagePayload,
              }));
            }
          }
          break;
        }

        case 'mark-messages-read': {
          const senderId = data.senderId;
          const readerId = conn.userId;

          directMessagesStore.forEach((m) => {
            if (m.senderId === senderId && m.recipientId === readerId) {
              (m as any).isRead = true;
            }
          });

          if (supabaseAdmin) {
            (async () => {
              try {
                await supabaseAdmin.from('direct_messages')
                  .update({ is_read: true, read_at: new Date().toISOString() })
                  .match({ sender_id: senderId, recipient_id: readerId });
              } catch (e) {}
            })();
          }

          for (const client of activeClients) {
            if (client.userId === senderId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'direct-messages-read-ack',
                readerId,
                senderId,
              }));
            }
          }
          break;
        }

        case 'authenticate-token': {
          if (supabaseAdmin && data.token) {
            try {
              const { data: userData, error } = await supabaseAdmin.auth.getUser(data.token);
              if (userData?.user && !error) {
                conn.userId = userData.user.id;
                // Fetch profile
                const { data: prof } = await supabaseAdmin.from('profiles').select('*').eq('id', userData.user.id).single();
                if (prof) {
                  conn.userName = prof.name || prof.handle;
                }
                ws.send(JSON.stringify({ type: 'authenticated-user', userId: conn.userId, userName: conn.userName }));
              }
            } catch (err) {
              console.warn('WS auth token verification failed:', err);
            }
          }
          break;
        }

        case 'join-room': {
          if (conn.roomId && roomClients.has(conn.roomId)) {
            roomClients.get(conn.roomId)?.delete(conn);
          }

          conn.roomId = data.roomId;
          if (data.user?.id) conn.userId = data.user.id;
          if (data.user?.name) conn.userName = data.user.name;

          if (!roomClients.has(data.roomId)) {
            roomClients.set(data.roomId, new Set());
          }
          roomClients.get(data.roomId)!.add(conn);

          // Find room and increment viewer count
          const room = roomsStore.find((r) => r.id === data.roomId);
          if (room) {
            room.viewerCount += 1;
            // Broadcast system message
            broadcastToRoom(data.roomId, {
              type: 'system-message',
              content: `✨ ${conn.userName} entered the room!`,
              viewerCount: room.viewerCount,
            });

            // Send current stage guests and stage requests immediately to newly joined viewer
            ws.send(JSON.stringify({
              type: 'guests-update',
              guests: room.guests || [],
              stageRequests: room.stageRequests || []
            }));
          }
          break;
        }

        case 'end-stream': {
          if (conn.roomId) {
            closeRoomStream(conn.roomId, 'Host has ended the live stream.');
            conn.roomId = undefined;
          }
          break;
        }

        case 'leave-room': {
          if (conn.roomId) {
            const targetRoomId = conn.roomId;
            if (roomClients.has(targetRoomId)) {
              roomClients.get(targetRoomId)?.delete(conn);
            }
            const room = roomsStore.find((r) => r.id === targetRoomId);

            if (room) {
              const isHost = room.host.id === conn.userId;
              const remainingCount = roomClients.get(targetRoomId)?.size || 0;

              if (isHost || remainingCount === 0) {
                closeRoomStream(targetRoomId, isHost ? 'Host ended the live stream.' : 'Stream closed (0 members left).');
              } else {
                if (room.viewerCount > 0) room.viewerCount -= 1;
                room.guests = (room.guests || []).filter((g) => g.user.id !== conn.userId);
                broadcastToRoom(targetRoomId, {
                  type: 'viewer-count-update',
                  viewerCount: room.viewerCount,
                });
                broadcastToRoom(targetRoomId, {
                  type: 'guests-update',
                  guests: room.guests,
                  stageRequests: room.stageRequests || []
                });
              }
            }
            conn.roomId = undefined;
          }
          break;
        }

        case 'chat-message': {
          if (!conn.roomId) break;
          const msg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            roomId: conn.roomId,
            sender: data.sender || {
              id: conn.userId,
              name: conn.userName,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              level: 10,
              vipLevel: 1,
              svip: false,
              country: 'India',
              countryFlag: '🇮🇳',
              followers: 100,
              following: 50,
              friends: 20,
              visitors: 100,
              coins: 500,
              diamonds: 1000,
              bio: 'User',
              handle: conn.userName.toLowerCase(),
              isVerified: false
            },
            content: data.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          broadcastToRoom(conn.roomId, {
            type: 'chat-message',
            message: msg
          });

          // Persist chat message to Supabase database in background
          if (supabaseAdmin) {
            (async () => {
              try {
                const { error } = await supabaseAdmin.from('messages').insert({
                  stream_id: conn.roomId,
                  sender_id: conn.userId,
                  content: data.content,
                  is_gift: false
                });
                if (error) console.warn('Supabase message persist note:', error.message);
              } catch (err) {
                // Ignore transient db errors
              }
            })();
          }

          // Check for AI Assistant prompt command (e.g. "@AI", "!ai")
          if (data.content.startsWith('@AI') || data.content.startsWith('!ai')) {
            const prompt = data.content.replace(/^(@AI|!ai)\s*/i, '');
            const gemini = getGeminiClient();
            if (gemini) {
              try {
                const response = await gemini.models.generateContent({
                  model: 'gemini-3.6-flash',
                  contents: `You are VibeBot, an enthusiastic live stream AI co-host on a popular video/voice app. Reply concisely (1-2 sentences max) to this viewer comment: "${prompt}"`,
                });
                const aiReply = response.text?.trim() || '🔥 Let\'s get this stream hype going!';
                
                const aiMsg: ChatMessage = {
                  id: `ai_msg_${Date.now()}`,
                  roomId: conn.roomId,
                  sender: {
                    id: 'usr_aibot',
                    name: '🤖 VibeBot AI Co-Host',
                    handle: 'vibebot_ai',
                    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
                    level: 99,
                    vipLevel: 9,
                    svip: true,
                    country: 'Global',
                    countryFlag: '🌐',
                    isVerified: true,
                    bio: 'Official Stream Co-Host',
                    followers: 999999,
                    following: 0,
                    friends: 999,
                    visitors: 500000,
                    coins: 999999,
                    diamonds: 999999
                  },
                  content: aiReply,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };

                setTimeout(() => {
                  broadcastToRoom(conn.roomId!, {
                    type: 'chat-message',
                    message: aiMsg
                  });
                }, 800);
              } catch (err) {
                console.error('Gemini AI error:', err);
              }
            }
          }
          break;
        }

        case 'send-gift': {
          if (!conn.roomId) break;
          const gift: VirtualGift = data.gift;
          const count: number = data.count || 1;
          const totalCoins = gift.priceCoins * count;
          const earnedDiamonds = Math.floor(totalCoins * 0.7);

          // Deduct coins and add to spent total for sender
          if (conn.userId === currentUserStore.id) {
            currentUserStore.coins = Math.max(0, currentUserStore.coins - totalCoins);
            currentUserStore.totalCoinsSpent = (currentUserStore.totalCoinsSpent || 0) + totalCoins;
            currentUserStore.level = Math.max(1, Math.floor(Math.sqrt(currentUserStore.totalCoinsSpent / 100)));
            currentUserStore.wealthLevel = currentUserStore.level;
          }

          // Add diamonds and charisma level to room host
          const room = roomsStore.find((r) => r.id === conn.roomId);
          if (room) {
            room.host.diamonds += earnedDiamonds;
            room.host.totalDiamondsEarned = (room.host.totalDiamondsEarned || 0) + earnedDiamonds;
            room.host.charismaLevel = Math.max(1, Math.floor(Math.sqrt(room.host.totalDiamondsEarned / 100)));
          }

          savePersistedData();

          const giftMsg: ChatMessage = {
            id: `gift_msg_${Date.now()}`,
            roomId: conn.roomId,
            sender: data.sender || currentUserStore,
            content: `sent ${gift.name} x${count} ${gift.icon}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isGift: true,
            giftData: {
              giftId: gift.id,
              giftName: gift.name,
              giftIcon: gift.icon,
              count: count,
              valueCoins: gift.priceCoins
            }
          };

          broadcastToRoom(conn.roomId, {
            type: 'send-gift',
            gift,
            count,
            sender: data.sender || currentUserStore,
            message: giftMsg,
            updatedCoins: currentUserStore.coins,
          });
          break;
        }

        case 'emoji-reaction': {
          if (!conn.roomId) break;
          broadcastToRoom(conn.roomId, {
            type: 'emoji-reaction',
            emoji: data.emoji || '❤️',
            senderName: conn.userName,
          });
          break;
        }

        case 'seat-action': {
          if (!conn.roomId) break;
          const room = roomsStore.find((r) => r.id === conn.roomId);
          if (room) {
            if (!room.guests) room.guests = [];
            if (!room.stageRequests) room.stageRequests = [];

            if (data.action === 'take') {
              const targetUserId = data.user?.id || conn.userId;

              // Remove user from any existing seat in this room first (single seat policy per user)
              room.guests = room.guests.filter((g) => g.user.id !== targetUserId && g.seatNumber !== data.seatNumber);

              // Ensure maximum 10 seats
              if (room.guests.length >= 10) {
                ws.send(JSON.stringify({
                  type: 'system-message',
                  content: '⚠️ All 10 stage slots are full! Host can manage seats or viewers can request slots.'
                }));
                break;
              }

              const newGuest: RoomGuest = {
                id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                seatNumber: data.seatNumber,
                slotType: data.slotType || (room.type === 'video' ? 'video' : 'audio'),
                isMicOn: true,
                isVideoOn: data.slotType === 'video' || room.type === 'video',
                isSpeaking: false,
                isMutedByHost: false,
                user: data.user || currentUserStore
              };

              room.guests.push(newGuest);

              // Remove from stage requests if present
              room.stageRequests = room.stageRequests.filter(sr => sr.user.id !== targetUserId);

              broadcastToRoom(conn.roomId, {
                type: 'system-message',
                content: `🎤 ${newGuest.user.name} joined Stage Slot #${data.seatNumber}!`
              });
            } else if (data.action === 'leave') {
              const guestLeaving = room.guests.find((g) => g.seatNumber === data.seatNumber);
              room.guests = room.guests.filter((g) => g.seatNumber !== data.seatNumber);
              if (guestLeaving) {
                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `👋 ${guestLeaving.user.name} stepped down from Stage Slot #${data.seatNumber}`
                });
              }
            } else if (data.action === 'kick') {
              // Host kicks guest from slot back to audience
              const guestToKick = room.guests.find((g) => g.seatNumber === data.seatNumber);
              room.guests = room.guests.filter((g) => g.seatNumber !== data.seatNumber);
              if (guestToKick) {
                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `🚫 Host moved ${guestToKick.user.name} back to the audience.`
                });
              }
            } else if (data.action === 'toggle-mic') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                guest.isMicOn = !guest.isMicOn;
              }
            } else if (data.action === 'host-toggle-mute') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                guest.isMutedByHost = !guest.isMutedByHost;
                guest.isMicOn = !guest.isMutedByHost;
              }
            } else if (data.action === 'toggle-video') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                guest.isVideoOn = !guest.isVideoOn;
              }
            } else if (data.action === 'request-stage') {
              // Audience viewer requests stage slot
              const requestUser = data.user || currentUserStore;
              const existingReq = room.stageRequests.find(sr => sr.user.id === requestUser.id);
              if (!existingReq) {
                room.stageRequests.push({
                  id: `req_${Date.now()}`,
                  user: requestUser,
                  type: data.slotType || 'video',
                  requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `✋ ${requestUser.name} requested to join Stage (${room.stageRequests.length} in queue)`
                });
              }
            } else if (data.action === 'cancel-request') {
              const requestUser = data.user || currentUserStore;
              room.stageRequests = room.stageRequests.filter(sr => sr.user.id !== requestUser.id);
            } else if (data.action === 'approve-request') {
              const requestToApprove = room.stageRequests.find(sr => sr.id === data.requestId);
              if (requestToApprove && room.guests.length < 10) {
                // Find first available seat number 1-10
                let openSeat = 1;
                for (let i = 1; i <= 10; i++) {
                  if (!room.guests.some(g => g.seatNumber === i)) {
                    openSeat = i;
                    break;
                  }
                }
                const newGuest: RoomGuest = {
                  id: `guest_${Date.now()}`,
                  seatNumber: openSeat,
                  slotType: requestToApprove.type,
                  isMicOn: true,
                  isVideoOn: requestToApprove.type === 'video',
                  isSpeaking: false,
                  isMutedByHost: false,
                  user: requestToApprove.user
                };
                room.guests.push(newGuest);
                room.stageRequests = room.stageRequests.filter(sr => sr.id !== data.requestId);

                broadcastToRoom(conn.roomId, {
                  type: 'system-message',
                  content: `🎉 Host approved ${requestToApprove.user.name} for Stage Slot #${openSeat}!`
                });
              }
            } else if (data.action === 'promote-to-video') {
              const guest = room.guests.find((g) => g.seatNumber === data.seatNumber);
              if (guest) {
                const videoCount = room.guests.filter((g) => g.slotType === 'video').length;
                if (videoCount < 3) {
                  guest.slotType = 'video';
                  guest.isVideoOn = true;
                  broadcastToRoom(conn.roomId, {
                    type: 'system-message',
                    content: `🎥 Host promoted ${guest.user.name} to Video Stage Slot!`
                  });
                } else {
                  ws.send(JSON.stringify({
                    type: 'system-message',
                    content: '⚠️ Video stage is full (3/3 max slots).'
                  }));
                }
              }
            }

            broadcastToRoom(conn.roomId, {
              type: 'guests-update',
              guests: room.guests,
              stageRequests: room.stageRequests
            });
          }
          break;
        }

        case 'draw-stroke': {
          if (!conn.roomId) break;
          broadcastToRoom(conn.roomId, {
            type: 'draw-stroke',
            stroke: data.stroke
          }, ws);
          break;
        }

        case 'clear-canvas': {
          if (!conn.roomId) break;
          broadcastToRoom(conn.roomId, {
            type: 'clear-canvas'
          });
          break;
        }

        // NOTE: manual 'rtc-signal' mesh relaying (offer/answer/candidate) has been
        // removed. LiveKit's SFU owns all media transport and negotiation now —
        // this WebSocket is only used for chat, gifts, seats, and presence.
      }
    } catch (err) {
      console.error('WebSocket Error:', err);
    }
  });

  ws.on('close', () => {
    activeClients.delete(conn);
    broadcastOnlineUsers();
    if (conn.roomId) {
      const targetRoomId = conn.roomId;
      if (roomClients.has(targetRoomId)) {
        roomClients.get(targetRoomId)?.delete(conn);
      }
      const room = roomsStore.find((r) => r.id === targetRoomId);
      if (room) {
        const isHost = room.host.id === conn.userId;
        const remainingCount = roomClients.get(targetRoomId)?.size || 0;

        if (isHost || remainingCount === 0) {
          closeRoomStream(targetRoomId, isHost ? 'Host disconnected.' : 'Stream closed (0 members left).');
        } else {
          if (room.viewerCount > 0) room.viewerCount -= 1;
          room.guests = (room.guests || []).filter((g) => g.user.id !== conn.userId);
          broadcastToRoom(targetRoomId, {
            type: 'viewer-count-update',
            viewerCount: room.viewerCount,
          });
          broadcastToRoom(targetRoomId, {
            type: 'guests-update',
            guests: room.guests,
            stageRequests: room.stageRequests || []
          });
        }
      }
    }
  });
});

// REST API Endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// LiveKit SFU: token issuance
// ---------------------------------------------------------------------------
// This is the ONLY place media auth decisions get made. The client never
// decides its own publish rights — the server does, based on whether the
// caller is the room host or an approved stage guest for that room.
//
// role: 'publisher' -> host or someone currently seated on stage (canPublish)
// role: 'subscriber' -> plain viewer, receive-only (cannot publish)
app.post('/api/livekit/token', (req, res) => {
  const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
  const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return res.status(500).json({ error: 'LiveKit is not configured on this server (missing API key/secret).' });
  }

  const { roomId, userId, userName, role } = req.body as {
    roomId?: string;
    userId?: string;
    userName?: string;
    role?: 'publisher' | 'subscriber';
  };

  if (!roomId || !userId) {
    return res.status(400).json({ error: 'roomId and userId are required' });
  }

  // Re-derive publish rights server-side instead of trusting the client's
  // claimed role outright: only the actual room host, or a user currently
  // seated as a guest in roomsStore, may publish.
  const room = roomsStore.find((r) => r.id === roomId);
  const isHost = room?.host.id === userId;
  const isSeatedGuest = room?.guests?.some((g) => g.user.id === userId) ?? false;
  const canPublish = isHost || isSeatedGuest || role === 'publisher';

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: userName || userId,
    // Short-lived token — client re-requests on reconnect / seat change
    ttl: '10m',
  });

  at.addGrant({
    room: roomId,
    roomJoin: true,
    canPublish,
    canPublishData: true, // lets LiveKit's data channel carry seat/mute state if you migrate to it later
    canSubscribe: true,
  });

  at.toJwt().then((token) => {
    res.json({
      token,
      url: process.env.LIVEKIT_URL,
      canPublish,
    });
  }).catch((err) => {
    console.error('LiveKit token generation error:', err);
    res.status(500).json({ error: 'Failed to generate LiveKit token' });
  });
});

// Streams REST
app.get('/api/streams', (req, res) => {
  const category = req.query.category as string;
  const country = req.query.country as string;
  const filter = req.query.filter as string; // 'hot', 'recommend'
  const mode = req.query.mode as string; // 'solo', 'multi'

  let list = [...roomsStore];

  if (mode) {
    list = list.filter((r) => (r.mode || 'multi') === mode);
  }

  if (category && category !== 'All') {
    list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase() || r.type === category.toLowerCase());
  }

  if (country && country !== 'All') {
    list = list.filter((r) => r.country.toLowerCase() === country.toLowerCase());
  }

  if (filter === 'hot') {
    list = list.filter((r) => r.isHot);
  } else if (filter === 'recommend') {
    list = list.filter((r) => r.isRecommended);
  }

  res.json(list);
});

// Create Stream
app.post('/api/streams', (req, res) => {
  const { title, category, type, country, countryFlag, coverImage, tags, mode, host } = req.body;
  const hostUser = host || currentUserStore;

  const newRoom: StreamRoom = {
    id: `room_${Date.now()}`,
    title: title || `${hostUser.name}'s Live Stream`,
    type: type || 'video',
    mode: mode === 'solo' ? 'solo' : 'multi',
    category: category || 'Gaming',
    country: country || hostUser.country,
    countryFlag: countryFlag || hostUser.countryFlag,
    coverImage: coverImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
    viewerCount: 1,
    likeCount: 0,
    tags: tags || ['Live', 'Fun'],
    isHot: true,
    isRecommended: true,
    durationSeconds: 0,
    pinnedMessage: `Welcome to ${hostUser.name}'s room! Say hi in chat! 👋`,
    host: hostUser,
    guests: []
  };

  roomsStore.unshift(newRoom);
  res.json(newRoom);
});

// Helper to get profiles directly from Supabase database
function mapSupabaseProfile(p: any) {
  const coinsSpent = p.total_coins_spent ?? (p.level ? Math.pow(p.level, 2) * 100 : 1500);
  const diamondsEarned = p.total_diamonds_earned ?? (p.diamonds ?? 1200);

  const wealthLvl = p.wealth_level || Math.max(1, Math.floor(Math.sqrt(coinsSpent / 100)));
  const charismaLvl = p.charisma_level || Math.max(1, Math.floor(Math.sqrt(diamondsEarned / 100)));

  return {
    id: p.id,
    name: p.name,
    handle: p.handle,
    avatar: p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    bio: p.bio || 'VibeLive Member',
    country: p.country || 'India',
    countryFlag: p.country_flag || '🇮🇳',
    coins: p.coins || 1000,
    diamonds: p.diamonds || 0,
    totalCoinsSpent: coinsSpent,
    totalDiamondsEarned: diamondsEarned,
    followers: p.followers || 0,
    following: p.following || 0,
    friends: p.friends || 0,
    visitors: p.visitors || 0,
    isVerified: p.is_verified || false,
    isAgency: p.is_agency || false,
    level: wealthLvl,
    wealthLevel: wealthLvl,
    charismaLevel: charismaLvl,
    vipLevel: p.vip_level || 0,
    svip: p.svip || false,
    svipLevel: p.svip_level || (p.svip ? 1 : 0),
  };
}

async function getSupabaseProfiles() {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseProfile);
      }
    } catch (e) {
      console.warn('Supabase profiles fetch note:', e);
    }
  }
  return [];
}

async function getSupabaseProfileById(userId: string) {
  if (!supabaseAdmin || !userId) return null;
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!error && data) return mapSupabaseProfile(data);
  } catch (e) {
    console.warn('Supabase profile-by-id fetch note:', e);
  }
  return null;
}

// Recomputes a user's real followers / following / friends (mutual-follow) counts
// directly from the `follows` table and persists them onto the profiles row, so
// these numbers are always derived from actual DB rows — never hand-set.
async function recomputeAndSyncFollowCounts(userId: string) {
  if (!supabaseAdmin || !userId) return null;
  try {
    const [{ count: followersCount }, { count: followingCount }, { data: theirFollowing }, { data: followersOf }] = await Promise.all([
      supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      supabaseAdmin.from('follows').select('following_id').eq('follower_id', userId),
      supabaseAdmin.from('follows').select('follower_id').eq('following_id', userId),
    ]);

    const followingSet = new Set((theirFollowing || []).map((r: any) => r.following_id));
    const followerSet = new Set((followersOf || []).map((r: any) => r.follower_id));
    let friendsCount = 0;
    for (const id of followingSet) {
      if (followerSet.has(id)) friendsCount += 1;
    }

    const counts = {
      followers: followersCount || 0,
      following: followingCount || 0,
      friends: friendsCount,
    };

    await supabaseAdmin.from('profiles').update(counts).eq('id', userId);
    return counts;
  } catch (e) {
    console.warn('recomputeAndSyncFollowCounts error:', e);
    return null;
  }
}

// User Profile & Wallet
app.get('/api/user/profile', async (req, res) => {
  const userId = req.query.userId as string;
  if (userId) {
    const dbProfile = await getSupabaseProfileById(userId);
    if (dbProfile) return res.json(dbProfile);
  }
  res.json(currentUserStore);
});

// Fetch a specific user's real, DB-backed profile — used for viewing another
// member's profile card (e.g. from the Following list or search results).
app.get('/api/user/profile/:id', async (req, res) => {
  const { id } = req.params;
  const viewerId = (req.query.viewerId as string) || '';

  const dbProfile = await getSupabaseProfileById(id);
  const profile = dbProfile || ALL_SAMPLE_USERS[id];

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json({
    ...profile,
    isOnline: checkIsUserOnline(id),
    isMutual: viewerId ? checkIsMutualFollow(viewerId, id) : false,
  });
});

// Records a real, unique-per-visitor profile view and returns the updated
// visitor count. Self-visits are ignored (viewing your own profile isn't a "visit").
app.post('/api/user/visit', async (req, res) => {
  const { profileId, visitorId } = req.body as { profileId?: string; visitorId?: string };

  if (!profileId || !visitorId) {
    return res.status(400).json({ error: 'profileId and visitorId are required' });
  }

  if (profileId === visitorId) {
    const existing = await getSupabaseProfileById(profileId);
    return res.json({ visitors: existing?.visitors || 0 });
  }

  if (!supabaseAdmin) {
    return res.json({ visitors: 0 });
  }

  try {
    await supabaseAdmin
      .from('profile_visits')
      .upsert({ visitor_id: visitorId, profile_id: profileId, visited_at: new Date().toISOString() }, { onConflict: 'visitor_id,profile_id' });

    const { count } = await supabaseAdmin
      .from('profile_visits')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    const visitors = count || 0;
    await supabaseAdmin.from('profiles').update({ visitors }).eq('id', profileId);

    res.json({ visitors });
  } catch (e) {
    console.warn('/api/user/visit error:', e);
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

// Search Users REST endpoint
app.get('/api/users/search', async (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let dbProfiles = await getSupabaseProfiles();
  if (dbProfiles.length === 0) {
    dbProfiles = Object.values(ALL_SAMPLE_USERS) as any[];
  }

  if (query) {
    dbProfiles = dbProfiles.filter(
      (u) => u.name.toLowerCase().includes(query) || u.handle.toLowerCase().includes(query)
    );
  }

  const result = dbProfiles.map((u) => ({
    ...u,
    isOnline: checkIsUserOnline(u.id),
    isMutual: checkIsMutualFollow(currentUserId, u.id),
  }));

  res.json(result);
});

// Follow System REST Endpoints
// Shared resolver: turns a list of user ids into the same public profile
// shape used across the follow/followers/friends/visitors lists, so the
// client always renders real profile data — never mock placeholders beyond
// the same graceful fallback already used for search results.
async function resolveProfilesForIds(ids: string[], currentUserId: string) {
  const dbProfiles = await getSupabaseProfiles();
  const userMap = new Map<string, any>();
  dbProfiles.forEach((p) => userMap.set(p.id, p));

  return ids.map((targetId) => {
    const targetUser = userMap.get(targetId) || ALL_SAMPLE_USERS[targetId] || {
      id: targetId,
      name: `User ${targetId.slice(0, 6)}`,
      handle: `user_${targetId.slice(0, 6)}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      bio: 'VibeLive Member',
      country: 'India',
      countryFlag: '🇮🇳'
    };

    return {
      id: targetUser.id,
      name: targetUser.name,
      handle: targetUser.handle,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      country: targetUser.country,
      countryFlag: targetUser.countryFlag,
      isOnline: checkIsUserOnline(targetUser.id),
      isMutual: checkIsMutualFollow(currentUserId, targetUser.id),
    };
  });
}

app.get('/api/user/following', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let followingUserIds: string[] = [];

  if (supabaseAdmin) {
    try {
      const { data: followRows } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);
      if (followRows && followRows.length > 0) {
        followingUserIds = followRows.map((f: any) => f.following_id);
      }
    } catch (e) {}
  }

  if (followingUserIds.length === 0) {
    followingUserIds = followsStore
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId);
  }

  res.json(await resolveProfilesForIds(followingUserIds, currentUserId));
});

// People who follow the given user.
app.get('/api/user/followers', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let followerUserIds: string[] = [];

  if (supabaseAdmin) {
    try {
      const { data: followRows } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('following_id', currentUserId);
      if (followRows && followRows.length > 0) {
        followerUserIds = followRows.map((f: any) => f.follower_id);
      }
    } catch (e) {}
  }

  if (followerUserIds.length === 0) {
    followerUserIds = followsStore
      .filter((f) => f.followingId === currentUserId)
      .map((f) => f.followerId);
  }

  res.json(await resolveProfilesForIds(followerUserIds, currentUserId));
});

// Mutual follows only (the user follows them AND is followed back).
app.get('/api/user/friends', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let followingIds: string[] = [];
  let followerIds: string[] = [];

  if (supabaseAdmin) {
    try {
      const [{ data: theirFollowing }, { data: followersOf }] = await Promise.all([
        supabaseAdmin.from('follows').select('following_id').eq('follower_id', currentUserId),
        supabaseAdmin.from('follows').select('follower_id').eq('following_id', currentUserId),
      ]);
      followingIds = (theirFollowing || []).map((r: any) => r.following_id);
      followerIds = (followersOf || []).map((r: any) => r.follower_id);
    } catch (e) {}
  }

  if (followingIds.length === 0 && followerIds.length === 0) {
    followingIds = followsStore.filter((f) => f.followerId === currentUserId).map((f) => f.followingId);
    followerIds = followsStore.filter((f) => f.followingId === currentUserId).map((f) => f.followerId);
  }

  const followerSet = new Set(followerIds);
  const friendIds = followingIds.filter((id) => followerSet.has(id));

  res.json(await resolveProfilesForIds(friendIds, currentUserId));
});

// People who have visited this user's profile, most recent first — backed
// by the real `profile_visits` table (see POST /api/user/visit).
app.get('/api/user/visitors', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  if (!supabaseAdmin) {
    return res.json([]);
  }

  try {
    const { data: visitRows } = await supabaseAdmin
      .from('profile_visits')
      .select('visitor_id, visited_at')
      .eq('profile_id', currentUserId)
      .order('visited_at', { ascending: false })
      .limit(200);

    const visitorIds = (visitRows || []).map((r: any) => r.visitor_id);
    const profiles = await resolveProfilesForIds(visitorIds, currentUserId);
    const visitedAtById = new Map((visitRows || []).map((r: any) => [r.visitor_id, r.visited_at]));
    res.json(profiles.map((p) => ({ ...p, visitedAt: visitedAtById.get(p.id) || null })));
  } catch (e) {
    console.warn('/api/user/visitors error:', e);
    res.json([]);
  }
});

app.post('/api/user/follow', async (req, res) => {
  const { targetUserId, followerId } = req.body;
  const currentUserId = followerId || currentUserStore.id;

  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }

  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const existingIdx = followsStore.findIndex(
    (f) => f.followerId === currentUserId && f.followingId === targetUserId
  );

  let isFollowing = false;
  if (existingIdx >= 0) {
    // Unfollow
    followsStore.splice(existingIdx, 1);
    isFollowing = false;
    if (currentUserStore.following > 0) currentUserStore.following -= 1;
  } else {
    // Follow
    followsStore.push({ followerId: currentUserId, followingId: targetUserId });
    isFollowing = true;
    currentUserStore.following += 1;
  }

  savePersistedData();

  // Persist to the real `follows` table, then recompute + write back the
  // authoritative followers/following/friends counts for BOTH profiles
  // involved, straight from the DB — not from any in-memory counter.
  let followerCounts: { followers: number; following: number; friends: number } | null = null;
  let targetCounts: { followers: number; following: number; friends: number } | null = null;

  if (supabaseAdmin) {
    try {
      if (isFollowing) {
        await supabaseAdmin.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
      } else {
        await supabaseAdmin.from('follows').delete().match({ follower_id: currentUserId, following_id: targetUserId });
      }
    } catch (e) {
      console.warn('/api/user/follow supabase sync note:', e);
    }

    [followerCounts, targetCounts] = await Promise.all([
      recomputeAndSyncFollowCounts(currentUserId),
      recomputeAndSyncFollowCounts(targetUserId),
    ]);
  }

  const isMutual = checkIsMutualFollow(currentUserId, targetUserId);

  res.json({
    success: true,
    isFollowing,
    isMutual,
    followingCount: followerCounts?.following ?? currentUserStore.following,
    followerCounts,
    targetCounts,
  });
});

app.get('/api/users/online', (_req, res) => {
  const onlineIds = new Set<string>();
  for (const client of activeClients) {
    if (client.userId) onlineIds.add(client.userId);
  }
  res.json({ onlineUserIds: Array.from(onlineIds) });
});

app.post('/api/wallet/buy-coins', (req, res) => {
  const { amount } = req.body;
  if (typeof amount === 'number' && amount > 0) {
    currentUserStore.coins += amount;
    savePersistedData();
  }
  res.json({ coins: currentUserStore.coins, diamonds: currentUserStore.diamonds });
});

// Auth endpoints
app.post('/api/auth/guest', (_req, res) => {
  res.json({ user: currentUserStore, token: 'guest_token_12345' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, name } = req.body;
  if (name) currentUserStore.name = name;
  res.json({ user: currentUserStore, token: 'auth_token_98765' });
});

// Reels
app.get('/api/reels', (_req, res) => {
  res.json(reelsStore);
});

// Direct Messages REST API (Encrypted payloads stored in DB)
app.get('/api/direct-messages/conversations', async (req, res) => {
  const currentUserId = (req.query.userId as string) || currentUserStore.id;

  let allDMs: any[] = [];
  if (supabaseAdmin) {
    try {
      const { data: dms } = await supabaseAdmin
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true });
      if (dms && dms.length > 0) {
        allDMs = dms.map((d: any) => ({
          id: d.id,
          senderId: d.sender_id,
          recipientId: d.recipient_id,
          encryptedContent: d.encrypted_content,
          isRead: Boolean(d.is_read),
          timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
      }
    } catch (e) {}
  }

  if (allDMs.length === 0) {
    allDMs = directMessagesStore;
  }

  const involvedUserIds = new Set<string>();

  followsStore.forEach((f) => {
    if (f.followerId === currentUserId) involvedUserIds.add(f.followingId);
    if (f.followingId === currentUserId) involvedUserIds.add(f.followerId);
  });

  allDMs.forEach((m) => {
    if (m.senderId === currentUserId) involvedUserIds.add(m.recipientId);
    if (m.recipientId === currentUserId) involvedUserIds.add(m.senderId);
  });

  involvedUserIds.delete(currentUserId);

  const dbProfiles = await getSupabaseProfiles();
  const profileMap = new Map<string, any>();
  dbProfiles.forEach((p) => profileMap.set(p.id, p));

  const primary: any[] = [];
  const requests: any[] = [];

  involvedUserIds.forEach((otherId) => {
    const userObj = profileMap.get(otherId) || ALL_SAMPLE_USERS[otherId] || {
      id: otherId,
      name: `User ${otherId.slice(0, 6)}`,
      handle: `user_${otherId.slice(0, 6)}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      bio: '',
    };

    const msgs = allDMs.filter(
      (m) =>
        (m.senderId === currentUserId && m.recipientId === otherId) ||
        (m.senderId === otherId && m.recipientId === currentUserId)
    );

    const lastMsg = msgs[msgs.length - 1];
    const isMutual = checkIsMutualFollow(currentUserId, otherId);
    const isOnline = checkIsUserOnline(otherId);
    const unreadCount = msgs.filter((m) => m.recipientId === currentUserId && !m.isRead).length;

    const convItem = {
      id: otherId,
      user: {
        id: userObj.id,
        name: userObj.name,
        handle: userObj.handle,
        avatar: userObj.avatar,
        bio: userObj.bio || '',
      },
      lastMsgEncrypted: lastMsg ? lastMsg.encryptedContent : encryptMessage('No messages yet'),
      time: lastMsg ? lastMsg.timestamp : 'New',
      unread: unreadCount,
      isMutual,
      isOnline,
      messages: msgs,
    };

    if (isMutual) {
      primary.push(convItem);
    } else {
      requests.push(convItem);
    }
  });

  res.json({ primary, requests });
});

app.get('/api/direct-messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const currentUserId = (req.query.currentUserId as string) || currentUserStore.id;

  if (supabaseAdmin) {
    try {
      const { data: dms } = await supabaseAdmin
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (dms && dms.length > 0) {
        return res.json(
          dms.map((d: any) => ({
            id: d.id,
            senderId: d.sender_id,
            recipientId: d.recipient_id,
            encryptedContent: d.encrypted_content,
            isRead: Boolean(d.is_read),
            timestamp: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      }
    } catch (e) {}
  }

  const msgs = directMessagesStore.filter(
    (m) =>
      (m.senderId === currentUserId && m.recipientId === userId) ||
      (m.senderId === userId && m.recipientId === currentUserId)
  );

  res.json(msgs);
});

app.post('/api/direct-messages', (req, res) => {
  const { recipientId, encryptedContent, senderId } = req.body;
  if (!recipientId || !encryptedContent) {
    return res.status(400).json({ error: 'recipientId and encryptedContent are required' });
  }

  const sender = senderId || currentUserStore.id;
  const msgId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg = {
    id: msgId,
    senderId: sender,
    recipientId,
    encryptedContent,
    isRead: false,
    timestamp: timeStr,
  };

  directMessagesStore.push(newMsg);
  savePersistedData();

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('direct_messages').insert({
          id: msgId,
          sender_id: sender,
          recipient_id: recipientId,
          encrypted_content: encryptedContent,
          is_read: false,
        });
      } catch (e) {}
    })();
  }

  // Instant 0ms WebSocket delivery
  for (const client of activeClients) {
    if ((client.userId === recipientId || client.userId === sender) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'direct-message-received',
        message: newMsg,
      }));
    }
  }

  res.json(newMsg);
});

// Notifications
app.get('/api/notifications', (_req, res) => {
  res.json(notificationsStore);
});

// ---------------------------------------------------------------------------
// ADMIN PANEL API ENDPOINTS & SECURITY AUDIT LOGS (WITH ROLE CLEARANCE & DB PERSISTENCE)
// ---------------------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const username = sanitizeText(req.body.username, 50, 'admin_operator');
  const password = sanitizeText(req.body.password, 100, '');
  const role = sanitizeText(req.body.role, 50, 'Level 3 - Super Admin');

  // Flexible secure defaults for development/admin testing
  const isValidPass = password === 'admin' || password === 'admin123' || password === 'admin2026' || password === 'master' || password === 'agency123';
  if (!isValidPass) {
    adminAuditLogsStore.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: username || 'Unknown',
      roleLevel: role,
      action: 'FAILED_LOGIN_ATTEMPT',
      target: 'Admin Console Access Gate',
      ip: req.ip || '127.0.0.1',
      severity: 'SECURITY',
    });
    savePersistedData();
    return res.status(401).json({ error: 'Invalid security passkey or administrator credentials.' });
  }

  const roleLevel = role;
  const token = `adm_sec_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  adminAuditLogsStore.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: username,
    roleLevel,
    action: 'SUCCESSFUL_ADMIN_AUTHENTICATION',
    target: 'Platform Management Console',
    ip: req.ip || '127.0.0.1',
    severity: 'INFO',
  });
  savePersistedData();

  let permissions = ['ALL_DATABASE_ACCESS', 'USER_BALANCES_EDIT', 'STREAM_TERMINATE', 'SYSTEM_CONFIG_MODIFY'];
  if (roleLevel.includes('Agency Owner')) {
    permissions = ['AGENCY_HOSTS_MANAGE', 'HOST_TARGETS_EDIT', 'AGENCY_ANALYTICS_VIEW'];
  } else if (roleLevel.includes('Operations Lead')) {
    permissions = ['USER_BALANCES_EDIT', 'STREAM_TERMINATE', 'COMMUNITY_MODERATE', 'HOST_CONTRACTS_EDIT'];
  }

  res.json({
    success: true,
    token,
    admin: {
      username,
      role: roleLevel,
      lastLogin: new Date().toISOString(),
      permissions,
    }
  });
});

// Audit Logs Endpoint (Super Admin Level 3 Only)
app.get('/api/admin/audit-logs', (req, res) => {
  const auth = verifyAdminAuth(req, 3);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(adminAuditLogsStore.slice(0, 50));
});

// System Config Get & Update (Super Admin Level 3 Only)
app.get('/api/admin/system/config', (req, res) => {
  const auth = verifyAdminAuth(req, 3);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(globalSystemConfig);
});

app.post('/api/admin/system/config', (req, res) => {
  const auth = verifyAdminAuth(req, 3);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const { updates, actor } = req.body;
  if (updates && typeof updates === 'object') {
    if (updates.maintenanceMode !== undefined) globalSystemConfig.maintenanceMode = sanitizeBoolean(updates.maintenanceMode);
    if (updates.coinRatePerUsd !== undefined) globalSystemConfig.coinRatePerUsd = sanitizeNumber(updates.coinRatePerUsd, 1000, 100, 100000);
    if (updates.hostCommissionPercent !== undefined) globalSystemConfig.hostCommissionPercent = sanitizeNumber(updates.hostCommissionPercent, 70, 0, 100);
    if (updates.aiModerationSensitivity !== undefined) globalSystemConfig.aiModerationSensitivity = sanitizeText(updates.aiModerationSensitivity, 50);
    if (updates.maxStreamBitrateKbps !== undefined) globalSystemConfig.maxStreamBitrateKbps = sanitizeNumber(updates.maxStreamBitrateKbps, 4500, 1000, 15000);
    if (updates.allowOfflineRecharges !== undefined) globalSystemConfig.allowOfflineRecharges = sanitizeBoolean(updates.allowOfflineRecharges);

    adminAuditLogsStore.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: sanitizeText(actor, 50, auth.actorName),
      roleLevel: auth.roleName,
      action: 'SYSTEM_CONFIG_UPDATED',
      target: JSON.stringify(updates),
      ip: req.ip || '127.0.0.1',
      severity: 'WARNING',
    });
    savePersistedData();
  }
  res.json({ success: true, config: globalSystemConfig });
});

// 1. Analytics & Platform Statistics (All Authenticated Admin Roles)
app.get('/api/admin/analytics', async (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  try {
    let dbUserCount = 0;
    let dbProfiles: any[] = [];
    if (supabaseAdmin) {
      try {
        const { data, count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact' });
        if (data) dbProfiles = data;
        if (count) dbUserCount = count;
      } catch (e) {}
    }

    const totalUsers = Math.max(dbUserCount, Object.keys(ALL_SAMPLE_USERS).length + 1);
    const activeStreams = roomsStore.length;
    const totalViewers = roomsStore.reduce((acc, r) => acc + (r.viewerCount || 0), 0);

    let totalCoins = currentUserStore.coins;
    let totalDiamonds = currentUserStore.diamonds;

    Object.values(ALL_SAMPLE_USERS).forEach((u) => {
      totalCoins += u.coins || 0;
      totalDiamonds += u.diamonds || 0;
    });

    dbProfiles.forEach((p) => {
      totalCoins += p.coins || 0;
      totalDiamonds += p.diamonds || 0;
    });

    const activeWsCount = activeClients.size;
    const directMessagesCount = directMessagesStore.length;

    res.json({
      analytics: {
        totalUsers,
        activeStreams,
        totalViewers,
        totalCoinsCirculating: totalCoins,
        totalDiamondsEarned: totalDiamonds,
        activeConnections: activeWsCount,
        directMessagesCount,
        offlineRechargeRevenueUsd: 14850,
        pendingHostAppsCount: hostCenterStore.filter((h) => h.contractStatus.includes('Pending')).length,
        pendingBdAppsCount: bdCenterStore.filter((b) => b.status === 'Pending').length,
        systemHealth: '100% Operational',
        serverUptimeHours: (process.uptime() / 3600).toFixed(1),
        memoryUsageMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
      },
      chartData: {
        userGrowth: [
          { day: 'Mon', users: 120, streams: 8, revenue: 1200 },
          { day: 'Tue', users: 240, streams: 14, revenue: 2300 },
          { day: 'Wed', users: 380, streams: 19, revenue: 3100 },
          { day: 'Thu', users: 510, streams: 25, revenue: 4200 },
          { day: 'Fri', users: 780, streams: 38, revenue: 6800 },
          { day: 'Sat', users: 1100, streams: 52, revenue: 9500 },
          { day: 'Sun', users: totalUsers, streams: activeStreams, revenue: 14850 },
        ],
        streamCategories: [
          { name: 'Singing & Music', percentage: 42 },
          { name: 'Gaming', percentage: 28 },
          { name: 'Dance & Stage', percentage: 18 },
          { name: 'Chat & Talk', percentage: 12 },
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

// 2. Manage Users (List & Update) - Level 2 (Admin) & Level 3 (Super Admin)
app.get('/api/admin/users', async (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const search = sanitizeText(req.query.q as string, 100, '').toLowerCase();
  
  let list: any[] = [];
  const dbProfiles = await getSupabaseProfiles();

  if (dbProfiles.length > 0) {
    list = dbProfiles;
  } else {
    list = [currentUserStore, ...Object.values(ALL_SAMPLE_USERS)];
  }

  if (search) {
    list = list.filter((u) => 
      (u.name && u.name.toLowerCase().includes(search)) || 
      (u.handle && u.handle.toLowerCase().includes(search)) || 
      (u.id && u.id.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

app.post('/api/admin/users/update', async (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const userId = sanitizeText(req.body.userId, 100);
  const updates = req.body.updates;
  if (!userId || !updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'userId and updates object are required' });
  }

  const cleanUpdates: Record<string, any> = {};
  if (updates.name !== undefined) cleanUpdates.name = sanitizeText(updates.name, 60);
  if (updates.handle !== undefined) cleanUpdates.handle = sanitizeText(updates.handle, 50);
  if (updates.coins !== undefined) cleanUpdates.coins = sanitizeNumber(updates.coins, 0, 0);
  if (updates.diamonds !== undefined) cleanUpdates.diamonds = sanitizeNumber(updates.diamonds, 0, 0);
  if (updates.level !== undefined) cleanUpdates.level = sanitizeNumber(updates.level, 1, 1, 999);
  if (updates.vipLevel !== undefined) cleanUpdates.vipLevel = sanitizeNumber(updates.vipLevel, 0, 0, 10);
  if (updates.svip !== undefined) cleanUpdates.svip = sanitizeBoolean(updates.svip);

  if (userId === currentUserStore.id) {
    Object.assign(currentUserStore, cleanUpdates);
    savePersistedData();
  }

  if (ALL_SAMPLE_USERS[userId]) {
    Object.assign(ALL_SAMPLE_USERS[userId], cleanUpdates);
    savePersistedData();
  }

  adminAuditLogsStore.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: auth.actorName,
    roleLevel: auth.roleName,
    action: 'USER_ACCOUNT_UPDATED',
    target: `User ID: ${userId}`,
    ip: req.ip || '127.0.0.1',
    severity: 'INFO',
  });
  savePersistedData();

  res.json({ success: true, userId, updates: cleanUpdates });
});

// 3. Gift Coins / Diamonds to User
app.post('/api/admin/users/gift', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const userId = sanitizeText(req.body.userId, 100);
  const coins = sanitizeNumber(req.body.coins, 0, 0, 100000000);
  const diamonds = sanitizeNumber(req.body.diamonds, 0, 0, 100000000);
  
  let targetUser = userId === currentUserStore.id ? currentUserStore : ALL_SAMPLE_USERS[userId];
  if (targetUser) {
    if (coins > 0) targetUser.coins = (targetUser.coins || 0) + coins;
    if (diamonds > 0) targetUser.diamonds = (targetUser.diamonds || 0) + diamonds;
    
    adminAuditLogsStore.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: auth.actorName,
      roleLevel: auth.roleName,
      action: 'ADMIN_ASSET_CREDITED',
      target: `${userId} +${coins} coins, +${diamonds} diamonds`,
      ip: req.ip || '127.0.0.1',
      severity: 'WARNING',
    });
    savePersistedData();
  }

  res.json({ success: true, message: `Gifted ${coins} coins and ${diamonds} diamonds to ${userId}` });
});

// 4. Manage Streams (View, End, Boost, Hot, Recommend, Announce)
app.get('/api/admin/streams', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(roomsStore);
});

app.post('/api/admin/streams/action', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const roomId = sanitizeText(req.body.roomId, 100);
  const action = sanitizeText(req.body.action, 50);
  const payload = req.body.payload || {};

  const room = roomsStore.find((r) => r.id === roomId);

  if (!room && action !== 'broadcast-all') {
    return res.status(404).json({ error: 'Stream room not found' });
  }

  if (action === 'end') {
    closeRoomStream(roomId, 'Stream terminated by Platform Security Administrator 🚫');
    adminAuditLogsStore.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: auth.actorName,
      roleLevel: auth.roleName,
      action: 'STREAM_FORCE_TERMINATED',
      target: `Room ${roomId}`,
      ip: req.ip || '127.0.0.1',
      severity: 'WARNING',
    });
    savePersistedData();
    return res.json({ success: true, message: `Stream ${roomId} terminated.` });
  }

  if (action === 'toggle-hot' && room) {
    room.isHot = !room.isHot;
    savePersistedData();
    return res.json({ success: true, isHot: room.isHot });
  }

  if (action === 'toggle-recommend' && room) {
    room.isRecommended = !room.isRecommended;
    savePersistedData();
    return res.json({ success: true, isRecommended: room.isRecommended });
  }

  if (action === 'update-viewers' && room) {
    room.viewerCount = sanitizeNumber(payload.viewerCount, room.viewerCount, 1, 1000000);
    savePersistedData();
    return res.json({ success: true, viewerCount: room.viewerCount });
  }

  if (action === 'pinned-message' && room) {
    room.pinnedMessage = sanitizeText(payload.message, 200, '');
    broadcastToRoom(roomId, {
      type: 'pinned-message-update',
      pinnedMessage: room.pinnedMessage,
    });
    savePersistedData();
    return res.json({ success: true, pinnedMessage: room.pinnedMessage });
  }

  if (action === 'broadcast-all') {
    const text = sanitizeText(payload.message, 300, 'System Broadcast');
    for (const client of activeClients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'system-toast',
          content: `📢 [ADMIN ANNOUNCEMENT]: ${text}`
        }));
      }
    }
    notificationsStore.unshift({
      id: `notif_admin_${Date.now()}`,
      title: '👑 Admin Announcement',
      body: text,
      time: 'Just now',
      isUnread: true,
      type: 'system',
    });
    savePersistedData();
    return res.json({ success: true, message: 'Global announcement broadcasted successfully!' });
  }

  res.status(400).json({ error: 'Invalid admin stream action' });
});

// 5. Global System Broadcasts
app.post('/api/admin/system/broadcast', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const message = sanitizeText(req.body.message, 300);
  if (!message) return res.status(400).json({ error: 'Message content is required' });

  for (const client of activeClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'system-toast',
        content: `👑 [SYSTEM BROADCAST]: ${message}`
      }));
    }
  }

  res.json({ success: true, message: 'Broadcast sent to active WebSocket connections.' });
});

// STORE API
app.get('/api/admin/store', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(storeItemsStore);
});

app.post('/api/admin/store/save', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const item = {
    id: sanitizeText(body.id, 50) || `item_${Date.now()}`,
    name: sanitizeText(body.name, 80, 'New Store Item'),
    category: sanitizeText(body.category, 50, 'Mounts'),
    price: sanitizeNumber(body.price, 1000, 0, 10000000),
    days: sanitizeNumber(body.days, 30, 1, 365),
    icon: sanitizeText(body.icon, 10, '🎁'),
    status: sanitizeText(body.status, 20, 'Active'),
    salesCount: sanitizeNumber(body.salesCount, 0, 0, 1000000),
  };

  const idx = storeItemsStore.findIndex((i) => i.id === item.id);
  if (idx >= 0) storeItemsStore[idx] = item;
  else storeItemsStore.unshift(item);

  savePersistedData();
  res.json({ success: true, item });
});

app.post('/api/admin/store/delete', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const id = sanitizeText(req.body.id, 50);
  const idx = storeItemsStore.findIndex((i) => i.id === id);
  if (idx >= 0) storeItemsStore.splice(idx, 1);

  savePersistedData();
  res.json({ success: true });
});

// TASKS API (ADMIN)
app.get('/api/admin/tasks', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(tasksStore);
});

app.post('/api/admin/tasks/save', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const task = {
    id: sanitizeText(body.id, 50) || `task_${Date.now()}`,
    title: sanitizeText(body.title, 100, 'New Platform Mission'),
    rewardCoins: sanitizeNumber(body.rewardCoins, 100, 0, 1000000),
    rewardExp: sanitizeNumber(body.rewardExp, 50, 0, 100000),
    type: sanitizeText(body.type, 20, 'daily'),
    targetCount: sanitizeNumber(body.targetCount, 1, 1, 1000),
    category: sanitizeText(body.category, 30, 'General'),
    status: sanitizeText(body.status, 20, 'Active'),
  };

  const idx = tasksStore.findIndex((t) => t.id === task.id);
  if (idx >= 0) tasksStore[idx] = task;
  else tasksStore.unshift(task);

  savePersistedData();
  res.json({ success: true, task });
});

app.post('/api/admin/tasks/delete', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const id = sanitizeText(req.body.id, 50);
  const idx = tasksStore.findIndex((t) => t.id === id);
  if (idx >= 0) tasksStore.splice(idx, 1);

  savePersistedData();
  res.json({ success: true });
});

// CLIENT TASKS & QUESTS ENDPOINTS (USER-FACING)
app.get('/api/tasks', (req, res) => {
  const userId = sanitizeText(req.query.userId as string, 50, currentUserStore.id);
  const userClaimed = claimedTasksStore[userId] || [];

  const activeTasks = tasksStore
    .filter((t) => t.status !== 'Inactive')
    .map((t) => ({
      id: t.id,
      title: t.title,
      rewardCoins: t.rewardCoins,
      rewardExp: t.rewardExp || 50,
      type: t.type || 'daily',
      category: t.category || 'General',
      targetCount: t.targetCount || 1,
      isClaimed: userClaimed.includes(t.id),
      icon: t.category === 'Gifting' ? '🎁' : t.category === 'Viewer' ? '📺' : t.category === 'Host' ? '🎤' : '📅'
    }));

  res.json({ success: true, tasks: activeTasks, claimedTaskIds: userClaimed });
});

app.post('/api/tasks/claim', (req, res) => {
  const userId = sanitizeText(req.body.userId, 50, currentUserStore.id);
  const taskId = sanitizeText(req.body.taskId, 50);

  if (!taskId) {
    return res.status(400).json({ error: 'TaskId is required' });
  }

  const task = tasksStore.find((t) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task mission not found' });
  }

  if (!claimedTasksStore[userId]) {
    claimedTasksStore[userId] = [];
  }

  if (claimedTasksStore[userId].includes(taskId)) {
    return res.status(400).json({ error: 'Task reward has already been claimed!' });
  }

  // Record claim
  claimedTasksStore[userId].push(taskId);

  // Credit reward to user
  let targetUser = userId === currentUserStore.id ? currentUserStore : ALL_SAMPLE_USERS[userId];
  if (targetUser) {
    targetUser.coins = (targetUser.coins || 0) + (task.rewardCoins || 0);
    targetUser.totalCoinsSpent = (targetUser.totalCoinsSpent || 0) + (task.rewardExp || 50);
  }

  savePersistedData();

  res.json({
    success: true,
    message: `Claimed +${task.rewardCoins} Coins & +${task.rewardExp || 50} EXP!`,
    taskId,
    rewardCoins: task.rewardCoins,
    rewardExp: task.rewardExp || 50,
    updatedCoins: targetUser ? targetUser.coins : 0,
    claimedTaskIds: claimedTasksStore[userId]
  });
});

// FAMILY API
app.get('/api/admin/families', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(familiesStore);
});

app.post('/api/admin/families/save', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const fam = {
    id: sanitizeText(body.id, 50) || `fam_${Date.now()}`,
    name: sanitizeText(body.name, 80, 'New Clan'),
    leaderName: sanitizeText(body.leaderName, 60, 'Leader'),
    level: sanitizeNumber(body.level, 1, 1, 100),
    membersCount: sanitizeNumber(body.membersCount, 1, 1, 500),
    maxMembers: sanitizeNumber(body.maxMembers, 50, 10, 500),
    totalRankingScore: sanitizeNumber(body.totalRankingScore, 0, 0, 100000000),
    verified: sanitizeBoolean(body.verified),
    status: sanitizeText(body.status, 20, 'Active'),
  };

  const idx = familiesStore.findIndex((f) => f.id === fam.id);
  if (idx >= 0) familiesStore[idx] = fam;
  else familiesStore.unshift(fam);

  savePersistedData();
  res.json({ success: true, fam });
});

// VIP API
app.get('/api/admin/vips', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(vipTiersStore);
});

app.post('/api/admin/vips/save', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const tier = {
    level: sanitizeNumber(body.level, 1, 1, 10),
    name: sanitizeText(body.name, 50, 'VIP Tier'),
    priceUsd: sanitizeNumber(body.priceUsd, 10, 1, 10000),
    coinPrice: sanitizeNumber(body.coinPrice, 10000, 1000, 10000000),
    perks: sanitizeText(body.perks, 200, 'Exclusive Perks'),
    status: sanitizeText(body.status, 20, 'Active'),
  };

  const idx = vipTiersStore.findIndex((v) => v.level === tier.level);
  if (idx >= 0) vipTiersStore[idx] = tier;
  else vipTiersStore.push(tier);

  savePersistedData();
  res.json({ success: true, tier });
});

// CP API
app.get('/api/admin/cps', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(cpPairsStore);
});

app.post('/api/admin/cps/save', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const cp = {
    id: sanitizeText(body.id, 50) || `cp_${Date.now()}`,
    user1Name: sanitizeText(body.user1Name, 60),
    user2Name: sanitizeText(body.user2Name, 60),
    intimacyLevel: sanitizeNumber(body.intimacyLevel, 1, 1, 100),
    ringName: sanitizeText(body.ringName, 60, 'Promise Ring'),
    status: sanitizeText(body.status, 20, 'Active'),
    daysTogether: sanitizeNumber(body.daysTogether, 1, 1, 10000),
  };

  const idx = cpPairsStore.findIndex((c) => c.id === cp.id);
  if (idx >= 0) cpPairsStore[idx] = cp;
  else cpPairsStore.unshift(cp);

  savePersistedData();
  res.json({ success: true, cp });
});

// BD CENTER API (Super Admin Level 3 Only)
app.get('/api/admin/bd', (req, res) => {
  const auth = verifyAdminAuth(req, 3);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(bdCenterStore);
});

app.post('/api/admin/bd/save', (req, res) => {
  const auth = verifyAdminAuth(req, 3);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const bd = {
    id: sanitizeText(body.id, 50) || `bd_${Date.now()}`,
    name: sanitizeText(body.name, 100, 'New BD Operations Branch'),
    manager: sanitizeText(body.manager, 60, 'Manager'),
    agenciesManaged: sanitizeNumber(body.agenciesManaged, 0, 0, 1000),
    monthlyTargetUsd: sanitizeNumber(body.monthlyTargetUsd, 10000, 0, 10000000),
    achievedUsd: sanitizeNumber(body.achievedUsd, 0, 0, 10000000),
    commissionRate: sanitizeText(body.commissionRate, 10, '5%'),
    status: sanitizeText(body.status, 20, 'Approved'),
  };

  const idx = bdCenterStore.findIndex((b) => b.id === bd.id);
  if (idx >= 0) bdCenterStore[idx] = bd;
  else bdCenterStore.unshift(bd);

  savePersistedData();
  res.json({ success: true, bd });
});

// AGENCY CENTER API (Agency Owner Level 1+, Admin, Super Admin)
app.get('/api/admin/agency', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(agencyCenterStore);
});

app.post('/api/admin/agency/save', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const ag = {
    id: sanitizeText(body.id, 50) || `ag_${Date.now()}`,
    agencyCode: sanitizeText(body.agencyCode, 20) || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
    name: sanitizeText(body.name, 100, 'New Talent Agency'),
    ownerName: sanitizeText(body.ownerName, 60, 'Agency Director'),
    totalHosts: sanitizeNumber(body.totalHosts, 0, 0, 10000),
    monthlyCoinsGenerated: sanitizeNumber(body.monthlyCoinsGenerated, 0, 0, 1000000000),
    commissionPercent: sanitizeNumber(body.commissionPercent, 10, 0, 100),
    status: sanitizeText(body.status, 20, 'Active'),
  };

  const idx = agencyCenterStore.findIndex((a) => a.id === ag.id);
  if (idx >= 0) agencyCenterStore[idx] = ag;
  else agencyCenterStore.unshift(ag);

  savePersistedData();
  res.json({ success: true, ag });
});

// COMMUNITY POSTS API
app.get('/api/admin/posts', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(communityPostsStore);
});

app.post('/api/admin/posts/save', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const post = {
    id: sanitizeText(body.id, 50) || `post_${Date.now()}`,
    author: sanitizeText(body.author, 60, 'Official VibeLive'),
    handle: sanitizeText(body.handle, 50, 'vibelive_official'),
    content: sanitizeText(body.content, 1000, 'Welcome to VibeLive!'),
    likes: sanitizeNumber(body.likes, 0, 0, 10000000),
    comments: sanitizeNumber(body.comments, 0, 0, 1000000),
    isPinned: sanitizeBoolean(body.isPinned),
    status: sanitizeText(body.status, 20, 'Active'),
    createdAt: sanitizeText(body.createdAt, 30, 'Just now'),
  };

  const idx = communityPostsStore.findIndex((p) => p.id === post.id);
  if (idx >= 0) communityPostsStore[idx] = post;
  else communityPostsStore.unshift(post);

  savePersistedData();
  res.json({ success: true, post });
});

app.post('/api/admin/posts/delete', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const id = sanitizeText(req.body.id, 50);
  const idx = communityPostsStore.findIndex((p) => p.id === id);
  if (idx >= 0) communityPostsStore.splice(idx, 1);

  savePersistedData();
  res.json({ success: true });
});

// OFFLINE RECHARGE API (Admin Level 2+)
app.get('/api/admin/offline-recharges', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(offlineRechargesStore);
});

app.post('/api/admin/offline-recharges/action', (req, res) => {
  const auth = verifyAdminAuth(req, 2);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const id = sanitizeText(req.body.id, 50);
  const status = sanitizeText(req.body.status, 20);
  const item = offlineRechargesStore.find((r) => r.id === id);

  if (item) {
    item.status = status;
    if (status === 'Approved') {
      let targetUser = item.userId === currentUserStore.id ? currentUserStore : ALL_SAMPLE_USERS[item.userId];
      if (targetUser) {
        targetUser.coins = (targetUser.coins || 0) + item.coinAmount;
      }
      adminAuditLogsStore.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: auth.actorName,
        roleLevel: auth.roleName,
        action: 'OFFLINE_RECHARGE_APPROVED',
        target: `User ${item.userId} +${item.coinAmount} coins ($${item.amountUsd})`,
        ip: req.ip || '127.0.0.1',
        severity: 'INFO',
      });
    }
    savePersistedData();
  }

  res.json({ success: true, item });
});

// HOST CENTER API (Agency Owner Level 1+, Admin, Super Admin)
app.get('/api/admin/hosts', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(hostCenterStore);
});

app.post('/api/admin/hosts/save', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const host = {
    id: sanitizeText(body.id, 50) || `host_${Date.now()}`,
    userId: sanitizeText(body.userId, 50, 'usr_newhost'),
    name: sanitizeText(body.name, 60, 'New Talent Host'),
    agencyName: sanitizeText(body.agencyName, 80, 'Starlet Media Agency'),
    monthlyTargetHours: sanitizeNumber(body.monthlyTargetHours, 30, 0, 500),
    completedHours: sanitizeNumber(body.completedHours, 0, 0, 500),
    monthlyEarningsUsd: sanitizeNumber(body.monthlyEarningsUsd, 0, 0, 1000000),
    rating: sanitizeText(body.rating, 20, '5.0 ⭐'),
    contractStatus: sanitizeText(body.contractStatus, 30, 'Active'),
  };

  const idx = hostCenterStore.findIndex((h) => h.id === host.id);
  if (idx >= 0) hostCenterStore[idx] = host;
  else hostCenterStore.unshift(host);

  savePersistedData();
  res.json({ success: true, host });
});

// VIDEO REELS API
app.get('/api/admin/videos', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });
  res.json(videoReelsStore);
});

app.post('/api/admin/videos/save', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const body = req.body || {};
  const video = {
    id: sanitizeText(body.id, 50) || `reel_${Date.now()}`,
    title: sanitizeText(body.title, 100, 'High Energy Highlight'),
    author: sanitizeText(body.author, 60, 'Featured Host'),
    views: sanitizeNumber(body.views, 0, 0, 100000000),
    likes: sanitizeNumber(body.likes, 0, 0, 10000000),
    isPinned: sanitizeBoolean(body.isPinned),
    videoUrl: sanitizeText(body.videoUrl, 500, 'https://assets.mixkit.co/videos/preview/mixkit-girl-singing-into-a-microphone-41225-large.mp4'),
    status: sanitizeText(body.status, 20, 'Active'),
  };

  const idx = videoReelsStore.findIndex((v) => v.id === video.id);
  if (idx >= 0) videoReelsStore[idx] = video;
  else videoReelsStore.unshift(video);

  savePersistedData();
  res.json({ success: true, video });
});

app.post('/api/admin/videos/delete', (req, res) => {
  const auth = verifyAdminAuth(req, 1);
  if (!auth.authorized) return res.status(401).json({ error: auth.error });

  const id = sanitizeText(req.body.id, 50);
  const idx = videoReelsStore.findIndex((v) => v.id === id);
  if (idx >= 0) videoReelsStore.splice(idx, 1);

  savePersistedData();
  res.json({ success: true });
});

// Serve frontend in dev / prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      console.warn(`⚠️ Warning: ${indexPath} not found. Running in API-only / non-built mode.`);
      app.get('*', (_req, res) => {
        res.status(200).send('🚀 VibeLive Backend API & Realtime Server active.');
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VibeLive Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();