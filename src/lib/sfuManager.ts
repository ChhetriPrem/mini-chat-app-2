import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  ConnectionState,
} from 'livekit-client';

export interface PeerMediaStream {
  userId: string;
  seatNumber: number;
  stream: MediaStream;
  isVideoOn: boolean;
  isMicOn: boolean;
}

type StreamCallback = (streams: Map<string, PeerMediaStream>, localStream: MediaStream | null) => void;

/**
 * SFU media manager backed by LiveKit.
 *
 * Every participant in a room — publishers and pure viewers alike — holds a
 * single connection to the LiveKit SFU. The SFU fans tracks out to whoever
 * subscribes; nobody opens a connection to anybody else directly. This is
 * what makes it scale: a room with 1 publisher and 50,000 viewers is 50,001
 * connections to the SFU, not 50,000 connections to the publisher.
 *
 * There is deliberately no manual RTCPeerConnection / offer-answer code here
 * anymore — LiveKit's client SDK owns all of that internally.
 */
class SFUMediaManager {
  private room: Room | null = null;
  private currentUserId: string = '';
  private currentRoomId: string | null = null;
  private currentRole: 'publisher' | 'subscriber' | null = null;
  private connectingPromise: Promise<void> | null = null;
  private seatNumberByUserId: Map<string, number> = new Map();
  private remoteStreams: Map<string, PeerMediaStream> = new Map();
  private listeners: Set<StreamCallback> = new Set();

  // ---- fetch a helper for later; not used for signaling anymore, kept so
  // SocketContext's existing initSocket(...) call doesn't need to change. ----
  public initSocket(_sendFn: (msg: any) => void, userId: string) {
    this.currentUserId = userId;
  }

  public subscribeStreams(callback: StreamCallback) {
    this.listeners.add(callback);
    callback(new Map(this.remoteStreams), this.getLocalMediaStream());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const copy = new Map(this.remoteStreams);
    this.listeners.forEach((cb) => cb(copy, this.getLocalMediaStream()));
  }

  /**
   * Builds a MediaStream from whatever the local participant currently has
   * published, for local self-preview. We don't call getUserMedia ourselves —
   * LiveKit's setCameraEnabled/setMicrophoneEnabled already acquired the
   * device tracks, so we just read them back out.
   */
  public getLocalMediaStream(): MediaStream | null {
    if (!this.room) return null;
    const tracks: MediaStreamTrack[] = [];
    this.room.localParticipant.videoTrackPublications.forEach((pub) => {
      if (pub.track?.mediaStreamTrack) tracks.push(pub.track.mediaStreamTrack);
    });
    this.room.localParticipant.audioTrackPublications.forEach((pub) => {
      if (pub.track?.mediaStreamTrack) tracks.push(pub.track.mediaStreamTrack);
    });
    if (tracks.length === 0) return null;
    return new MediaStream(tracks);
  }

  /**
   * Fetch a LiveKit token from our own server and connect to the room.
   * Called once when a user opens a live room — whether they're going to
   * publish or just watch. Viewers connect too: they just don't publish.
   *
   * role: 'subscriber' for plain viewers, 'publisher' when the user is
   * (about to be) a host or seated guest. The server re-validates this
   * against real room state before granting publish rights either way.
   */
  public async joinRoom(roomId: string, userName: string, role: 'publisher' | 'subscriber' = 'subscriber'): Promise<void> {
    // Callers routinely fire joinRoom twice back-to-back on mount: once as
    // 'subscriber' when the room view opens, and — for a host who
    // auto-takes a seat, or a guest whose seat request resolves fast — a
    // near-simultaneous 'publisher' call right after, before the first
    // call's fetch/connect has resolved. Without serializing, both calls
    // see this.room as still null and BOTH open a real LiveKit connection;
    // whichever room.connect() resolves last silently wins and overwrites
    // this.room, so the outcome (publisher vs subscriber) becomes a
    // network-timing coin flip. Queue calls behind any in-flight one so
    // each joinRoom sees accurate, settled state before deciding whether
    // to reconnect.
    if (this.connectingPromise) {
      await this.connectingPromise.catch(() => {});
    }

    const runner = this._joinRoomInternal(roomId, userName, role);
    const tracked: Promise<void> = runner.finally(() => {
      if (this.connectingPromise === tracked) this.connectingPromise = null;
    });
    this.connectingPromise = tracked;
    return runner;
  }

