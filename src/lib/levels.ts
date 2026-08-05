// Dual Leveling System Helpers: Wealth (Giver) Level & Charisma (Host/Receiver) Level

export interface LevelStats {
  level: number;
  exp: number;
  nextExp: number;
  progressPercent: number;
  title: string;
}

// Progressive threshold table for levels 1 to 100
export function getThresholdForLevel(lvl: number): number {
  if (lvl <= 1) return 0;
  if (lvl === 2) return 100;
  if (lvl === 3) return 500;
  if (lvl === 4) return 1500;
  if (lvl === 5) return 3500;
  if (lvl === 6) return 7000;
  if (lvl === 7) return 12000;
  if (lvl === 8) return 18000;
  if (lvl === 9) return 25000;
  if (lvl === 10) return 35000;
  
  // Exponential scaling for levels 11 to 100
  return Math.floor(35000 + Math.pow(lvl - 10, 2.1) * 3500);
}

export function calculateWealthLevel(coinsSpent: number = 0): LevelStats {
  let level = 1;
  while (level < 100 && coinsSpent >= getThresholdForLevel(level + 1)) {
    level++;
  }

  const currentLevelThreshold = getThresholdForLevel(level);
  const nextLevelThreshold = level >= 100 ? currentLevelThreshold : getThresholdForLevel(level + 1);

  const exp = Math.max(0, coinsSpent - currentLevelThreshold);
  const nextExp = level >= 100 ? 1 : Math.max(1, nextLevelThreshold - currentLevelThreshold);
  const progressPercent = level >= 100 ? 100 : Math.min(100, Math.max(0, Math.floor((exp / nextExp) * 100)));

  return {
    level,
    exp,
    nextExp,
    progressPercent,
    title: getWealthLevelTitle(level),
  };
}

export function calculateCharismaLevel(diamondsEarned: number = 0): LevelStats {
  let level = 1;
  while (level < 100 && diamondsEarned >= getThresholdForLevel(level + 1)) {
    level++;
  }

  const currentLevelThreshold = getThresholdForLevel(level);
  const nextLevelThreshold = level >= 100 ? currentLevelThreshold : getThresholdForLevel(level + 1);

  const exp = Math.max(0, diamondsEarned - currentLevelThreshold);
  const nextExp = level >= 100 ? 1 : Math.max(1, nextLevelThreshold - currentLevelThreshold);
  const progressPercent = level >= 100 ? 100 : Math.min(100, Math.max(0, Math.floor((exp / nextExp) * 100)));

  return {
    level,
    exp,
    nextExp,
    progressPercent,
    title: getCharismaLevelTitle(level),
  };
}

export function getWealthLevelTitle(lvl: number): string {
  if (lvl >= 90) return 'Supreme Celestial 🌌';
  if (lvl >= 75) return 'Universal Titan ⚡';
  if (lvl >= 60) return 'Emperor Benefactor 👑';
  if (lvl >= 50) return 'Crown Overlord 🔱';
  if (lvl >= 40) return 'Diamond Regent 💎';
  if (lvl >= 30) return 'Royal Giver ⚜️';
  if (lvl >= 20) return 'Platinum Patron 💍';
  if (lvl >= 10) return 'Gold Supporter 🪙';
  if (lvl >= 5) return 'Silver Giver 🥈';
  if (lvl >= 2) return 'Bronze Patron 🥉';
  return 'Giver Novice 🌱';
}

export function getCharismaLevelTitle(lvl: number): string {
  if (lvl >= 90) return 'Immortal Deity 🌟';
  if (lvl >= 75) return 'Galactic Superstar 🌠';
  if (lvl >= 60) return 'Sovereign Idol 👑';
  if (lvl >= 50) return 'Global Icon ✨';
  if (lvl >= 40) return 'Legendary Host 🔥';
  if (lvl >= 30) return 'Superstar Idol 💖';
  if (lvl >= 20) return 'Shining Star 🌟';
  if (lvl >= 10) return 'Rising Sensation 🎤';
  if (lvl >= 5) return 'Bright Talent 🌸';
  if (lvl >= 2) return 'Rising Host 🐣';
  return 'New Creator 🌱';
}

// Level Privileges List for Wealth Level
export function getWealthPrivileges(level: number): string[] {
  const perks: string[] = ['Standard Chat Badge', 'Basic Emotes'];
  if (level >= 5) perks.push('Special Room Entry Animation', 'Colored Chat Name');
  if (level >= 10) perks.push('Exclusive Giver Avatar Frame', 'Priority Seat Request');
  if (level >= 20) perks.push('Unique Gift Banner Effect', 'VIP Lounge Access');
  if (level >= 30) perks.push('Custom Entrance Sound', 'Global Room Broadcast Notice');
  if (level >= 50) perks.push('Supreme Crown Badge', 'Direct Creator DM Access');
  if (level >= 75) perks.push('Golden Car Entrance Effect', 'Custom Emote Slot');
  if (level >= 90) perks.push('Celestial Aura Effect', 'Personal Room Manager');
  return perks;
}

// Level Privileges List for Charisma Level
export function getCharismaPrivileges(level: number): string[] {
  const perks: string[] = ['Creator Profile Badge', 'Standard Live Stream Rights'];
  if (level >= 5) perks.push('High Bitrate HD Audio', 'Featured in Recommended Feed');
  if (level >= 10) perks.push('Exclusive Host Stage Spotlight', 'Custom Room Tags');
  if (level >= 20) perks.push('Multi-Guest 9-Seat Room Unlock', 'Live Gift Goal Bar');
  if (level >= 30) perks.push('Official Verified Host Badge', 'Higher Diamond Cashout Limits');
  if (level >= 50) perks.push('Global Live Banner Promotion', 'Dedicated Stream Manager');
  if (level >= 75) perks.push('App Store Banner Spotlight', 'Custom Virtual Gift Design');
  if (level >= 90) perks.push('Annual Creator Gala Invite', 'Max Cashout Tier');
  return perks;
}

// Badge Color Themes
export function getWealthBadgeStyle(level: number): string {
  if (level >= 75) return 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 text-black font-black border border-amber-200 shadow-lg animate-pulse';
  if (level >= 50) return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black font-black border border-amber-300 shadow-md';
  if (level >= 30) return 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-black border border-purple-300 shadow-sm';
  if (level >= 20) return 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white font-extrabold border border-indigo-400/50';
  if (level >= 10) return 'bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold border border-blue-400/40';
  if (level >= 5) return 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold border border-teal-400/40';
  return 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 font-bold border border-slate-600';
}

export function getCharismaBadgeStyle(level: number): string {
  if (level >= 75) return 'bg-gradient-to-r from-rose-500 via-pink-400 to-purple-600 text-white font-black border border-pink-200 shadow-lg animate-pulse';
  if (level >= 50) return 'bg-gradient-to-r from-pink-500 via-rose-400 to-purple-600 text-white font-black border border-pink-300 shadow-md';
  if (level >= 30) return 'bg-gradient-to-r from-rose-600 via-pink-500 to-fuchsia-600 text-white font-black border border-rose-300 shadow-sm';
  if (level >= 20) return 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-extrabold border border-fuchsia-400/50';
  if (level >= 10) return 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold border border-pink-400/40';
  if (level >= 5) return 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold border border-purple-400/40';
  return 'bg-gradient-to-r from-purple-900/80 to-pink-950/80 text-pink-200 font-bold border border-pink-500/30';
}

