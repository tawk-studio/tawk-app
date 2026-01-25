import { Tawk } from '@/src/features/tawk/types/tawk';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

type SourceContextType = 'feed' | 'room' | 'group' | 'project';

type SourceContext = {
  type: SourceContextType;
  id?: string; // roomId or groupId
};

type AudioPlayerContextValue = {
  currentTawk: Tawk | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  playQueue: Tawk[];
  currentQueueIndex: number;
  heardTawks: Set<string>;
  sourceContext: SourceContext;
  includeReplies: boolean;
  setIncludeReplies: (value: boolean) => void;
  includeAutoplay: boolean;
  setIncludeAutoplay: (value: boolean) => void;
  setSourceList: (
    list: Tawk[],
    contextType: SourceContextType,
    contextId?: string,
  ) => void;
  playTawk: (tawk: Tawk, index?: number) => Promise<void>;
  playSpecificReply: (reply: Tawk) => void;
  togglePlayPause: () => void;
  skip: () => void;
  seek: (percent: number) => void;
  close: () => void;
  playQueueItem: (index: number) => void;
  removeFromQueue: (index: number) => void;
  refreshHeard: () => Promise<void>;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

type State = {
  currentTawk: Tawk | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  playQueue: Tawk[];
  currentQueueIndex: number;
  heardTawks: Set<string>;
  feedTawks: Tawk[];
  feedIndex: number;
  sourceContext: SourceContext;
  includeReplies: boolean;
  includeAutoplay: boolean;
};

type Action =
  | { type: 'SET_INCLUDE_REPLIES'; value: boolean }
  | { type: 'SET_INCLUDE_AUTOPLAY'; value: boolean }
  | {
      type: 'SET_SOURCE_LIST';
      list: Tawk[];
      contextType: SourceContextType;
      contextId?: string;
    }
  | { type: 'SET_FEED_INDEX'; index: number }
  | { type: 'SET_HEARD_TAWKS'; heard: Set<string> }
  | {
      type: 'SET_QUEUE_AND_CURRENT';
      queue: Tawk[];
      index: number;
      current: Tawk | null;
      isPlaying?: boolean;
      progress?: number;
      currentTime?: number;
    }
  | {
      type: 'SET_CURRENT';
      current: Tawk | null;
      isPlaying?: boolean;
      progress?: number;
      currentTime?: number;
    }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_PROGRESS_TIME'; progress: number; currentTime: number }
  | { type: 'RESET_PLAYBACK_UI' }
  | { type: 'CLEAR_QUEUE' };

const initialState: State = {
  currentTawk: null,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  playQueue: [],
  currentQueueIndex: 0,
  heardTawks: new Set(),
  feedTawks: [],
  feedIndex: 0,
  sourceContext: { type: 'feed' },
  includeReplies: true,
  includeAutoplay: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_INCLUDE_REPLIES':
      return { ...state, includeReplies: action.value };
    case 'SET_INCLUDE_AUTOPLAY':
      return { ...state, includeAutoplay: action.value };
    case 'SET_SOURCE_LIST':
      return {
        ...state,
        feedTawks: action.list,
        sourceContext: { type: action.contextType, id: action.contextId },
      };
    case 'SET_FEED_INDEX':
      return { ...state, feedIndex: action.index };
    case 'SET_HEARD_TAWKS':
      return { ...state, heardTawks: action.heard };
    case 'SET_QUEUE_AND_CURRENT':
      return {
        ...state,
        playQueue: action.queue,
        currentQueueIndex: action.index,
        currentTawk: action.current,
        isPlaying: action.isPlaying ?? state.isPlaying,
        progress: action.progress ?? state.progress,
        currentTime: action.currentTime ?? state.currentTime,
      };
    case 'SET_CURRENT':
      return {
        ...state,
        currentTawk: action.current,
        isPlaying: action.isPlaying ?? state.isPlaying,
        progress: action.progress ?? state.progress,
        currentTime: action.currentTime ?? state.currentTime,
      };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };
    case 'SET_PROGRESS_TIME':
      return {
        ...state,
        progress: action.progress,
        currentTime: action.currentTime,
      };
    case 'RESET_PLAYBACK_UI':
      return { ...state, isPlaying: false, progress: 0, currentTime: 0 };
    case 'CLEAR_QUEUE':
      return {
        ...state,
        playQueue: [],
        currentQueueIndex: 0,
        currentTawk: null,
      };
    default:
      return state;
  }
}

