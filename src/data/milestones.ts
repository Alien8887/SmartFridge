export interface Milestone { threshold: number; label: string; icon: string; description: string; }
export const MILESTONES: Milestone[] = [
  { threshold: 1,   label: 'Getting Started', icon: '🌱', description: 'Used your first item before it went to waste' },
  { threshold: 10,  label: 'Waste Warrior',   icon: '⚔️', description: '10 items saved from the trash' },
  { threshold: 50,  label: 'Fridge Master',   icon: '👑', description: '50 items saved from the trash' },
  { threshold: 100, label: 'Zero-Waste Hero', icon: '🏆', description: '100 items saved from the trash' },
];