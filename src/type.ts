// VocaloidSong型の定義
export interface VocaloidSong {
  id: number;
  title: string;
  producer: string;
  year: number;
  vocalist: string;
  popularity: number; // 1-10のスケール（人気度）
  youtubeId?: string; // 試聴用（著作権に注意）
  era: 'dawn' | 'firstBoom' | 'golden' | 'mature' | 'modern'; // 時代区分
}
