import { Author } from '@/src/features/tawk/types/author';

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
};
