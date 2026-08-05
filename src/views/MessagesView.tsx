import React, { useState, useEffect } from 'react';
import { Search, Send, ShieldCheck, Lock, Eye, EyeOff, User, MessageSquare, ArrowLeft, Check, CheckCheck, UserPlus, Sparkles, Inbox, MessageCircleWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { encryptMessage, decryptMessage } from '../lib/crypto';

export interface ChatTargetUser {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  bio?: string;
}

interface MessagesViewProps {
  targetUser?: ChatTargetUser | null;
  onClearTargetUser?: () => void;
}

interface ChatMessageItem {
  id: string;
  senderId: string;
  recipientId?: string;
  encryptedContent: string;
  isRead?: boolean;
  timestamp: string;
}

interface ChatConversation {
  id: string;
  user: ChatTargetUser;
  lastMsgEncrypted: string;
  time: string;
  unread: number;
  isMutual: boolean;
  isOnline: boolean;
  messages: ChatMessageItem[];
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  targetUser,
  onClearTargetUser,
}) => {
  const { user, toggleFollow } = useAuth();
  const {
    sendDirectMessage,
    markDirectMessagesRead,
    incomingDirectMessage,
    readReceiptEvent,
    onlineUserIds,
  } = useSocket();

  const [activeTab, setActiveTab] = useState<'primary' | 'requests'>('primary');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawCiphertext, setShowRawCiphertext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Scroll position tracking for the active conversation thread ---
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesScrollRef = React.useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const prevMsgCountRef = React.useRef<number>(0);
  const isAtBottomRef = React.useRef(true);

  const scrollToBottom = (smooth: boolean) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  };

  const handleMessagesScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottomRef.current = nearBottom;
    setIsAtBottom(nearBottom);
    if (nearBottom) setShowNewMessagePill(false);
  };

  // Guard: user is guaranteed non-null by App.tsx auth gate + isAuthenticated = !!session && !!profile
  // This early return is a belt-and-suspenders safety net
  if (!user) return null;

  const fetchConversations = () => {
    setIsLoading(true);
    fetch(`/api/direct-messages/conversations?userId=${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (Array.isArray(data.primary) || Array.isArray(data.requests))) {
          const combined = [...(data.primary || []), ...(data.requests || [])];
          setConversations(combined);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchConversations();
  }, [user.id]);

  useEffect(() => {
    if (!incomingDirectMessage) return;
    const { id, senderId, recipientId, encryptedContent, timestamp, isRead } = incomingDirectMessage;
    if (senderId !== user.id && recipientId !== user.id) return;
    const otherUserId = senderId === user.id ? recipientId : senderId;
    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === otherUserId);
      if (existingIdx >= 0) {
        return prev.map((c) => {
          if (c.id === otherUserId) {
            const hasMsg = c.messages.some((m) => m.id === id);
            let newMsgs;
            if (hasMsg) {
              newMsgs = c.messages;
            } else if (senderId === user.id) {
              // This is the server's confirmed echo of a message we just
              // sent optimistically. Replace the optimistic placeholder
              // (matched by content, since it has a client-generated
              // "dm_opt_..." id that will never equal the server's real
              // id) instead of appending a second copy — otherwise the
              // sender ends up seeing their own message twice.
              const optIdx = c.messages.findIndex(
                (m) => m.id.startsWith('dm_opt_') && m.senderId === senderId && m.encryptedContent === encryptedContent
              );
              if (optIdx !== -1) {
                newMsgs = [...c.messages];
                newMsgs[optIdx] = { id, senderId, recipientId, encryptedContent, isRead: Boolean(isRead), timestamp };
              } else {
                newMsgs = [...c.messages, { id, senderId, recipientId, encryptedContent, isRead: Boolean(isRead), timestamp }];
              }
            } else {
              newMsgs = [...c.messages, { id, senderId, recipientId, encryptedContent, isRead: Boolean(isRead), timestamp }];
            }
            return {
              ...c,
              lastMsgEncrypted: encryptedContent,
              time: timestamp || 'Just now',
              unread: senderId !== user.id && activeChatId !== otherUserId ? c.unread + 1 : c.unread,
              messages: newMsgs,
            };
          }
          return c;
        });
      } else {
        fetchConversations();
        return prev;
      }
    });
    if (activeChatId === senderId && senderId !== user.id) markDirectMessagesRead(senderId);
  }, [incomingDirectMessage, activeChatId, user.id]);

  useEffect(() => {
    if (!readReceiptEvent) return;
    const { readerId, senderId } = readReceiptEvent;
    if (senderId === user.id) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === readerId) return { ...c, messages: c.messages.map((m) => ({ ...m, isRead: true })) };
          return c;
        })
      );
    }
  }, [readReceiptEvent, user.id]);

  useEffect(() => {
    if (activeChatId) {
      markDirectMessagesRead(activeChatId);
      setConversations((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, unread: 0 } : c)));
    }
  }, [activeChatId]);

  useEffect(() => {
    if (targetUser) {
      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === targetUser.id);
        if (existing) return prev;
        const newConv: ChatConversation = {
          id: targetUser.id,
          user: targetUser,
          lastMsgEncrypted: encryptMessage(`Started chat with ${targetUser.name}`),
          time: 'Just now',
          unread: 0,
          isMutual: true,
          isOnline: onlineUserIds.has(targetUser.id),
          messages: [],
        };
        return [newConv, ...prev];
      });
      setActiveChatId(targetUser.id);
    }
  }, [targetUser, onlineUserIds]);

  const activeConv = conversations.find((c) => c.id === activeChatId);

  // Snap to the bottom (no animation) whenever a different conversation is
  // opened, and reset the "new message" state for it.
  useEffect(() => {
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setShowNewMessagePill(false);
    prevMsgCountRef.current = activeConv?.messages.length || 0;
    // Wait a tick for the thread to render before jumping.
    const t = setTimeout(() => scrollToBottom(false), 0);
    return () => clearTimeout(t);
  }, [activeChatId]);

  // When a new message lands in the open thread: if the user is already
  // at the bottom, just keep them pinned there with a smooth (not jumpy)
  // scroll — no need for them to do anything. If they've scrolled up to
  // read earlier messages, don't yank them down; instead surface a
  // "new message" pill they can tap to jump down.
  useEffect(() => {
    const count = activeConv?.messages.length || 0;
    if (count > prevMsgCountRef.current) {
      if (isAtBottomRef.current) {
        scrollToBottom(true);
      } else {
        setShowNewMessagePill(true);
      }
    }
    prevMsgCountRef.current = count;
  }, [activeConv?.messages.length]);

  useEffect(() => {
    if (activeChatId) {
      fetch(`/api/direct-messages/${activeChatId}?currentUserId=${user.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((serverMsgs) => {
          if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === activeChatId) {
                  const combinedMap = new Map<string, ChatMessageItem>();
                  c.messages.forEach((m) => combinedMap.set(m.id, m));
                  serverMsgs.forEach((sm: any) => {
                    combinedMap.set(sm.id, {
                      id: sm.id,
                      senderId: sm.senderId,
                      recipientId: sm.recipientId,
                      encryptedContent: sm.encryptedContent,
                      isRead: Boolean(sm.isRead),
                      timestamp: sm.timestamp,
                    });
                  });
                  return { ...c, messages: Array.from(combinedMap.values()) };
                }
                return c;
              })
            );
          }
        })
        .catch(() => {});
    }
  }, [activeChatId, user.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeChatId) return;
    const plainText = inputMsg.trim();
    const encrypted = encryptMessage(plainText);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `dm_opt_${Date.now()}`;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsgEncrypted: encrypted,
            time: 'Just now',
            messages: [...c.messages, { id: msgId, senderId: user.id, recipientId: activeChatId, encryptedContent: encrypted, isRead: false, timestamp: timeStr }],
          };
        }
        return c;
      })
    );
    setInputMsg('');
    // NOTE: sendDirectMessage() already delivers this over the WebSocket,
    // and the server persists + broadcasts it back from that single path.
    // This used to ALSO POST to /api/direct-messages, which independently
    // persisted + broadcast the exact same message a second time — that's
    // why a sent message appeared 3x for the sender (1 optimistic + 2
    // server echoes) and 2x for the recipient (1 per broadcast path).
    sendDirectMessage(activeChatId, encrypted);
  };

  const handleFollowBackRequest = async (targetUserId: string) => {
    // NOTE: `/api/user/follow` is a TOGGLE endpoint (follow <-> unfollow), and
    // toggleFollow() from AuthContext already calls it once. Calling it again
    // here used to send a *second* toggle request, which immediately undid
    // the follow (follow, then unfollow) — that's why "Follow Back" looked
    // like it did nothing. Only toggleFollow() should hit that endpoint.
    toggleFollow(targetUserId);
    setConversations((prev) => prev.map((c) => (c.id === targetUserId ? { ...c, isMutual: true } : c)));
    setActiveTab('primary');
  };

  const primaryConvs = conversations.filter(
    (c) => c.isMutual && (c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.user.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const requestConvs = conversations.filter(
    (c) => !c.isMutual && (c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.user.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const currentList = activeTab === 'primary' ? primaryConvs : requestConvs;

  return (
    <div className="pb-24 pt-3 px-3 max-w-md mx-auto space-y-3 min-h-screen text-white bg-[#0f0826]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          {activeChatId && (
            <button
              onClick={() => { setActiveChatId(null); onClearTargetUser?.(); }}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-lg font-black text-white">
            {activeConv ? activeConv.user.name : 'Direct Messages'}
          </h2>
        </div>
        <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[10px] font-extrabold text-emerald-300 shadow-md">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>E2E Encrypted</span>
        </div>
      </div>

      {!activeChatId ? (
        <div className="space-y-3">
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'primary' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Primary</span>
              {primaryConvs.length > 0 && <span className="ml-1 text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full">{primaryConvs.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'requests' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageCircleWarning className="w-3.5 h-3.5" />
              <span>Requests</span>
              {requestConvs.length > 0 && <span className="ml-1 text-[9px] bg-pink-500 text-white px-1.5 py-0.2 rounded-full font-bold">{requestConvs.length}</span>}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'primary' ? 'Search mutual friends in Primary...' : 'Search message requests...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="py-12 text-center bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 font-medium">Syncing inbox from Supabase...</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="py-12 text-center bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                <MessageSquare className="w-8 h-8 text-gray-500 mx-auto opacity-50" />
                <p className="text-xs text-gray-300 font-bold">{activeTab === 'primary' ? 'No Primary Messages Yet' : 'No Message Requests'}</p>
                <p className="text-[10px] text-gray-400">
                  {activeTab === 'primary'
                    ? 'Messages with contacts who follow each other appear in Primary Inbox.'
                    : 'Messages from non-mutual users will land here in Requests.'}
                </p>
              </div>
            ) : (
              currentList.map((conv) => {
                const decryptedPreview = decryptMessage(conv.lastMsgEncrypted);
                const isUserOnline = onlineUserIds.has(conv.user.id) || conv.isOnline;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveChatId(conv.id)}
                    className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center space-x-3 ${
                      activeChatId === conv.id ? 'bg-purple-900/50 border-pink-500/50 shadow-md' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={conv.user.avatar} alt={conv.user.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/60" />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0f0826] ${
                          isUserOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/50 animate-pulse' : 'bg-gray-500'
                        }`}
                        title={isUserOnline ? 'Online now' : 'Offline'}
                      />
                      {conv.unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-black shadow-md">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="text-xs font-black text-white truncate">{conv.user.name}</span>
                          {conv.isMutual && (
                            <span className="text-[8px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded-full">Mutual</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{conv.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 truncate flex items-center space-x-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0 inline" />
                        <span className="truncate">{decryptedPreview}</span>
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        activeConv && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-3 flex flex-col h-[72vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <img src={activeConv.user.avatar} alt={activeConv.user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f0826] ${
                    onlineUserIds.has(activeConv.user.id) || activeConv.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-black text-white">{activeConv.user.name}</h3>
                    {activeConv.isMutual ? (
                      <span className="text-[8px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">Mutual Contact</span>
                    ) : (
                      <span className="text-[8px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full">Message Request</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    @{activeConv.user.handle} • {onlineUserIds.has(activeConv.user.id) || activeConv.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRawCiphertext(!showRawCiphertext)}
                className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 border transition-all ${
                  showRawCiphertext ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {showRawCiphertext ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showRawCiphertext ? 'Hide DB Cipher' : 'Inspect DB Cipher'}</span>
              </button>
            </div>

            {!activeConv.isMutual && (
              <div className="bg-gradient-to-r from-amber-950/80 to-purple-950/80 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-200 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-[10px]">
                    <span className="font-bold block text-white">Message Request</span>
                    <span>Follow back to enable mutual DM inbox privileges.</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowBackRequest(activeConv.user.id)}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold rounded-xl text-[10px] hover:opacity-90 active:scale-95 transition-all shrink-0 shadow-md flex items-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" /><span>Follow Back</span>
                </button>
              </div>
            )}

            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2 text-[10px] text-emerald-200 flex items-start space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block font-bold">End-To-End AES Encrypted Chat</strong>
                Instant WebSocket messages encrypted into AES ciphertext with database backup.
              </div>
            </div>

            <div className="relative flex-1 min-h-0">
              <div
                ref={messagesScrollRef}
                onScroll={handleMessagesScroll}
                className="h-full overflow-y-auto space-y-2.5 pr-1 py-1"
              >
                {activeConv.messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
                    <Lock className="w-8 h-8 text-emerald-400 opacity-80" />
                    <span>Send an encrypted message to begin chatting</span>
                  </div>
                ) : (
                  activeConv.messages.map((m) => {
                    const isMe = m.senderId === user.id;
                    const decrypted = decryptMessage(m.encryptedContent);
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs ${
                          isMe ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-tr-none shadow-md' : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/10'
                        }`}>
                          <p className="font-medium whitespace-pre-wrap break-words">{decrypted}</p>
                          {showRawCiphertext && (
                            <div className="mt-1.5 pt-1.5 border-t border-white/20 text-[9px] font-mono text-amber-300/90 break-all bg-black/40 p-1 rounded">
                              <span className="font-bold block text-[8px] text-amber-400">DATABASE ENCRYPTED PAYLOAD:</span>
                              {m.encryptedContent}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mt-0.5 px-1">
                          <span className="text-[9px] text-gray-400">{m.timestamp}</span>
                          {isMe && (
                            m.isRead
                              ? <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" /></span>
                              : <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-gray-400 inline" /></span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating "jump to new message" arrow — only appears when
                  the user has scrolled up and a new message has arrived
                  while they weren't at the bottom. */}
              {showNewMessagePill && (
                <button
                  onClick={() => {
                    scrollToBottom(true);
                    setShowNewMessagePill(false);
                  }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-full shadow-xl shadow-pink-500/30 border border-white/20 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <span>New message</span>
                  <span className="inline-flex w-4 h-4 rounded-full bg-white/20 items-center justify-center animate-bounce">
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-1 border-t border-white/10">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={`Encrypted message to ${activeConv.user.name.split(' ')[0]}...`}
                className="flex-1 bg-black/60 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-pink-500 text-white rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-pink-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )
      )}
    </div>
  );
};
