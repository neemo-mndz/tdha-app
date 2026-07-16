export interface CurrentBookDisplay {
  id: string;
  title: string;
  author: string | null;
  progress: string | null;
  startedAt: string;
}

export interface QueuedBookDisplay {
  id: string;
  title: string;
  author: string | null;
  createdAt: string;
}

export interface FinishedBookDisplay {
  id: string;
  title: string;
  author: string | null;
  rating: number | null;
  review: string | null;
  finishedAt: string;
}

export interface BookNoteDisplay {
  id: string;
  content: string;
  createdAt: string;
}
