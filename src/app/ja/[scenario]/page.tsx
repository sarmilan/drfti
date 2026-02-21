'use client';

export const runtime = 'edge';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { getScenario } from '@/data/index';

interface SavedJourney {
  scenario_id: string;
  path: string[];
  saved_at: string;
}

export default function ScenarioPage({ params }: { params: Promise<{ scenario: string }> }) {
  const { scenario: scenarioId } = use(params);
  const router = useRouter();
  const scenario = getScenario(scenarioId);
  const [hasSavedJourney, setHasSavedJourney] = useState(false);

  useEffect(() => {
    if (!scenario) {
      router.replace('/ja');
      return;
    }
    try {
      const raw = localStorage.getItem('drfti_journeys');
      if (raw) {
        const journeys: SavedJourney[] = JSON.parse(raw);
        setHasSavedJourney(journeys.some((j) => j.scenario_id === scenarioId));
      }
    } catch {
      // ignore
    }
  }, [scenario, scenarioId, router]);

  if (!scenario) return null;

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0F' }}>
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => router.push('/ja')}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          style={{ color: '#9CA3AF' }}
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-40">
        <motion.div
          className="text-8xl text-center mt-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {scenario.emoji}
        </motion.div>

        <motion.h1
          className="text-3xl font-bold text-white text-center mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {scenario.title}
        </motion.h1>

        <motion.p
          className="text-base text-center max-w-xs mx-auto mt-2"
          style={{ color: '#6B7280' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
        >
          {scenario.description}
        </motion.p>

        {scenario.cultural_notes[0] && (
          <motion.div
            className="w-full max-w-sm mt-8 flex gap-3 p-4 rounded-2xl"
            style={{ background: '#1A1A28', border: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32 }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-lg flex-shrink-0"
              style={{ background: 'rgba(233,69,96,0.1)' }}
            >
              💡
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {scenario.cultural_notes[0]}
            </p>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-12"
        style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0F 40%)' }}
      >
        {hasSavedJourney && (
          <button
            onClick={() => router.push(`/ja/${scenarioId}/play?replay=true`)}
            className="w-full h-12 rounded-xl font-semibold mb-3 transition-colors duration-150"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Replay Saved Journey
          </button>
        )}
        <button
          onClick={() => router.push(`/ja/${scenarioId}/play`)}
          className="w-full h-12 rounded-xl font-semibold text-white transition-colors duration-150"
          style={{ background: '#E94560' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#d63a52')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#E94560')}
        >
          Start Scene
        </button>
      </div>
    </div>
    </PageTransition>
  );
}
