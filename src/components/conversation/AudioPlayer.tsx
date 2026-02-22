'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { getAudioPath } from '@/lib/audio';

interface AudioPlayerProps {
  audioKey: string;
  language: 'ja' | 'fr';
  onComplete?: () => void;
  autoPlay?: boolean;
}

// Static bar fallback — shown when audio fails or during init
function StaticWaveform() {
  const bars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    height: Math.floor(Math.random() * 20) + 4,
  }));
  return (
    <div
      className="h-12 rounded-lg flex items-center justify-center gap-[2px] overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
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

type Speed = '0.75×' | '1×' | '1.25×';
const SPEED_VALUES: Record<Speed, number> = { '0.75×': 0.75, '1×': 1, '1.25×': 1.25 };

export default function AudioPlayer({ audioKey, language, onComplete, autoPlay = true }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import('wavesurfer.js').default | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState<Speed>('1×');

  // Destroy + recreate wavesurfer when audioKey changes
  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setActiveSpeed('1×');

    let ws: import('wavesurfer.js').default | null = null;
    let destroyed = false;

    const audioPath = getAudioPath(audioKey, language);

    async function init() {
      try {
        const WaveSurfer = (await import('wavesurfer.js')).default;
        if (destroyed || !containerRef.current) return;

        ws = WaveSurfer.create({
          container: containerRef.current,
          height: 48,
          waveColor: 'rgba(255,255,255,0.15)',
          progressColor: '#E94560',
          cursorColor: 'transparent',
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          normalize: true,
          interact: false,
          url: audioPath,
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
          if (destroyed) return;
          setIsLoading(false);
          if (autoPlay) {
            ws?.play();
          }
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));

        ws.on('finish', () => {
          setIsPlaying(false);
          onComplete?.();
        });

        ws.on('error', () => {
          if (destroyed) return;
          setIsLoading(false);
          setHasError(true);
        });
      } catch {
        if (!destroyed) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      ws?.destroy();
      wavesurferRef.current = null;
    };
  }, [audioKey, language, autoPlay, onComplete]);

  const handleRepeat = () => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.seekTo(0);
    ws.play();
  };

  const handlePlayPause = () => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.playPause();
  };

  const handleSpeed = (speed: Speed) => {
    setActiveSpeed(speed);
    wavesurferRef.current?.setPlaybackRate(SPEED_VALUES[speed]);
  };

  // Fallback: show static waveform with no controls
  if (hasError) {
    return (
      <div className="rounded-2xl p-4" style={{ background: '#12121A' }}>
        <StaticWaveform />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#12121A' }}>
      {/* Waveform or loading pulse */}
      {isLoading ? (
        <div
          className="h-12 rounded-lg animate-pulse"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
      ) : null}
      <div
        ref={containerRef}
        style={{ display: isLoading ? 'none' : 'block' }}
      />

      {/* Controls */}
      <div className="flex items-center justify-between mt-3">
        {/* Repeat */}
        <button
          onClick={handleRepeat}
          className="transition-colors"
          style={{ color: isPlaying ? '#E94560' : 'rgba(255,255,255,0.4)' }}
        >
          <RotateCcw size={18} />
        </button>

        {/* Speed pills */}
        <div className="flex gap-1">
          {(['0.75×', '1×', '1.25×'] as Speed[]).map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeed(speed)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={
                activeSpeed === speed
                  ? {
                      background: 'rgba(233,69,96,0.2)',
                      color: '#E94560',
                      border: '1px solid rgba(233,69,96,0.3)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }
              }
            >
              {speed}
            </button>
          ))}
        </div>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  );
}