export function AudioPlayerProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Keep latest state for callbacks that run outside React render
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // expo-audio players
  const mainPlayerRef = useRef<AudioPlayer | null>(null);
  const jinglePlayerRef = useRef<AudioPlayer | null>(null);

  // Optional: if you later have tawks with video sources, you can wire this up.
  const videoPlayerRef = useRef<VideoPlayer | null>(null);

  // Track latest native status for logic that needs duration/currentTime.
  const mainStatusRef = useRef<AudioStatus | null>(null);
  const jingleStatusRef = useRef<AudioStatus | null>(null);

  // Listener subscriptions so we can cleanly detach.
  const mainStatusSubRef = useRef<{ remove: () => void } | null>(null);
  const jingleStatusSubRef = useRef<{ remove: () => void } | null>(null);

  // Prevent re-entrant finish handling.
  const finishingRef = useRef(false);

  const lastJingledParentIdRef = useRef<string | null>(null);
  const pendingParentRef = useRef<{ tawk: Tawk; queue: Tawk[] } | null>(null);
  const jinglePlayingRef = useRef(false);

  // Session tracking
  const sessionActiveRef = useRef(false);
  const playedParentsRef = useRef<Set<string>>(new Set());

  // Prevent async races (rapid taps)
  const playTokenRef = useRef(0);

  // Configure audio mode once (safe defaults for iOS/Android)
  useEffect(() => {
    // expo-audio audio mode
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }, []);

  const detachListener = useCallback(
    (subRef: React.MutableRefObject<{ remove: () => void } | null>) => {
      try {
        subRef.current?.remove();
      } catch {}
      subRef.current = null;
    },
    [],
  );

  const releasePlayer = useCallback(
    (
      playerRef: React.MutableRefObject<AudioPlayer | null>,
      subRef: React.MutableRefObject<{ remove: () => void } | null>,
    ) => {
      detachListener(subRef);
      const p = playerRef.current;
      if (!p) return;
      try {
        // Pause + reset is a safe best-effort “stop” across platforms
        p.pause();
      } catch {}
      try {
        p.seekTo(0);
      } catch {}
      try {
        // expo-audio requires manual release when using createAudioPlayer
        p.release();
      } catch {}
      playerRef.current = null;
    },
    [detachListener],
  );

  const createPlayer = useCallback(
    (
      playerRef: React.MutableRefObject<AudioPlayer | null>,
      subRef: React.MutableRefObject<{ remove: () => void } | null>,
      statusRef: React.MutableRefObject<AudioStatus | null>,
      source: string | null,
      onStatus?: (status: AudioStatus) => void,
    ) => {
      // Dispose any prior instance
      releasePlayer(playerRef, subRef);
      if (!source) return null;

      const player = createAudioPlayer(source, {
        // Keep UI responsive without being too chatty.
        updateInterval: 250,
      });
      playerRef.current = player;

      // Attach a status listener
      try {
        const sub = player.addListener(
          'playbackStatusUpdate',
          (status: AudioStatus) => {
            statusRef.current = status;
            onStatus?.(status);
          },
        );
        subRef.current = sub as any;
      } catch {
        // If listener setup fails, we still keep the player.
      }

      return player;
    },
    [releasePlayer],
  );

  const stopPlayer = useCallback(
    (playerRef: React.MutableRefObject<AudioPlayer | null>) => {
      const p = playerRef.current;
      if (!p) return;
      try {
        p.pause();
      } catch {}
    },
    [],
  );

  // Stops sounds + bookkeeping (no UI state)
  const stopAudioElementsOnly = useCallback(
    async (reason: string) => {
      console.log(`stopAudioElementsOnly called: ${reason}`);
      pendingParentRef.current = null;
      jinglePlayingRef.current = false;

      // Best-effort: pause players
      stopPlayer(jinglePlayerRef);
      stopPlayer(mainPlayerRef);
    },
    [stopPlayer],
  );

  const stopAllAudio = useCallback(
    async (reason: string) => {
      console.log(`stopAllAudio called: ${reason}`);
      await stopAudioElementsOnly(reason);
      dispatch({ type: 'RESET_PLAYBACK_UI' });
    },
    [stopAudioElementsOnly],
  );

  const resetSession = useCallback((reason: string) => {
    console.log(`resetSession called: ${reason}`);
    sessionActiveRef.current = false;
    playedParentsRef.current.clear();
  }, []);

  const resolveIntroSignatureUrl = useCallback((tawk: Tawk): string | null => {
    if (tawk.replyTo) return tawk.author?.signatureUrl || null;
    if (tawk.roomId && tawk.room?.signatureUrl) return tawk.room.signatureUrl;
    return tawk.author?.signatureUrl || null;
  }, []);

  const playIntroSignatureIfNeeded = useCallback(
    async (tawk: Tawk, token: number) => {
      if (tawk.includeSignature === false) return;
      if (lastJingledParentIdRef.current === tawk.id) return;

      const signatureUrl = resolveIntroSignatureUrl(tawk);
      if (!signatureUrl) return;

      // If a newer play request happened, abort
      if (playTokenRef.current !== token) return;

      lastJingledParentIdRef.current = tawk.id;
      jinglePlayingRef.current = true;

      await new Promise<void>((resolve) => {
        // Create a fresh jingle player each time to avoid source swapping edge cases.
        const player = createPlayer(
          jinglePlayerRef,
          jingleStatusSubRef,
          jingleStatusRef,
          signatureUrl,
          (status) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) {
              jinglePlayingRef.current = false;
              resolve();
            }
          },
        );

        if (!player) {
          jinglePlayingRef.current = false;
          resolve();
          return;
        }

        try {
          player.seekTo(0);
        } catch {}
        try {
          player.play();
        } catch {
          jinglePlayingRef.current = false;
          resolve();
          return;
        }

        // If interrupted or something goes wrong, resolve quickly.
        const timeout = setTimeout(() => {
          jinglePlayingRef.current = false;
          resolve();
        }, 10000);

        const originalResolve = resolve;
        resolve = () => {
          clearTimeout(timeout);
          originalResolve();
        };
      });
    },
    [createPlayer, resolveIntroSignatureUrl],
  );

  const startMainPlayback = useCallback(
    async (tawk: Tawk, queue: Tawk[], token: number) => {
      // Stop jingle before starting
      stopPlayer(jinglePlayerRef);
      jinglePlayingRef.current = false;

      // Abort if a newer play request occurred
      if (playTokenRef.current !== token) return;

      dispatch({
        type: 'SET_QUEUE_AND_CURRENT',
        queue,
        index: 0,
        current: tawk,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });

      const player = createPlayer(
        mainPlayerRef,
        mainStatusSubRef,
        mainStatusRef,
        tawk.audioUrl,
        (status) => {
          if (!status.isLoaded) return;

          // Progress updates
          if (status.duration > 0) {
            dispatch({
              type: 'SET_PROGRESS_TIME',
              progress: (status.currentTime / status.duration) * 100,
              currentTime: status.currentTime,
            });
          }

          // Finish handling is done in the global finish handler below.
        },
      );

      if (!player) {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
        return;
      }

      try {
        player.seekTo(0);
      } catch {}

      try {
        player.play();
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    },
    [createPlayer, stopPlayer],
  );

  // Main playback status handler (finish/queue progression)
  useEffect(() => {
    // We only attach listeners when a player is created (in createPlayer).
    // Here we just ensure that when the main player reports didJustFinish,
    // we advance the queue/feed.

    const tryHandleFinish = async () => {
      const status = mainStatusRef.current;
      if (!status || !status.isLoaded) return;
      if (!status.didJustFinish) return;
      if (finishingRef.current) return;

      finishingRef.current = true;
      try {
        const s = stateRef.current;
        const playQueue = s.playQueue;
        const currentQueueIndex = s.currentQueueIndex;

        const nextIndex = currentQueueIndex + 1;
        if (nextIndex < playQueue.length) {
          const nextTawk = playQueue[nextIndex];

          const token = playTokenRef.current;
          await playIntroSignatureIfNeeded(nextTawk, token);
          if (playTokenRef.current !== token) return;

          dispatch({
            type: 'SET_QUEUE_AND_CURRENT',
            queue: playQueue,
            index: nextIndex,
            current: nextTawk,
            isPlaying: true,
            progress: 0,
            currentTime: 0,
          });

          const player = createPlayer(
            mainPlayerRef,
            mainStatusSubRef,
            mainStatusRef,
            nextTawk.audioUrl,
            (st) => {
              if (!st.isLoaded) return;
              if (st.duration > 0) {
                dispatch({
                  type: 'SET_PROGRESS_TIME',
                  progress: (st.currentTime / st.duration) * 100,
                  currentTime: st.currentTime,
                });
              }
            },
          );

          if (!player) {
            dispatch({ type: 'SET_PLAYING', isPlaying: false });
            return;
          }

          try {
            player.seekTo(0);
          } catch {}
          try {
            player.play();
          } catch {
            dispatch({ type: 'SET_PLAYING', isPlaying: false });
          }
          return;
        }

        if (!s.includeAutoplay) {
          resetSession('ended: autoplay off');
          dispatch({ type: 'RESET_PLAYBACK_UI' });
          return;
        }

        const feedTawks = s.feedTawks;
        const nextFeedIndex = s.feedIndex + 1;

        if (nextFeedIndex >= feedTawks.length) {
          resetSession('ended: end of feed');
          dispatch({ type: 'RESET_PLAYBACK_UI' });
          dispatch({ type: 'CLEAR_QUEUE' });
          return;
        }

        let candidateIndex = nextFeedIndex;
        let nextParent = feedTawks[candidateIndex];

        if (playedParentsRef.current.has(nextParent.id)) {
          let found = -1;
          for (let i = nextFeedIndex + 1; i < feedTawks.length; i++) {
            if (!playedParentsRef.current.has(feedTawks[i].id)) {
              found = i;
              break;
            }
          }
          if (found === -1) {
            resetSession('ended: no more unplayed parents');
            dispatch({ type: 'RESET_PLAYBACK_UI' });
            dispatch({ type: 'CLEAR_QUEUE' });
            return;
          }
          candidateIndex = found;
          nextParent = feedTawks[candidateIndex];
        }

        dispatch({ type: 'SET_FEED_INDEX', index: candidateIndex });
        playedParentsRef.current.add(nextParent.id);

        const token = playTokenRef.current;
        const isMergedProjectOutput =
          nextParent.isMerged && nextParent.projectId;
        if (!isMergedProjectOutput) {
          await playIntroSignatureIfNeeded(nextParent, token);
        }
        if (pendingParentRef.current) return;
        if (playTokenRef.current !== token) return;

        const queue = [nextParent];
        await startMainPlayback(nextParent, queue, token);
      } finally {
        finishingRef.current = false;
      }
    };

    // Polling is only needed because the status event is wired through createPlayer.
    // This keeps the provider logic centralized and avoids attaching multiple finish listeners.
    const interval = setInterval(() => {
      tryHandleFinish().catch(() => {});
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [
    createPlayer,
    playIntroSignatureIfNeeded,
    resetSession,
    startMainPlayback,
  ]);

  // Clean up players on unmount
  useEffect(() => {
    return () => {
      releasePlayer(mainPlayerRef, mainStatusSubRef);
      releasePlayer(jinglePlayerRef, jingleStatusSubRef);
      try {
        videoPlayerRef.current?.release?.();
      } catch {}
      videoPlayerRef.current = null;
    };
  }, [releasePlayer]);

  const fetchHeardTawks = useCallback(async () => {
    // wire backend later
  }, []);

  const setIncludeReplies = useCallback((value: boolean) => {
    dispatch({ type: 'SET_INCLUDE_REPLIES', value });
  }, []);

  const setIncludeAutoplay = useCallback((value: boolean) => {
    dispatch({ type: 'SET_INCLUDE_AUTOPLAY', value });
  }, []);

  const setSourceList = useCallback(
    (list: Tawk[], contextType: SourceContextType, contextId?: string) => {
      dispatch({ type: 'SET_SOURCE_LIST', list, contextType, contextId });
    },
    [],
  );

  const playTawk = useCallback(
    async (tawk: Tawk, index?: number) => {
      const token = ++playTokenRef.current;
      const s = stateRef.current;

      // If tapping the same tawk, toggle
      if (s.currentTawk?.id === tawk.id) {
        const main = mainPlayerRef.current;

        if (s.isPlaying) {
          try {
            main?.pause();
          } catch {}

          if (jinglePlayingRef.current) {
            stopPlayer(jinglePlayerRef);
            jinglePlayingRef.current = false;
            pendingParentRef.current = { tawk, queue: s.playQueue };
          }

          dispatch({ type: 'SET_PLAYING', isPlaying: false });
        } else {
          if (pendingParentRef.current) {
            const { tawk: pendingTawk, queue } = pendingParentRef.current;
            pendingParentRef.current = null;
            await startMainPlayback(pendingTawk, queue, token);
          } else {
            try {
              main?.play();
              dispatch({ type: 'SET_PLAYING', isPlaying: true });
            } catch {
              dispatch({ type: 'SET_PLAYING', isPlaying: false });
            }
          }
        }
        return;
      }

      await stopAudioElementsOnly('playTawk: start new parent');

      sessionActiveRef.current = true;
      playedParentsRef.current.clear();
      playedParentsRef.current.add(tawk.id);

      const feedTawks = s.feedTawks;
      if (index !== undefined) {
        dispatch({ type: 'SET_FEED_INDEX', index });
      } else {
        const idx = feedTawks.findIndex((t) => t.id === tawk.id);
        if (idx >= 0) dispatch({ type: 'SET_FEED_INDEX', index: idx });
      }

      dispatch({
        type: 'SET_CURRENT',
        current: tawk,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });

      const isMergedProjectOutput = tawk.isMerged && tawk.projectId;
      if (!isMergedProjectOutput) {
        await playIntroSignatureIfNeeded(tawk, token);
      }

      if (pendingParentRef.current) return;
      if (playTokenRef.current !== token) return;

      const queue = [tawk];
      await startMainPlayback(tawk, queue, token);
    },
    [
      playIntroSignatureIfNeeded,
      startMainPlayback,
      stopAudioElementsOnly,
      stopPlayer,
    ],
  );

  const playSpecificReply = useCallback(
    async (reply: Tawk) => {
      const token = ++playTokenRef.current;
      await stopAudioElementsOnly('playSpecificReply');

      dispatch({
        type: 'SET_CURRENT',
        current: reply,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });

      await playIntroSignatureIfNeeded(reply, token);
      if (playTokenRef.current !== token) return;

      dispatch({
        type: 'SET_QUEUE_AND_CURRENT',
        queue: [reply],
        index: 0,
        current: reply,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });

      const player = createPlayer(
        mainPlayerRef,
        mainStatusSubRef,
        mainStatusRef,
        reply.audioUrl,
        (status) => {
          if (!status.isLoaded) return;
          if (status.duration > 0) {
            dispatch({
              type: 'SET_PROGRESS_TIME',
              progress: (status.currentTime / status.duration) * 100,
              currentTime: status.currentTime,
            });
          }
        },
      );

      if (!player) {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
        return;
      }

      try {
        player.seekTo(0);
      } catch {}
      try {
        player.play();
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    },
    [createPlayer, playIntroSignatureIfNeeded, stopAudioElementsOnly],
  );

  const togglePlayPause = useCallback(async () => {
    const s = stateRef.current;
    const main = mainPlayerRef.current;

    if (jinglePlayingRef.current) {
      stopPlayer(jinglePlayerRef);
      jinglePlayingRef.current = false;
      if (s.currentTawk) {
        pendingParentRef.current = { tawk: s.currentTawk, queue: s.playQueue };
      }
      dispatch({ type: 'SET_PLAYING', isPlaying: false });
      return;
    }

    if (!s.isPlaying && pendingParentRef.current) {
      const token = ++playTokenRef.current;
      const { tawk, queue } = pendingParentRef.current;
      pendingParentRef.current = null;
      await startMainPlayback(tawk, queue, token);
      return;
    }

    if (s.isPlaying) {
      try {
        main?.pause();
      } catch {}
      dispatch({ type: 'SET_PLAYING', isPlaying: false });
    } else {
      try {
        // If we finished previously, ensure we’re not stuck at the end.
        const st = mainStatusRef.current;
        if (st?.isLoaded && st.duration > 0 && st.currentTime >= st.duration) {
          try {
            main?.seekTo(0);
          } catch {}
        }
        main?.play();
        dispatch({ type: 'SET_PLAYING', isPlaying: true });
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    }
  }, [startMainPlayback, stopPlayer]);

  const skip = useCallback(async () => {
    const s = stateRef.current;

    await stopAllAudio('skip');

    if (
      s.playQueue.length > 0 &&
      s.currentQueueIndex < s.playQueue.length - 1
    ) {
      const nextIndex = s.currentQueueIndex + 1;
      const nextTawk = s.playQueue[nextIndex];

      dispatch({
        type: 'SET_QUEUE_AND_CURRENT',
        queue: s.playQueue,
        index: nextIndex,
        current: nextTawk,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });

      const player = createPlayer(
        mainPlayerRef,
        mainStatusSubRef,
        mainStatusRef,
        nextTawk.audioUrl,
        (status) => {
          if (!status.isLoaded) return;
          if (status.duration > 0) {
            dispatch({
              type: 'SET_PROGRESS_TIME',
              progress: (status.currentTime / status.duration) * 100,
              currentTime: status.currentTime,
            });
          }
        },
      );

      if (!player) {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
        return;
      }

      try {
        player.seekTo(0);
      } catch {}
      try {
        player.play();
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
      return;
    }

    const nextFeedIndex = s.feedIndex + 1;
    if (nextFeedIndex < s.feedTawks.length) {
      dispatch({ type: 'SET_FEED_INDEX', index: nextFeedIndex });
      await playTawk(s.feedTawks[nextFeedIndex], nextFeedIndex);
    }
  }, [createPlayer, playTawk, stopAllAudio]);

  const seek = useCallback(async (percent: number) => {
    const player = mainPlayerRef.current;
    const status = mainStatusRef.current;
    if (!player || !status || !status.isLoaded) return;
    if (!status.duration) return;

    const seconds = Math.max(
      0,
      Math.min(status.duration, (percent / 100) * status.duration),
    );

    try {
      player.seekTo(seconds);
    } catch {
      return;
    }

    dispatch({
      type: 'SET_PROGRESS_TIME',
      progress: percent,
      currentTime: seconds,
    });
  }, []);

  const close = useCallback(() => {
    playTokenRef.current += 1;
    stopAllAudio('close').catch(() => {});
    resetSession('close');
    dispatch({ type: 'CLEAR_QUEUE' });
  }, [resetSession, stopAllAudio]);

  const playQueueItem = useCallback(
    async (index: number) => {
      const s = stateRef.current;
      if (index < 0 || index >= s.playQueue.length) return;

      await stopAllAudio('queue-item-click');

      const tawk = s.playQueue[index];
      dispatch({
        type: 'SET_QUEUE_AND_CURRENT',
        queue: s.playQueue,
        index,
        current: tawk,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      });

      const player = createPlayer(
        mainPlayerRef,
        mainStatusSubRef,
        mainStatusRef,
        tawk.audioUrl,
        (status) => {
          if (!status.isLoaded) return;
          if (status.duration > 0) {
            dispatch({
              type: 'SET_PROGRESS_TIME',
              progress: (status.currentTime / status.duration) * 100,
              currentTime: status.currentTime,
            });
          }
        },
      );

      if (!player) {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
        return;
      }

      try {
        player.seekTo(0);
      } catch {}
      try {
        player.play();
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    },
    [createPlayer, stopAllAudio],
  );

  const removeFromQueue = useCallback((index: number) => {
    const s = stateRef.current;
    if (index < 0 || index >= s.playQueue.length) return;
    if (index === s.currentQueueIndex) return;

    const newQueue = s.playQueue.filter((_, i) => i !== index);
    const newCurrentQueueIndex =
      index < s.currentQueueIndex
        ? s.currentQueueIndex - 1
        : s.currentQueueIndex;

    dispatch({
      type: 'SET_QUEUE_AND_CURRENT',
      queue: newQueue,
      index: Math.max(
        0,
        Math.min(newCurrentQueueIndex, Math.max(newQueue.length - 1, 0)),
      ),
      current: s.currentTawk,
    });
  }, []);

  const value: AudioPlayerContextValue = useMemo(
    () => ({
      currentTawk: state.currentTawk,
      isPlaying: state.isPlaying,
      progress: state.progress,
      currentTime: state.currentTime,
      playQueue: state.playQueue,
      currentQueueIndex: state.currentQueueIndex,
      heardTawks: state.heardTawks,
      sourceContext: state.sourceContext,
      includeReplies: state.includeReplies,
      setIncludeReplies,
      includeAutoplay: state.includeAutoplay,
      setIncludeAutoplay,
      setSourceList,
      playTawk,
      playSpecificReply,
      togglePlayPause,
      skip,
      seek,
      close,
      playQueueItem,
      removeFromQueue,
      refreshHeard: fetchHeardTawks,
    }),
    [
      close,
      fetchHeardTawks,
      playQueueItem,
      playSpecificReply,
      playTawk,
      removeFromQueue,
      seek,
      setIncludeAutoplay,
      setIncludeReplies,
      setSourceList,
      skip,
      state.currentQueueIndex,
      state.currentTime,
      state.currentTawk,
      state.heardTawks,
      state.includeAutoplay,
      state.includeReplies,
      state.isPlaying,
      state.playQueue,
      state.progress,
      state.sourceContext,
      togglePlayPause,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useGlobalAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      'useGlobalAudioPlayer must be used within an AudioPlayerProvider',
    );
  }
  return context;
}
