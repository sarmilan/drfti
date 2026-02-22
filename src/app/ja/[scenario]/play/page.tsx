'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy } from 'lucide-react';
import { getScenario } from '@/data/index';
import { getJourneyStats } from '@/lib/utils';
import type { DialogueNode } from '@/data/types';
import AudioPlayer from '@/components/conversation/AudioPlayer';

interface SavedJourney {
  scenario_id: string;
  path: string[];
  saved_at: string;
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
  const [toastKey, setToastKey] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayIndexRef = useRef(0);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Dev-mode broken node reference warnings
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !scenario) return;
    for (const node of Object.values(scenario.nodes)) {
      if (node.options) {
        for (const targetId of node.options) {
          if (!scenario.nodes[targetId]) {
            console.warn(`[drfti] ⚠️ Broken reference: node "${node.id}" → "${targetId}" does not exist`);
          }
        }
      }
      if (node.next && !scenario.nodes[node.next]) {
        console.warn(`[drfti] ⚠️ Broken reference: node "${node.id}" → "${node.next}" does not exist`);
      }
    }
  }, [scenario]);

  // Dev overlay keyboard toggle
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setShowDevPanel((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-dismiss toast after 6s; reset when new toast fires
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => setActiveToast(null), 6000);
    return () => clearTimeout(timer);
  }, [activeToast, toastKey]);

  const advanceToNode = useCallback((nodeId: string, currentPath: string[], currentJourneyPath: string[]) => {
    if (!scenario) return currentPath;
    const node = scenario.nodes[nodeId];
    if (!node) return currentPath;

    const newPath = [...currentJourneyPath, nodeId];
    setJourneyPath(newPath);
    setCurrentNodeId(nodeId);
    setSelectedOptionId(null);

    if (node.cultural_note) {
      setToastKey((k) => k + 1);
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
            setToastKey((k) => k + 1);
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
            key={toastKey}
            className="fixed left-0 right-0 z-10 overflow-hidden cursor-pointer"
            style={{
              top: isReplaying ? 88 : 52,
              background: '#1A1A28',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={() => setActiveToast(null)}
          >
            <div className="flex items-start gap-3 px-6 py-3">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{activeToast}</p>
            </div>
            {/* 6s drain bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5"
              style={{ background: '#E94560' }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6, ease: 'linear' }}
            />
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentNode.speaker}
                  className="flex items-center gap-2 mb-4 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: currentNode.speaker === 'staff' ? '#E94560' : '#60a5fa' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {currentNode.speaker === 'staff' ? 'Staff' : 'You'}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Japanese text */}
              <p className="text-4xl font-bold text-white leading-tight mb-2" style={{ fontFamily: 'var(--font-noto-sans-jp), sans-serif' }}>{currentNode.ja}</p>
              <p className="text-lg font-light mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{currentNode.romaji}</p>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>{currentNode.en}</p>

              {/* Audio player */}
              <div className="mb-6">
                <AudioPlayer
                  audioKey={currentNode.audio_key}
                  language="ja"
                  autoPlay={true}
                />
              </div>

              {/* Response area */}
              {isStaffNode && currentNode.options ? (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    How do you respond?
                  </p>
                  {currentNode.options.map((optionId, i) => {
                    const optionNode = scenario.nodes[optionId];
                    if (!optionNode) return null;
                    const isSelected = selectedOptionId === optionId;
                    return (
                      <motion.div
                        key={optionId}
                        onClick={() => setSelectedOptionId(optionId)}
                        className="p-4 mb-3 rounded-2xl cursor-pointer"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          background: isSelected ? 'rgba(233,69,96,0.05)' : '#12121A',
                          borderColor: isSelected ? 'rgba(233,69,96,0.5)' : 'rgba(255,255,255,0.08)',
                        }}
                        transition={{ duration: 0.2, delay: i * 0.06 }}
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        whileHover={{ scale: 1.01, borderColor: isSelected ? 'rgba(233,69,96,0.5)' : 'rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.98 }}
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

      {/* Dev overlay */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {!showDevPanel && (
            <button
              className="fixed bottom-4 left-4 z-50 px-2 py-0.5 rounded-full font-mono text-xs"
              style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }}
              onClick={() => setShowDevPanel(true)}
            >
              D
            </button>
          )}
          <AnimatePresence>
            {showDevPanel && (
              <motion.div
                className="fixed bottom-4 left-4 z-50 rounded-xl p-4 font-mono text-xs max-w-xs"
                style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.1em' }}>DEV · press D to close</span>
                  <button onClick={() => setShowDevPanel(false)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <X size={12} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>node </span>
                    <span style={{ color: '#E94560' }}>{currentNodeId || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>speaker </span>
                    <span>{currentNode?.speaker ?? '—'}</span>
                  </div>
                  {currentNode?.options ? (
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>options </span>
                      <span>[{currentNode.options.join(', ')}]</span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>next </span>
                      <span>{currentNode?.next === null ? 'null (end)' : (currentNode?.next ?? '—')}</span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>path len </span>
                    <span>{journeyPath.length}</span>
                  </div>
                </div>
                <button
                  className="mt-3 w-full py-1.5 rounded-lg flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(journeyPath))}
                >
                  <Copy size={10} />
                  Copy Path
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

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
            <motion.span
              className="text-8xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.1, 1] }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            >
              {scenario.emoji}
            </motion.span>
            <motion.p
              className="text-3xl font-bold text-white mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              ✓ Scene complete
            </motion.p>
            <motion.p
              className="mt-2"
              style={{ color: '#6B7280' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {exchanges} {exchanges === 1 ? 'exchange' : 'exchanges'}
            </motion.p>
            <motion.div
              className="mt-10 flex flex-col gap-3 w-full max-w-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
