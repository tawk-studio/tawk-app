import { Author } from '@/src/features/tawk/types/author';
import { Room } from '@/src/features/tawk/types/room';

export type Tawk = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  createdAt: string;
  audioUrl: string;
  likesCount: number;
  repliesCount: number;
  commentsCount?: number;
  allowReplies: boolean;
  author: Author;
  roomId?: string | null;
  groupId?: string | null;
  projectId?: string | null;
  room?: Room | null;
  visibility?: string;
  isMerged?: boolean;
  showHosts?: boolean;
  replyTo?: string | null;
  includeSignature?: boolean;
  playCount?: number;
};
