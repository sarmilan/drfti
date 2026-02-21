'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { getScenario } from '@/data/index';
import { formatDuration } from '@/lib/utils';
import type { Scenario } from '@/data/types';

const STUB_SCENARIOS: Omit<Scenario, 'language' | 'root_node_id' | 'cultural_notes' | 'nodes'>[] = [
  {
    id: 'convenience-store',
    title: 'Convenience Store',
    emoji: '🏪',
    difficulty: 'beginner',
    duration_minutes: 4,
    description: 'Buy snacks, ask for a bag, pay and go.',
  },
  {
    id: 'cafe',
    title: 'Cafe',
    emoji: '☕',
    difficulty: 'beginner',
    duration_minutes: 5,
    description: 'Order a drink, ask about the menu, sit down.',
  },
  {
    id: 'shoe-store',
    title: 'Shoe Store',
    emoji: '👟',
    difficulty: 'conversational',
    duration_minutes: 7,
    description: 'Ask for your size, try them on, negotiate.',
  },
];

const difficultyStyle = {
  beginner: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Beginner' },
  conversational: { bg: 'rgba(234,179,8,0.15)', text: '#facc15', label: 'Conversational' },
} as const;

interface ScenarioCardProps {
  id: string;
  title: string;
  emoji: string;
  difficulty: 'beginner' | 'conversational';
  duration_minutes: number;
  description: string;
  active: boolean;
  index: number;
  onClick?: () => void;
}

function ScenarioCard({ id, title, emoji, difficulty, duration_minutes, description, active, index, onClick }: ScenarioCardProps) {
  const diff = difficultyStyle[difficulty];
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      onClick={active ? onClick : undefined}
      className="relative flex gap-4 p-5 rounded-2xl transition-colors duration-150"
      style={{
        background: '#12121A',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: active ? 'pointer' : 'default',
      }}
      whileHover={active ? { borderColor: 'rgba(255,255,255,0.2)' } : undefined}
    >
      {/* Emoji icon */}
      <div
        className="flex items-center justify-center w-14 h-14 rounded-xl text-3xl flex-shrink-0"
        style={{ background: '#1A1A28' }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="text-sm line-clamp-1" style={{ color: '#6B7280' }}>{description}</p>
        <div className="flex gap-2 mt-2 items-center">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: diff.bg, color: diff.text }}
          >
            {diff.label}
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{formatDuration(duration_minutes)}</span>
        </div>
      </div>

      {/* Coming soon overlay */}
      {!active && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(10,10,15,0.6)' }}
        >
          <span className="text-sm" style={{ color: '#6B7280' }}>Coming Soon</span>
        </div>
      )}
    </motion.div>
  );
}

export default function JaPage() {
  const router = useRouter();
  const ramen = getScenario('ramen-shop');

  const allScenarios = [
    ramen
      ? { id: ramen.id, title: ramen.title, emoji: ramen.emoji, difficulty: ramen.difficulty, duration_minutes: ramen.duration_minutes, description: ramen.description, active: true }
      : null,
    ...STUB_SCENARIOS.map((s) => ({ ...s, active: false })),
  ].filter(Boolean) as Array<{ id: string; title: string; emoji: string; difficulty: 'beginner' | 'conversational'; duration_minutes: number; description: string; active: boolean }>;

  return (
    <PageTransition>
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ color: '#9CA3AF' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <p className="text-lg font-semibold text-white leading-tight">Japanese</p>
          <p className="text-sm leading-tight" style={{ color: '#6B7280' }}>Tokyo · Osaka · Kyoto</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-8 pb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Choose a scenario</h2>

        {allScenarios.length === 0 && (
          <p className="text-center mt-16" style={{ color: '#6B7280' }}>No scenarios yet — check back soon.</p>
        )}

        <div className="flex flex-col gap-3">
          {allScenarios.map((s, i) => (
            <ScenarioCard
              key={s.id}
              {...s}
              index={i}
              onClick={() => router.push(`/ja/${s.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
