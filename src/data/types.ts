export type Speaker = 'staff' | 'customer';

export interface DialogueNode {
  id: string;
  speaker: Speaker;
  ja: string;
  romaji: string;
  en: string;
  audio_key: string;
  cultural_note?: string;
  options?: string[];
  next?: string | null;
}

export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  language: 'ja' | 'fr';
  description: string;
  difficulty: 'beginner' | 'conversational';
  duration_minutes: number;
  root_node_id: string;
  cultural_notes: string[];
  nodes: Record<string, DialogueNode>;
}
