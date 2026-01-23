import type { Tawk } from '@/src/features/tawk/types/tawk';
import { Author } from '@/src/features/tawk/types/author';

export const dummyTawk: Tawk = {
  id: 'tawk_001',
  title: 'First sip of coffee thoughts ☕️',
  description:
    'I tried the ‘do nothing for 60 seconds’ thing before opening my phone. It’s uncomfortable… but kinda works.',
  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  createdAt: '2026-01-23',
  duration: 42,
  likesCount: 12,
  repliesCount: 3,
  commentsCount: 5,
  includeSignature: true,
  isMerged: false,
  projectId: null as any, // remove if your type doesn't include it
  roomId: null as any, // remove if your type doesn't include it
  allowReplies: true,

  author: {
    id: 'user_001',
    displayName: 'Maja N.',
    username: 'maja',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    signatureUrl:
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  } as any, // remove "as any" if your Author type matches exactly
};

export const feedData: Tawk[] = [
  dummyTawk,
  {
    id: 'tawk_002',
    title: 'A tiny win from today',
    description:
      'Shipped the bottom nav + splash flow without a white flash. Small victories count.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    createdAt: '2026-01-23',
    duration: 110,
    likesCount: 41,
    repliesCount: 6,
    commentsCount: 9,
    includeSignature: true,
    allowReplies: true,
    author: {
      id: 'user_002',
      displayName: 'Jonas',
      username: 'jonasdev',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      signatureUrl:
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
  },
  {
    id: 'tawk_003',
    title: 'Hot take: reducers are underrated',
    description:
      'They’re not “more code”, they’re a map of how your app changes. Especially with audio events.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    createdAt: '2026-01-22',
    duration: 55,
    likesCount: 7,
    repliesCount: 1,
    commentsCount: 0,
    includeSignature: false,
    allowReplies: true,
    author: {
      id: 'user_003',
      displayName: 'Aisha',
      username: 'aisha',
      avatarUrl: null,
      signatureUrl: null,
    },
  },
];
