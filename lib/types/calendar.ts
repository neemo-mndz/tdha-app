export type MoodValue = 'great' | 'good' | 'neutral' | 'bad' | 'awful';

export interface DayStatus {
  date: Date;
  logCount: number;
  mood: MoodValue | null;
}
