import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, Trophy, CheckCircle2, XCircle, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TriviaGameProps {
  onClose?: () => void;
}

const TRIVIA_QUESTIONS = [
  {
    q: 'Which country invented the game of Chess?',
    options: ['China', 'India', 'Persia', 'Greece'],
    ans: 1,
  },
  {
    q: 'What is the world record for longest live stream broadcast?',
    options: ['150 Hours', '268 Hours', '624 Hours', '1000 Hours'],
    ans: 2,
  },
  {
    q: 'What is the currency symbol for Diamonds in live streaming apps?',
    options: ['💎', '🪙', '👑', '⚡'],
    ans: 0,
  },
];

export const TriviaGame: React.FC<TriviaGameProps> = ({ onClose }) => {
  const { buyCoins } = useAuth();
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);

  const currentQ = TRIVIA_QUESTIONS[qIndex];

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === currentQ.ans) {
      setScore((s) => s + 100);
      buyCoins(50);
    }
  };

  const nextQuestion = () => {
    setSelectedOpt(null);
    setTimeLeft(15);
    setQIndex((prev) => (prev + 1) % TRIVIA_QUESTIONS.length);
  };

  return (
    <div className="bg-[#13092b] border border-pink-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl text-white h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-3 sm:p-4 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black shadow-md">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white flex items-center space-x-1">
              <span>LIVE SPEED TRIVIA</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </h2>
            <p className="text-[10px] text-pink-300 flex items-center space-x-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Score: {score}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-red-600/80 text-white transition-all"
              title="Close Game"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 flex flex-col">
        <div className="flex-1 flex flex-col justify-center space-y-3 min-h-[220px]">
          <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/20 text-sm font-semibold text-white text-center">
            {currentQ.q}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {currentQ.options.map((opt, idx) => {
              let optStyle = 'bg-white/5 border-white/10 hover:border-pink-500/50';
              if (selectedOpt !== null) {
                if (idx === currentQ.ans) optStyle = 'bg-emerald-900/60 border-emerald-500 text-emerald-200';
                else if (idx === selectedOpt) optStyle = 'bg-red-900/60 border-red-500 text-red-200';
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(idx)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${optStyle}`}
                >
                  <span>{opt}</span>
                  {selectedOpt !== null && idx === currentQ.ans && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {selectedOpt !== null && idx === selectedOpt && idx !== currentQ.ans && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedOpt !== null && (
          <button
            onClick={nextQuestion}
            className="shrink-0 w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md mt-2"
          >
            Next Question ➡️
          </button>
        )}
      </div>
    </div>
  );
};