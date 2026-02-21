'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { getScenario } from '@/data/index';
import { getJourneyStats } from '@/lib/utils';
import type { DialogueNode } from '@/data/types';

interface SavedJourney {
  scenario_id: string;
  path: string[];
  saved_at: string;
}

function WaveformPlaceholder() {
  const bars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    height: Math.floor(Math.random() * 20) + 4,
  }));
  return (
    <div className="h-12 rounded-lg flex items-center justify-center gap-[2px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      {bars.map((bar) => (
        <div
          key={bar.id}
          className="rounded-full flex-shrink-0"
          style={{ width: 2, height: bar.height, background: 'rgba(255,255,255,0.2)' }}
        />
      ))}
    </div>
  );
}

export default function PlayPage({ params }: { params: Promise<{ scenario: string }> }) {
  const { scenario: scenarioId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplay = searchParams.get('replay') === 'true';

  const scenario = getScenario(scenarioId);

  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [journeyPath, setJourneyPath] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [activeSpeed, setActiveSpeed] = useState<'0.75×' | '1×' | '1.25×'>('1×');
  const [isReplaying, setIsReplaying] = useState(false);
  const replayIndexRef = useRef(0);

  // Dev-mode broken node reference warnings
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !scenario) return;
    for (const node of Object.values(scenario.nodes)) {
      if (node.options) {
        for (const targetId of node.options) {
          if (!scenario.nodes[targetId]) {
            console.warn(`[drfti] Broken node reference: ${node.id} → ${targetId}`);
          }
        }
      }
      if (node.next && node.next !== null && !scenario.nodes[node.next]) {
        console.warn(`[drfti] Broken node reference: ${node.id} → ${node.next}`);
      }
    }
  }, [scenario]);

  const advanceToNode = useCallback((nodeId: string, currentPath: string[], currentJourneyPath: string[]) => {
    if (!scenario) return currentPath;
    const node = scenario.nodes[nodeId];
    if (!node) return currentPath;

    const newPath = [...currentJourneyPath, nodeId];
    setJourneyPath(newPath);
    setCurrentNodeId(nodeId);
    setSelectedOptionId(null);

    if (node.cultural_note) {
      setActiveToast(node.cultural_note);
    }
    if (node.next === null) {
      setIsComplete(true);
    }
    return newPath;
  }, [scenario]);

  // Initialize
  useEffect(() => {
    if (!scenario) return;
    setCurrentNodeId(scenario.root_node_id);
    setJourneyPath([scenario.root_node_id]);
  }, [scenario]);

  // Replay logic
  useEffect(() => {
    if (!isReplay || !scenario) return;
    try {
      const raw = localStorage.getItem('drfti_journeys');
      if (!raw) return;
      const journeys: SavedJourney[] = JSON.parse(raw);
      const saved = journeys.find((j) => j.scenario_id === scenarioId);
      if (!saved || saved.path.length === 0) return;

      setIsReplaying(true);
      replayIndexRef.current = 0;

      // Start from root (already set), then walk through path
      const walkPath = saved.path.slice(1); // skip root (already set on init)
      let stepIndex = 0;

      const step = () => {
        if (stepIndex >= walkPath.length) {
          setIsReplaying(false);
          return;
        }
        const nodeId = walkPath[stepIndex];
        stepIndex++;
        setJourneyPath((prev) => {
          const newPath = [...prev, nodeId];
          setCurrentNodeId(nodeId);
          if (scenario.nodes[nodeId]?.cultural_note) {
            setActiveToast(scenario.nodes[nodeId].cultural_note!);
          }
          if (scenario.nodes[nodeId]?.next === null) {
            setIsComplete(true);
            setIsReplaying(false);
            return newPath;
          }
          return newPath;
        });
        setTimeout(step, 600);
      };

      setTimeout(step, 800);
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReplay, scenarioId]);

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-brand border-t-transparent" style={{ borderColor: '#E94560', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const currentNode: DialogueNode | undefined = scenario.nodes[currentNodeId];
  const isStaffNode = currentNode && currentNode.speaker === 'staff' && Array.isArray(currentNode.options);
  const { exchanges } = getJourneyStats(journeyPath);

  const handleContinue = () => {
    if (!currentNode) return;
    if (isStaffNode && selectedOptionId) {
      // advance to selected option
      advanceToNode(selectedOptionId, [], journeyPath);
    } else if (!isStaffNode && currentNode.next) {
      advanceToNode(currentNode.next, [], journeyPath);
    } else if (!isStaffNode && currentNode.next === null) {
      setIsComplete(true);
    }
  };

  const handleSaveAndReplay = () => {
    try {
      const raw = localStorage.getItem('drfti_journeys');
      const journeys: SavedJourney[] = raw ? JSON.parse(raw) : [];
      const filtered = journeys.filter((j) => j.scenario_id !== scenarioId);
      filtered.push({ scenario_id: scenarioId, path: journeyPath, saved_at: new Date().toISOString() });
      localStorage.setItem('drfti_journeys', JSON.stringify(filtered));
    } catch {
      // ignore
    }
    router.push(`/ja/${scenarioId}/play?replay=true`);
  };

  const handleTryAgain = () => {
    setCurrentNodeId(scenario.root_node_id);
    setJourneyPath([scenario.root_node_id]);
    setSelectedOptionId(null);
    setIsComplete(false);
    setActiveToast(null);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => router.push(`/ja/${scenarioId}`)}
          className="flex items-center justify-center w-9 h-9 rounded-full"
          style={{ color: '#6B7280' }}
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base">{scenario.emoji}</span>
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{scenario.title}</span>
        </div>
        <span className="text-xs tabular-nums" style={{ color: '#6B7280' }}>
          {exchanges} {exchanges === 1 ? 'exchange' : 'exchanges'}
        </span>
      </div>

      {/* Replay banner */}
      <AnimatePresence>
        {isReplaying && (
          <motion.div
            className="fixed top-[52px] left-0 right-0 z-10 flex items-center justify-between px-4 py-2"
            style={{ background: '#1A1A28', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
          >
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Replaying saved journey</span>
            <button onClick={() => setIsReplaying(false)} style={{ color: '#6B7280' }}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cultural note toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            className="fixed left-0 right-0 z-10 flex items-start gap-3 px-6 py-3 cursor-pointer"
            style={{
              top: isReplaying ? 88 : 52,
              background: '#1A1A28',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            onClick={() => setActiveToast(null)}
          >
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{activeToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 pt-[72px] pb-6 flex flex-col">
        {currentNode && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNodeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col"
            >
              {/* Speaker label */}
              <div className="flex items-center gap-2 mb-4 mt-4">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: currentNode.speaker === 'staff' ? '#E94560' : '#60a5fa' }}
                />
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {currentNode.speaker === 'staff' ? 'Staff' : 'You'}
                </span>
              </div>

              {/* Japanese text */}
              <p className="text-4xl font-bold text-white leading-tight mb-2" style={{ fontFamily: 'var(--font-noto-sans-jp), sans-serif' }}>{currentNode.ja}</p>
              <p className="text-lg font-light mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{currentNode.romaji}</p>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>{currentNode.en}</p>

              {/* Audio controls */}
              <div className="rounded-2xl p-4 mb-6" style={{ background: '#12121A' }}>
                <WaveformPlaceholder />
                <div className="flex items-center justify-between mt-3">
                  <button className="transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                    <RotateCcw size={20} />
                  </button>
                  <div className="flex gap-1">
                    {(['0.75×', '1×', '1.25×'] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setActiveSpeed(speed)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        style={activeSpeed === speed
                          ? { background: 'rgba(233,69,96,0.2)', color: '#E94560', border: '1px solid rgba(233,69,96,0.3)' }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
                        }
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                  <div className="w-5" /> {/* spacer for mic placeholder */}
                </div>
              </div>

              {/* Response area */}
              {isStaffNode && currentNode.options ? (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    How do you respond?
                  </p>
                  {currentNode.options.map((optionId) => {
                    const optionNode = scenario.nodes[optionId];
                    if (!optionNode) return null;
                    const isSelected = selectedOptionId === optionId;
                    return (
                      <motion.div
                        key={optionId}
                        onClick={() => setSelectedOptionId(optionId)}
                        className="p-4 mb-3 rounded-2xl cursor-pointer transition-colors duration-150"
                        style={{
                          background: isSelected ? 'rgba(233,69,96,0.05)' : '#12121A',
                          border: isSelected
                            ? '1px solid rgba(233,69,96,0.5)'
                            : '1px solid rgba(255,255,255,0.08)',
                        }}
                        whileHover={{ borderColor: isSelected ? 'rgba(233,69,96,0.5)' : 'rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <p className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-noto-sans-jp), sans-serif' }}>{optionNode.ja}</p>
                        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{optionNode.en}</p>
                      </motion.div>
                    );
                  })}
                  {selectedOptionId && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleContinue}
                      className="w-full h-12 rounded-xl font-semibold text-white mt-2 transition-colors duration-150"
                      style={{ background: '#E94560' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#d63a52')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#E94560')}
                    >
                      Continue →
                    </motion.button>
                  )}
                </div>
              ) : (
                !isStaffNode && (
                  <button
                    onClick={handleContinue}
                    className="w-full h-12 rounded-xl font-semibold text-white transition-colors duration-150"
                    style={{ background: '#E94560' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#d63a52')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#E94560')}
                  >
                    Continue →
                  </button>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Journey complete overlay */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
            style={{ background: 'rgba(10,10,15,0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-8xl">{scenario.emoji}</span>
            <p className="text-3xl font-bold text-white mt-4">✓ Scene complete</p>
            <p className="mt-2" style={{ color: '#6B7280' }}>
              {exchanges} {exchanges === 1 ? 'exchange' : 'exchanges'}
            </p>
            <div className="mt-10 flex flex-col gap-3 w-full max-w-sm">
              <button
                onClick={handleSaveAndReplay}
                className="w-full h-12 rounded-xl font-semibold text-white transition-colors duration-150"
                style={{ background: '#E94560' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d63a52')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E94560')}
              >
                Practice This Journey
              </button>
              <button
                onClick={handleTryAgain}
                className="w-full h-12 rounded-xl font-semibold text-white transition-colors duration-150"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                Try a Different Path
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
