import { Tawk } from '@/src/features/tawk/types/tawk';
import { Audio, AVPlaybackStatus } from 'expo-av';
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

function isLoaded(
  status: AVPlaybackStatus,
): status is AVPlaybackStatus & { isLoaded: true } {
  // expo-av type guard
  // @ts-ignore
  return Boolean(status && (status as any).isLoaded);
}

export function AudioPlayerProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Keep latest state for callbacks that run outside React render
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // expo-av sounds
  const mainSoundRef = useRef<Audio.Sound | null>(null);
  const jingleSoundRef = useRef<Audio.Sound | null>(null);

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
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const ensureSound = useCallback(
    async (ref: React.MutableRefObject<Audio.Sound | null>) => {
      if (ref.current) return ref.current;
      const sound = new Audio.Sound();
      ref.current = sound;
      return sound;
    },
    [],
  );

  const unloadSound = useCallback(
    async (ref: React.MutableRefObject<Audio.Sound | null>) => {
      const s = ref.current;
      if (!s) return;
      try {
        await s.stopAsync();
      } catch {}
      try {
        await s.unloadAsync();
      } catch {}
      ref.current = null;
    },
    [],
  );

  const stopSound = useCallback(
    async (ref: React.MutableRefObject<Audio.Sound | null>) => {
      const s = ref.current;
      if (!s) return;
      try {
        await s.stopAsync();
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
      await stopSound(jingleSoundRef);
      await stopSound(mainSoundRef);
    },
    [stopSound],
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

      const jingle = await ensureSound(jingleSoundRef);

      // If a newer play request happened, abort
      if (playTokenRef.current !== token) return;

      lastJingledParentIdRef.current = tawk.id;
      jinglePlayingRef.current = true;

      try {
        await jingle.unloadAsync().catch(() => {});
        await jingle.loadAsync(
          { uri: signatureUrl },
          { shouldPlay: true, positionMillis: 0 },
        );
      } catch {
        jinglePlayingRef.current = false;
        return;
      }

      await new Promise<void>((resolve) => {
        const onStatus = (status: AVPlaybackStatus) => {
          if (!isLoaded(status)) return;
          if ((status as any).didJustFinish) {
            jingle.setOnPlaybackStatusUpdate(null);
            jinglePlayingRef.current = false;
            resolve();
          }
        };
        jingle.setOnPlaybackStatusUpdate(onStatus);

        // If interrupted, resolve quickly
        const timeout = setTimeout(() => {
          jingle.setOnPlaybackStatusUpdate(null);
          jinglePlayingRef.current = false;
          resolve();
        }, 10000);

        // Clear timeout when resolved
        const originalResolve = resolve;
        resolve = () => {
          clearTimeout(timeout);
          originalResolve();
        };
      });
    },
    [ensureSound, resolveIntroSignatureUrl],
  );

  const startMainPlayback = useCallback(
    async (tawk: Tawk, queue: Tawk[], token: number) => {
      const main = await ensureSound(mainSoundRef);

      // Stop jingle before starting
      await stopSound(jingleSoundRef);
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

      try {
        await main.unloadAsync().catch(() => {});
        await main.loadAsync(
          { uri: tawk.audioUrl },
          { shouldPlay: true, positionMillis: 0 },
        );
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    },
    [ensureSound, stopSound],
  );

  // Main playback status handler (attached once)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const main = await ensureSound(mainSoundRef);
      if (cancelled) return;

      main.setOnPlaybackStatusUpdate(async (status: any) => {
        if (!isLoaded(status)) return;

        const durationMillis = (status as any).durationMillis ?? 0;
        const positionMillis = (status as any).positionMillis ?? 0;

        if (durationMillis > 0) {
          dispatch({
            type: 'SET_PROGRESS_TIME',
            progress: (positionMillis / durationMillis) * 100,
            currentTime: positionMillis / 1000,
          });
        }

        if ((status as any).didJustFinish) {
          // Equivalent to HTMLAudioElement 'ended'
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

            try {
              await main.unloadAsync().catch(() => {});
              await main.loadAsync(
                { uri: nextTawk.audioUrl },
                { shouldPlay: true, positionMillis: 0 },
              );
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
        }
      });
    })();

    return () => {
      cancelled = true;
      // Keep sounds alive; they are unloaded on provider unmount below.
    };
  }, [
    ensureSound,
    playIntroSignatureIfNeeded,
    resetSession,
    startMainPlayback,
  ]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      unloadSound(mainSoundRef).catch(() => {});
      unloadSound(jingleSoundRef).catch(() => {});
    };
  }, [unloadSound]);

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
        const main = await ensureSound(mainSoundRef);

        if (s.isPlaying) {
          await main.pauseAsync().catch(() => {});

          if (jinglePlayingRef.current) {
            await stopSound(jingleSoundRef);
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
            await main.playAsync().catch(() => {});
            dispatch({ type: 'SET_PLAYING', isPlaying: true });
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
      ensureSound,
      playIntroSignatureIfNeeded,
      startMainPlayback,
      stopAudioElementsOnly,
      stopSound,
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

      const main = await ensureSound(mainSoundRef);
      try {
        await main.unloadAsync().catch(() => {});
        await main.loadAsync(
          { uri: reply.audioUrl },
          { shouldPlay: true, positionMillis: 0 },
        );
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    },
    [ensureSound, playIntroSignatureIfNeeded, stopAudioElementsOnly],
  );

  const togglePlayPause = useCallback(async () => {
    const s = stateRef.current;
    const main = await ensureSound(mainSoundRef);

    if (jinglePlayingRef.current) {
      await stopSound(jingleSoundRef);
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
      await main.pauseAsync().catch(() => {});
      dispatch({ type: 'SET_PLAYING', isPlaying: false });
    } else {
      await main.playAsync().catch(() => {});
      dispatch({ type: 'SET_PLAYING', isPlaying: true });
    }
  }, [ensureSound, startMainPlayback, stopSound]);

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

      const main = await ensureSound(mainSoundRef);
      try {
        await main.unloadAsync().catch(() => {});
        await main.loadAsync(
          { uri: nextTawk.audioUrl },
          { shouldPlay: true, positionMillis: 0 },
        );
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
  }, [ensureSound, playTawk, stopAllAudio]);

  const seek = useCallback(
    async (percent: number) => {
      const main = await ensureSound(mainSoundRef);
      const status = await main.getStatusAsync().catch(() => null);
      if (!status || !isLoaded(status)) return;

      const durationMillis = (status as any).durationMillis ?? 0;
      if (!durationMillis) return;

      const positionMillis = Math.max(
        0,
        Math.min(durationMillis, (percent / 100) * durationMillis),
      );
      await main.setPositionAsync(positionMillis).catch(() => {});

      dispatch({
        type: 'SET_PROGRESS_TIME',
        progress: percent,
        currentTime: positionMillis / 1000,
      });
    },
    [ensureSound],
  );

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

      const main = await ensureSound(mainSoundRef);
      try {
        await main.unloadAsync().catch(() => {});
        await main.loadAsync(
          { uri: tawk.audioUrl },
          { shouldPlay: true, positionMillis: 0 },
        );
      } catch {
        dispatch({ type: 'SET_PLAYING', isPlaying: false });
      }
    },
    [ensureSound, stopAllAudio],
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
