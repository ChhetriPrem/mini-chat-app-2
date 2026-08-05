import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, Car, MessageSquare, Shield, Check, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoreItem {
  id: string;
  name: string;
  category: 'frames' | 'mounts' | 'bubbles' | 'badges';
  price: number;
  icon: string;
  image?: string;
  description: string;
  previewClass: string;
}

const STORE_ITEMS: StoreItem[] = [
  // Avatar Frames
  { id: 'f1', name: 'Golden Phoenix Frame', category: 'frames', price: 2000, icon: '🔥', description: 'Legendary glowing golden flame frame', previewClass: 'ring-4 ring-amber-400 shadow-amber-500/50' },
  { id: 'f2', name: 'Cyber Neon Frame', category: 'frames', price: 1500, icon: '⚡', description: 'Futuristic pulsing neon cyan ring', previewClass: 'ring-4 ring-cyan-400 shadow-cyan-500/50' },
  { id: 'f3', name: 'Royal Crown Frame', category: 'frames', price: 3000, icon: '👑', description: 'Royal purple frame studded with diamonds', previewClass: 'ring-4 ring-purple-500 shadow-purple-500/50' },
  
  // Entrance Mounts
  { id: 'm1', name: 'Golden Bugatti Mount', category: 'mounts', price: 8000, icon: '🏎️', description: 'Arrive in live rooms with golden Bugatti animation', previewClass: 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black' },
  { id: 'm2', name: 'Celestial Dragon Mount', category: 'mounts', price: 12000, icon: '🐉', description: 'Roar into room with a glowing blue dragon animation', previewClass: 'bg-gradient-to-r from-blue-600 to-cyan-400 text-white' },
  
  // Chat Bubbles
  { id: 'b1', name: 'Rose Petal Chat Bubble', category: 'bubbles', price: 1000, icon: '🌹', description: 'Pink gradient bubble for room messages', previewClass: 'bg-gradient-to-r from-pink-600 to-rose-500 text-white' },
  { id: 'b2', name: 'VIP Gold Bubble', category: 'bubbles', price: 2500, icon: '✨', description: 'Metallic gold chat bubble with crown icon', previewClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold' },
  
  // Badges
  { id: 'bg1', name: 'Top Supporter Badge', category: 'badges', price: 5000, icon: '💎', description: 'Shiny 3D badge on your profile card', previewClass: 'bg-indigo-600 text-white' },
];

export function StoreModal({ isOpen, onClose }: StoreModalProps) {
  const { user, deductCoins } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'frames' | 'mounts' | 'bubbles' | 'badges'>('frames');
  const [ownedItems, setOwnedItems] = useState<string[]>(['f1']);
  const [equippedItems, setEquippedItems] = useState<{ [key: string]: string }>({ frames: 'f1' });
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBuyOrEquip = (item: StoreItem) => {
    const isOwned = ownedItems.includes(item.id);
    const isEquipped = equippedItems[item.category] === item.id;

    if (isEquipped) {
      // Unequip
      const updated = { ...equippedItems };
      delete updated[item.category];
      setEquippedItems(updated);
      showToast(`Unequipped ${item.name}`);
      return;
    }

    if (isOwned) {
      // Equip
      setEquippedItems({ ...equippedItems, [item.category]: item.id });
      showToast(`Equipped ${item.name}! ✨`);
      return;
    }

    // Purchase logic
    if (!deductCoins(item.price)) {
      showToast('Insufficient Coins! Please recharge in Wallet.');
      return;
    }

    setOwnedItems([...ownedItems, item.id]);
    setEquippedItems({ ...equippedItems, [item.category]: item.id });
    showToast(`Purchased & Equipped ${item.name}! 🎉`);
  };

  const filteredItems = STORE_ITEMS.filter((i) => i.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#1c0d38] via-[#130829] to-[#090317] border border-purple-500/30 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <ShoppingBag className="w-5 h-5 text-purple-300" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Item Mall & Store</h2>
              <p className="text-[10px] text-gray-400">Custom Avatar Frames, Mounts & Chat Skins</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Coins Banner */}
        <div className="p-3 bg-purple-950/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-gray-300">My Balance:</span>
            <span className="text-xs font-black text-amber-300">{user.coins.toLocaleString()} Coins</span>
          </div>
          <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-500/30">
            {ownedItems.length} Owned
          </span>
        </div>

        {/* Category Tabs */}
        <div className="p-2.5 bg-black/40 border-b border-white/10 flex gap-1">
          {[
            { id: 'frames', label: 'Frames', icon: Sparkles },
            { id: 'mounts', label: 'Mounts', icon: Car },
            { id: 'bubbles', label: 'Bubbles', icon: MessageSquare },
            { id: 'badges', label: 'Badges', icon: Shield },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-xl text-center shadow-lg animate-bounce">
            {toast}
          </div>
        )}

        {/* Item List Grid */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped = equippedItems[item.category] === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white/5 border rounded-2xl p-3 flex flex-col justify-between space-y-2 relative transition-all ${
                    isEquipped ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-purple-500/40'
                  }`}
                >
                  {isEquipped && (
                    <span className="absolute top-2 right-2 bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center space-x-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Equipped</span>
                    </span>
                  )}

                  <div className="text-center pt-2">
                    <span className="text-3xl block mb-1">{item.icon}</span>
                    <h3 className="text-xs font-bold text-white truncate">{item.name}</h3>
                    <p className="text-[9px] text-gray-400 line-clamp-2 mt-0.5">{item.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center space-x-0.5">
                      <span>🪙</span>
                      <span>{item.price.toLocaleString()}</span>
                    </span>

                    <button
                      onClick={() => handleBuyOrEquip(item)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                        isEquipped
                          ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                          : isOwned
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                      }`}
                    >
                      {isEquipped ? 'Unequip' : isOwned ? 'Equip' : 'Buy'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
