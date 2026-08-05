import React from 'react';
import { RoomGuest, User } from '../types';
import { Mic, MicOff, Plus, Crown, X } from 'lucide-react';

interface AudioSeatGridProps {
  guests: RoomGuest[];
  host: User;
  currentUser: User;
  isHost: boolean;
  mySeat?: RoomGuest;
  myRequestPending: boolean;
  totalSeats?: number;
  onRequestSlot: (slotType: 'audio') => void;
  onLeaveSeat: (seatNumber: number) => void;
  onToggleMic: (seatNumber: number) => void;
  onHostToggleMute?: (seatNumber: number) => void;
}

/**
 * Clubhouse-style seat grid for audio rooms: a fixed 10-slot layout where
 * every seat is always visible, filled or not. Tapping an empty seat as a
 * regular viewer raises your hand (goes through the existing host-approval
 * queue) rather than seating you directly — the host stays the gatekeeper.
 * Tapping your own filled seat toggles your mic; the host can tap anyone
 * else's filled seat to mute them.
 */
export const AudioSeatGrid: React.FC<AudioSeatGridProps> = ({
  guests,
  host,
  currentUser,
  isHost,
  mySeat,
  myRequestPending,
  totalSeats = 10,
  onRequestSlot,
  onLeaveSeat,
  onToggleMic,
  onHostToggleMute,
}) => {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const guestBySeat = new Map<number, RoomGuest>(guests.map((g) => [g.seatNumber, g]));

  return (
    <div className="w-full max-w-md mx-auto px-2">
      <div className="grid grid-cols-5 gap-x-2 gap-y-4">
        {seats.map((seatNumber) => {
          const occupant = guestBySeat.get(seatNumber);

          if (!occupant) {
            const canRequest = !isHost && !mySeat && !myRequestPending;
            return (
              <button
                key={seatNumber}
                disabled={!canRequest}
                onClick={() => canRequest && onRequestSlot('audio')}
                className={`group flex flex-col items-center space-y-1.5 ${
                  canRequest ? 'active:scale-90' : 'cursor-default'
                }`}
                title={canRequest ? 'Raise hand for this seat' : `Seat ${seatNumber} · Empty`}
              >
                <div
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    canRequest
                      ? 'bg-gradient-to-br from-white/10 to-white/5 border-2 border-dashed border-white/25 shadow-inner group-hover:border-emerald-400/70 group-hover:from-emerald-500/15 group-hover:to-teal-500/10 group-hover:shadow-lg group-hover:shadow-emerald-500/20 group-hover:scale-105'
                      : 'bg-white/5 border-2 border-dashed border-white/10'
                  }`}
                >
                  <Plus className={`w-4 h-4 transition-colors ${canRequest ? 'text-white/40 group-hover:text-emerald-300' : 'text-white/15'}`} />
                </div>
                <span className={`text-[9px] font-bold tracking-wide ${canRequest ? 'text-white/35 group-hover:text-emerald-300/80' : 'text-white/20'}`}>
                  #{seatNumber}
                </span>
              </button>
            );
          }

          const isMe = occupant.user.id === currentUser.id;
          const isOccHost = occupant.user.id === host.id;
          const speaking = occupant.isMicOn && !occupant.isMutedByHost;

          const handleTap = () => {
            if (isMe) {
              onToggleMic(occupant.seatNumber);
            } else if (isHost) {
              onHostToggleMute?.(occupant.seatNumber);
            }
          };

          return (
            <div key={seatNumber} className="relative flex flex-col items-center space-y-1.5">
              <button
                onClick={handleTap}
                disabled={!isMe && !isHost}
                className={`group relative w-12 h-12 rounded-full transition-transform duration-200 ${
                  isMe || isHost ? 'active:scale-90' : 'cursor-default'
                }`}
                title={isMe ? (speaking ? 'Mute yourself' : 'Unmute yourself') : occupant.user.name}
              >
                {/* Speaking glow pulse */}
                {speaking && (
                  <span className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-md animate-pulse" />
                )}

                {/* Gradient ring wrapper */}
                <span
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full p-[2px] transition-all duration-300 ${
                    speaking
                      ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-500 shadow-lg shadow-emerald-500/40'
                      : 'bg-gradient-to-tr from-rose-500/70 to-red-600/50'
                  }`}
                >
                  <img
                    src={occupant.user.avatar}
                    alt={occupant.user.name}
                    className="w-full h-full rounded-full object-cover border-2 border-[#050507]"
                  />
                </span>

                {isOccHost && (
                  <span className="absolute -top-1.5 -left-1.5 bg-gradient-to-br from-amber-300 to-yellow-500 text-black rounded-full p-0.5 shadow-md shadow-amber-500/40 border border-amber-200/60">
                    <Crown className="w-2.5 h-2.5" />
                  </span>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full border border-black/60 shadow-md ${
                    speaking ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {speaking ? (
                    <Mic className="w-2.5 h-2.5 text-white" />
                  ) : (
                    <MicOff className="w-2.5 h-2.5 text-white" />
                  )}
                </span>
              </button>

              {isMe && (
                <button
                  onClick={() => onLeaveSeat(occupant.seatNumber)}
                  className="absolute -top-1 -right-1 bg-black/80 hover:bg-red-600 border border-white/20 rounded-full p-0.5 shadow-md transition-colors"
                  title="Leave seat"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              )}

              <span className={`text-[9px] font-bold truncate max-w-[48px] ${speaking ? 'text-emerald-300/90' : 'text-white/70'}`}>
                {isMe ? 'You' : occupant.user.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