  private async _joinRoomInternal(roomId: string, userName: string, role: 'publisher' | 'subscriber'): Promise<void> {
    // Only skip reconnecting if we're already connected to this room AND
    // already hold a role sufficient for what's being requested. A
    // subscriber connection is NOT sufficient when 'publisher' is being
    // requested — that requires a fresh token with canPublish: true, which
    // means an actual reconnect. Without this role check, upgrading a
    // viewer to a stage seat silently no-ops here and their mic/camera
    // never actually get publish rights (they can hear others, but no one
    // can hear/see them).
    const alreadySufficient =
      this.currentRole === 'publisher' || this.currentRole === role;

    if (this.room && this.currentRoomId === roomId && alreadySufficient) return;

    if (this.room) {
      await this.leaveRoom();
    }

    const tokenRes = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userId: this.currentUserId, userName, role }),
    });

    if (!tokenRes.ok) {
      console.error('Failed to fetch LiveKit token:', await tokenRes.text());
      return;
    }

    const { token, url } = await tokenRes.json();
    if (!url) {
      console.error('LiveKit URL missing — check LIVEKIT_URL on the server.');
      return;
    }

    const room = new Room({
      adaptiveStream: true, // subscribers auto-downgrade resolution for tiles they can't see well anyway
      dynacast: true,       // publisher stops sending simulcast layers nobody is subscribed to
    });

    this.attachRoomListeners(room);

    await room.connect(url, token);
    this.room = room;
    this.currentRoomId = roomId;
    this.currentRole = role;
  }

  private attachRoomListeners(room: Room) {
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
      this.upsertRemoteTrack(participant.identity, track);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
      const entry = this.remoteStreams.get(participant.identity);
      if (entry) {
        entry.stream.removeTrack(track.mediaStreamTrack);
        if (track.kind === Track.Kind.Video) entry.isVideoOn = false;
        if (track.kind === Track.Kind.Audio) entry.isMicOn = false;
        this.notifyListeners();
      }
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      this.remoteStreams.delete(participant.identity);
      this.seatNumberByUserId.delete(participant.identity);
      this.notifyListeners();
    });

    room.on(RoomEvent.LocalTrackPublished, () => this.notifyListeners());
    room.on(RoomEvent.LocalTrackUnpublished, () => this.notifyListeners());

    room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      if (state === ConnectionState.Disconnected) {
        this.remoteStreams.clear();
        this.notifyListeners();
      }
    });
  }

  private upsertRemoteTrack(userId: string, track: RemoteTrack) {
    const existing = this.remoteStreams.get(userId);
    const stream = existing?.stream ?? new MediaStream();

    if (!stream.getTracks().includes(track.mediaStreamTrack)) {
      stream.addTrack(track.mediaStreamTrack);
    }

    this.remoteStreams.set(userId, {
      userId,
      seatNumber: this.seatNumberByUserId.get(userId) ?? existing?.seatNumber ?? 0,
      stream,
      isVideoOn: stream.getVideoTracks().length > 0,
      isMicOn: stream.getAudioTracks().length > 0,
    });

    this.notifyListeners();
  }

  /**
   * Keeps the userId -> seatNumber mapping current whenever the seat list
   * changes (used only for display purposes, e.g. which tile a stream goes
   * in). LiveKit itself doesn't need this — it already knows who's
   * publishing what, this is purely for the UI layout.
   */
  public syncStageGuests(guests: Array<{ user: { id: string }; seatNumber: number }>) {
    this.seatNumberByUserId.clear();
    guests.forEach((g) => {
      if (g.user?.id) this.seatNumberByUserId.set(g.user.id, g.seatNumber);
      const entry = this.remoteStreams.get(g.user.id);
      if (entry) entry.seatNumber = g.seatNumber;
    });
  }

  /**
   * Called when a user takes a stage seat: reconnect with a token that
   * grants publish rights, then turn camera/mic on. LiveKit doesn't allow
   * upgrading grants on an existing connection, so we do a fast reconnect —
   * this is a deliberate, cheap tradeoff (a few hundred ms) in exchange for
   * the server being the sole source of truth on who can publish.
   */
  public async publishSeatMedia(seatNumber: number, slotType: 'video' | 'audio' = 'video'): Promise<MediaStream | null> {
    if (!this.currentRoomId) return null;

    await this.joinRoom(this.currentRoomId, this.currentUserId, 'publisher');
    if (!this.room) return null;

    this.seatNumberByUserId.set(this.currentUserId, seatNumber);

    // getUserMedia/setMicrophoneEnabled(true) is called here after several
    // awaits (fetching a token, connecting to the SFU). In several browsers
    // — notably Safari/iOS and some in-app webviews — a getUserMedia call
    // that happens this far removed from the original click that triggered
    // it (e.g. auto-taking a seat inside a useEffect on mount) is silently
    // denied with no prompt shown at all, rather than throwing an error a
    // user could react to. That's why toggling mute/unmute afterwards
    // "fixes" it: that toggle is a *direct* click handler, so the browser
    // treats it as a fresh, valid user gesture and the permission prompt
    // actually appears. We surface the failure here instead of only
    // logging it, so callers can show a "tap to enable" retry affordance
    // that is itself a real user gesture.
    try {
      await this.room.localParticipant.setMicrophoneEnabled(true);
      if (slotType === 'video') {
        await this.room.localParticipant.setCameraEnabled(true);
      }
      this.lastPublishError = null;
    } catch (err) {
      console.warn('Failed to publish local media (camera/mic permission?):', err);
      this.lastPublishError = { seatNumber, slotType };
    }

    return this.getLocalMediaStream();
  }

  private lastPublishError: { seatNumber: number; slotType: 'video' | 'audio' } | null = null;

  public hasPendingMediaPermission(): boolean {
    return this.lastPublishError !== null;
  }

  /**
   * Re-requests mic/camera access for the seat we already hold. Meant to be
   * called directly from a click handler (a real user gesture) so the
   * browser's permission prompt reliably appears, even if the original
   * automatic publish attempt was silently denied.
   */
  public async retryPublishMedia(): Promise<MediaStream | null> {
    if (!this.room || !this.lastPublishError) return this.getLocalMediaStream();
    const { seatNumber, slotType } = this.lastPublishError;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(true);
      if (slotType === 'video') {
        await this.room.localParticipant.setCameraEnabled(true);
      }
      this.lastPublishError = null;
      this.seatNumberByUserId.set(this.currentUserId, seatNumber);
    } catch (err) {
      console.warn('Retry publish local media failed:', err);
    }
    return this.getLocalMediaStream();
  }

  /**
   * Called when a user leaves a stage seat: stop publishing but stay
   * connected to the room as a subscriber so they keep watching everyone
   * else without a reconnect.
   */
  public async unpublishSeatMedia(): Promise<void> {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setCameraEnabled(false);
      await this.room.localParticipant.setMicrophoneEnabled(false);
    } catch (err) {
      console.warn('Failed to unpublish local media:', err);
    }
    this.notifyListeners();
  }

  public async setMicEnabled(enabled: boolean) {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
    } catch (err) {
      console.warn('setMicEnabled error:', err);
    }
  }

  public async setVideoEnabled(enabled: boolean) {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setCameraEnabled(enabled);
    } catch (err) {
      console.warn('setVideoEnabled error:', err);
    }
  }

  public async leaveRoom(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
    this.currentRoomId = null;
    this.currentRole = null;
    this.remoteStreams.clear();
    this.seatNumberByUserId.clear();
    this.notifyListeners();
  }
}

export const sfuManager = new SFUMediaManager();
