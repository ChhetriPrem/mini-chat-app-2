import React, { useState, useRef } from 'react';
import { Gamepad2, Coins, Sparkles, Shield, Flame, Zap, Volume2, VolumeX, History, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SpinSegment {
  id: string;
  label: string;
  multiplier: number;
  type: 'win' | 'jackpot' | 'trap' | 'mystery' | 'dare' | 'respins';
  color: string;
  textColor: string;
  icon: string;
  description: string;
}

const MULTIPLIER_SEGMENTS: SpinSegment[] = [
  { id: '1', label: '2x WIN', multiplier: 2, type: 'win', color: '#6366f1', textColor: '#ffffff', icon: '💰', description: 'Double your bet coins!' },
  { id: '2', label: 'TRAP 💣', multiplier: 0, type: 'trap', color: '#ef4444', textColor: '#ffffff', icon: '💣', description: 'Lose your bet!' },
  { id: '3', label: '5x BOOST', multiplier: 5, type: 'win', color: '#ec4899', textColor: '#ffffff', icon: '🚀', description: '5x Multiplier win!' },
  { id: '4', label: '0.5x HALF', multiplier: 0.5, type: 'win', color: '#f59e0b', textColor: '#000000', icon: '🪙', description: 'Get back 50% of your bet' },
  { id: '5', label: '10x SUPER', multiplier: 10, type: 'win', color: '#8b5cf6', textColor: '#ffffff', icon: '🌟', description: '10x Big Win!' },
  { id: '6', label: 'MYSTERY 🎁', multiplier: 3, type: 'mystery', color: '#10b981', textColor: '#ffffff', icon: '🎁', description: 'Random reward multiplier (3x - 15x)' },
  { id: '7', label: '3x WIN', multiplier: 3, type: 'win', color: '#3b82f6', textColor: '#ffffff', icon: '✨', description: 'Triple your bet coins!' },
  { id: '8', label: '50x JACKPOT', multiplier: 50, type: 'jackpot', color: '#eab308', textColor: '#000000', icon: '👑', description: '50x MEGA JACKPOT!' },
];

const CRAZY_ROOM_SEGMENTS: SpinSegment[] = [
  { id: 'c1', label: 'Gift Host 🎁', multiplier: 1.5, type: 'win', color: '#ec4899', textColor: '#ffffff', icon: '🎁', description: 'Win 1.5x + Send Gift to Host!' },
  { id: 'c2', label: 'Coin Burn 💣', multiplier: 0, type: 'trap', color: '#dc2626', textColor: '#ffffff', icon: '🔥', description: 'Burn bet coins to room pot!' },
  { id: 'c3', label: 'Rain Coins 🌧️', multiplier: 3, type: 'win', color: '#10b981', textColor: '#ffffff', icon: '🌧️', description: '3x Win & Rain coins to chat!' },
  { id: 'c4', label: 'Host Dare 🎤', multiplier: 2, type: 'dare', color: '#8b5cf6', textColor: '#ffffff', icon: '🎤', description: 'Host must perform a dare!' },
  { id: 'c5', label: '100x MEGA 💎', multiplier: 100, type: 'jackpot', color: '#f59e0b', textColor: '#000000', icon: '💎', description: '100x LEGENDARY JACKPOT!' },
  { id: 'c6', label: 'FREE SPIN 🔄', multiplier: 1, type: 'respins', color: '#06b6d4', textColor: '#ffffff', icon: '🔄', description: 'Free spin + Keep your bet!' },
  { id: 'c7', label: '5x WIN ✨', multiplier: 5, type: 'win', color: '#6366f1', textColor: '#ffffff', icon: '⚡', description: '5x Multiplier payout!' },
  { id: 'c8', label: 'Shield Safe 🛡️', multiplier: 1, type: 'win', color: '#3b82f6', textColor: '#ffffff', icon: '🛡️', description: 'Safe refund + Insurance boost!' },
];

interface SpinWheelGameProps {
  onClose?: () => void;
}

export const SpinWheelGame: React.FC<SpinWheelGameProps> = ({ onClose }) => {
  const { buyCoins, deductCoins } = useAuth();

  const [mode, setMode] = useState<'multiplier' | 'crazy'>('multiplier');
  const [bet, setBet] = useState(50);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [lastWinSegment, setLastWinSegment] = useState<SpinSegment | null>(null);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);
  const [spinHistory, setSpinHistory] = useState<{ id: string; label: string; coins: number; icon: string }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Complications
  const [goldenBoost, setGoldenBoost] = useState(false);
  const [shieldInsurance, setShieldInsurance] = useState(false);
  const [feverCount, setFeverCount] = useState(0);
  const [freeDailySpinUsed, setFreeDailySpinUsed] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);

  const currentSegments = mode === 'multiplier' ? MULTIPLIER_SEGMENTS : CRAZY_ROOM_SEGMENTS;
  const numSegments = currentSegments.length;
  const segmentAngle = 360 / numSegments;

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  };

  const playWinSound = (isJackpot = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = isJackpot
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
        : [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  };

  const calculateEffectiveBet = () => {
    let finalBet = bet;
    if (goldenBoost) finalBet = Math.round(finalBet * 1.5);
    if (shieldInsurance) finalBet = Math.round(finalBet * 1.2);
    return finalBet;
  };

  const handleSpin = () => {
    if (isSpinning) return;

    const isFree = !freeDailySpinUsed;
    const effectiveBet = calculateEffectiveBet();

    if (!isFree) {
      if (!deductCoins(effectiveBet)) {
        alert(`Not enough coins! You need ${effectiveBet} coins for this spin.`);
        return;
      }
    } else {
      setFreeDailySpinUsed(true);
    }

    setIsSpinning(true);
    setLastWinSegment(null);
    setLastWinAmount(null);

    const winningIndex = Math.floor(Math.random() * numSegments);
    const extraRotations = (5 + Math.floor(Math.random() * 4)) * 360;
    const targetSegmentAngle = 360 - winningIndex * segmentAngle - segmentAngle / 2;
    const totalRotation = rotationDegree + extraRotations + (targetSegmentAngle - (rotationDegree % 360));

    setRotationDegree(totalRotation);

    let ticksPlayed = 0;
    const tickInterval = setInterval(() => {
      ticksPlayed++;
      playTickSound();
      if (ticksPlayed > 28) clearInterval(tickInterval);
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);

      const winningSeg = currentSegments[winningIndex];
      setLastWinSegment(winningSeg);

      let winCoins = 0;

      if (winningSeg.type === 'trap') {
        if (shieldInsurance) {
          winCoins = effectiveBet;
          buyCoins(winCoins);
          alert('🛡️ SHIELD SAVED YOU! Your bet coins were fully refunded.');
        } else {
          winCoins = 0;
        }
      } else if (winningSeg.type === 'respins') {
        winCoins = effectiveBet;
        buyCoins(winCoins);
      } else if (winningSeg.type === 'mystery') {
        const mysteryMult = Math.floor(Math.random() * 12) + 3;
        winCoins = Math.round(effectiveBet * mysteryMult);
        if (goldenBoost) winCoins = Math.round(winCoins * 2);
        buyCoins(winCoins);
      } else {
        let mult = winningSeg.multiplier;
        if (feverCount >= 3) mult *= 2;
        if (goldenBoost) mult *= 2;
        winCoins = Math.round(effectiveBet * mult);
        if (winCoins > 0) buyCoins(winCoins);
      }

      setLastWinAmount(winCoins);

      if (winCoins > 0) {
        playWinSound(winningSeg.type === 'jackpot');
      }

      setFeverCount((prev) => (prev >= 3 ? 0 : prev + 1));

      setSpinHistory((prev) => [
        { id: Math.random().toString(), label: winningSeg.label, coins: winCoins, icon: winningSeg.icon },
        ...prev.slice(0, 4),
      ]);
    }, 4500);
  };

  return (
    <div className="bg-[#13092b] border border-pink-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl text-white h-full flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-3 sm:p-4 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 text-black font-black shadow-md">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white flex items-center space-x-1">
              <span>LUCKY SPIN WHEEL</span>
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            </h2>
            <p className="text-[10px] text-pink-300">Spin for Multipliers & Jackpot</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
            title="Toggle Audio"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-red-600/80 text-white transition-all"
              title="Close Spin Game"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-3 flex flex-col">
      {/* Mode Switcher */}
      <div className="shrink-0 grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
        <button
          onClick={() => setMode('multiplier')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
            mode === 'multiplier' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🎰 Coin Multiplier</span>
        </button>
        <button
          onClick={() => setMode('crazy')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
            mode === 'crazy' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🤪 Crazy Room Dares</span>
        </button>
      </div>

      {/* ROTATING WHEEL CONTAINER (grows to fill available space) */}
      <div className="relative flex-1 min-h-[220px] w-full flex items-center justify-center select-none py-2">
        <div className="relative w-[min(62vw,272px)] h-[min(62vw,272px)] sm:w-64 sm:h-64 flex items-center justify-center">
        {/* Top Pointer Needle */}
        <div className="absolute -top-3 z-30 flex flex-col items-center">
          <div className="w-4 h-5 bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 shadow-2xl filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.8)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-black -mt-1 shadow-md" />
        </div>

        {/* Outer Glowing Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse" />

        {/* Rotatable Wheel Disk */}
        <div
          ref={wheelRef}
          className="w-[92%] h-[92%] rounded-full relative overflow-hidden border-4 border-amber-300 shadow-2xl transition-all duration-[4500ms] ease-[cubic-bezier(0.15,0.9,0.2,1)]"
          style={{ transform: `rotate(${rotationDegree}deg)` }}
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {currentSegments.map((seg, i) => {
              const startAngle = i * segmentAngle;
              const endAngle = (i + 1) * segmentAngle;
              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              const textAngle = startAngle + segmentAngle / 2;
              const textX = 50 + 32 * Math.cos((Math.PI * textAngle) / 180);
              const textY = 50 + 32 * Math.sin((Math.PI * textAngle) / 180);

              return (
                <g key={seg.id}>
                  <path d={pathData} fill={seg.color} stroke="#ffffff" strokeWidth="0.8" />
                  <text
                    x={textX}
                    y={textY}
                    fill={seg.textColor}
                    fontSize="4.5"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                  >
                    {seg.icon} {seg.label.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center Spin Hub / Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-white shadow-2xl flex flex-col items-center justify-center text-black font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-80"
        >
          <span className="text-[10px] uppercase tracking-wider">{isSpinning ? 'SPINNING' : 'SPIN!'}</span>
          {!freeDailySpinUsed && <span className="text-[8px] bg-red-600 text-white px-1 rounded-full animate-pulse">FREE</span>}
        </button>
        </div>
      </div>

      {/* Outcome Banner */}
      {lastWinSegment && (
        <div className="bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-indigo-900/80 border border-amber-400/50 p-2.5 rounded-2xl text-center animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-center space-x-1.5 text-amber-300 font-extrabold text-xs">
            <span className="text-xl">{lastWinSegment.icon}</span>
            <span>{lastWinSegment.label}</span>
          </div>
          <p className="text-[11px] font-bold text-white mt-0.5">
            {lastWinAmount !== null && lastWinAmount > 0
              ? `🎉 Won +${lastWinAmount.toLocaleString()} Coins!`
              : lastWinSegment.type === 'trap'
              ? '💣 Ouch! TRAP landed - Bet Lost!'
              : lastWinSegment.description}
          </p>
        </div>
      )}

      {/* Complication Modifiers & Power-ups */}
      <div className="bg-black/40 border border-white/10 p-2 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span className="flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Complication Boosters</span>
          </span>
          <span className="text-purple-300 font-mono text-[10px]">
            Fever: {feverCount}/3 {feverCount >= 3 ? '🔥 READY!' : ''}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setGoldenBoost(!goldenBoost)}
            className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center justify-between transition-all ${
              goldenBoost
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>2x Payout Boost</span>
            </div>
            <span className="text-[9px] font-mono text-amber-400">+50% Bet</span>
          </button>

          <button
            onClick={() => setShieldInsurance(!shieldInsurance)}
            className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center justify-between transition-all ${
              shieldInsurance
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Trap Shield</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400">+20% Bet</span>
          </button>
        </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs font-black text-amber-300">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Bet: {calculateEffectiveBet()}</span>
        </div>

        <div className="flex items-center space-x-1">
          {[10, 50, 100, 500].map((b) => (
            <button
              key={b}
              onClick={() => setBet(b)}
              disabled={isSpinning}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                bet === b ? 'bg-amber-400 text-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className="w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
      >
        <Sparkles className="w-4 h-4 text-black" />
        <span>{isSpinning ? 'SPINNING WHEEL...' : !freeDailySpinUsed ? 'CLAIM FREE SPIN NOW!' : `SPIN FOR ${calculateEffectiveBet()} COINS`}</span>
      </button>

      {/* Spin History */}
      {spinHistory.length > 0 && (
        <div className="pt-1">
          <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
            <History className="w-3 h-3 text-indigo-400" />
            <span>Recent Room Spins</span>
          </p>
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
            {spinHistory.map((h) => (
              <span
                key={h.id}
                className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white shrink-0 flex items-center space-x-1"
              >
                <span>{h.icon}</span>
                <span>{h.label}</span>
                <span className={h.coins > 0 ? 'text-amber-300 font-black' : 'text-slate-400'}>
                  {h.coins > 0 ? `+${h.coins}` : '0'}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};