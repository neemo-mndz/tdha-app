export interface WeekReportData {
  userName: string | null;
  dateRange: { start: string; end: string };
  days: ReportDay[];
}

export interface ReportDay {
  date: string;
  logs: ReportLog[];
  taskProgress: ReportTask[];
  readingActivity: ReportReading | null;
}

export interface ReportLog {
  content: string;
  createdAt: string; // ISO timestamp
}

export interface ReportTask {
  name: string;
  goal: number;
  done: number;
}

export interface ReportReading {
  bookTitle: string;
  date: string;
}
