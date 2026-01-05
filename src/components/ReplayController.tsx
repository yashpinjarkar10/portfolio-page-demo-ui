import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward,
  RotateCcw,
  History,
  X,
  ChevronDown,
  StepForward
} from 'lucide-react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';
import { formatTime, DEMO_SYMBOLS } from '@/data/dummyData';

// TradingView-like speed options (interval in ms between candles)
const SPEED_OPTIONS = [
  { label: '1x', value: 1, interval: 1000 },
  { label: '2x', value: 2, interval: 500 },
  { label: '5x', value: 5, interval: 200 },
  { label: '10x', value: 10, interval: 100 },
];

const ReplayController: React.FC = () => {
  const {
    replay,
    selectedSymbol,
    setReplayPlaying,
    setReplaySpeed,
    setReplayIndex,
    incrementReplayIndex,
    resetReplay,
  } = useAlgoAgentStore();

  const [isReplayMode, setIsReplayMode] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle replay tick - one candle at a time based on speed
  useEffect(() => {
    if (replay.isPlaying && isReplayMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      const speedOption = SPEED_OPTIONS.find(s => s.value === replay.speed) || SPEED_OPTIONS[0];
      
      intervalRef.current = setInterval(() => {
        incrementReplayIndex();
      }, speedOption.interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [replay.isPlaying, replay.speed, isReplayMode, incrementReplayIndex]);

  // Stop playing when reaching the end
  useEffect(() => {
    if (replay.currentIndex >= replay.totalCandles - 1) {
      setReplayPlaying(false);
    }
  }, [replay.currentIndex, replay.totalCandles, setReplayPlaying]);

  // Get current candle time
  const getCurrentTime = useCallback(() => {
    const data = DEMO_SYMBOLS[selectedSymbol]?.data;
    if (!data || replay.currentIndex >= data.length) return 'N/A';
    return formatTime(data[replay.currentIndex].time);
  }, [selectedSymbol, replay.currentIndex]);

  // Start replay mode - preserve current index
  const handleStartReplay = useCallback(() => {
    setIsReplayMode(true);
    setReplayPlaying(false);
    // Don't change the index - start from wherever we currently are
  }, [setReplayPlaying]);

  // Exit replay mode
  const handleExitReplay = useCallback(() => {
    setIsReplayMode(false);
    setReplayPlaying(false);
    setReplayIndex(replay.totalCandles - 1);
  }, [setReplayPlaying, setReplayIndex, replay.totalCandles]);

  // Step forward one candle
  const stepForward = useCallback(() => {
    if (replay.currentIndex < replay.totalCandles - 1) {
      setReplayIndex(replay.currentIndex + 1);
    }
  }, [replay.currentIndex, replay.totalCandles, setReplayIndex]);

  // Step forward 10 candles
  const jumpForward = useCallback(() => {
    const newIndex = Math.min(replay.currentIndex + 10, replay.totalCandles - 1);
    setReplayIndex(newIndex);
  }, [replay.currentIndex, replay.totalCandles, setReplayIndex]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setReplayPlaying(!replay.isPlaying);
  }, [replay.isPlaying, setReplayPlaying]);

  // Handle speed selection
  const handleSpeedSelect = useCallback((speed: number) => {
    setReplaySpeed(speed);
    setShowSpeedMenu(false);
  }, [setReplaySpeed]);

  // Reset to beginning
  const handleReset = useCallback(() => {
    resetReplay();
    setIsReplayMode(false);
  }, [resetReplay]);

  const progress = (replay.currentIndex / (replay.totalCandles - 1)) * 100;
  const currentSpeedLabel = SPEED_OPTIONS.find(s => s.value === replay.speed)?.label || '1x';
  const atEnd = replay.currentIndex >= replay.totalCandles - 1;

  // Non-replay mode - show "Replay" button like TradingView
  if (!isReplayMode) {
    return (
      <div className="bg-dark-surface border-t border-dark-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={handleStartReplay}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded hover:bg-blue-600 transition-colors font-medium"
            >
              <History size={18} />
              <span>Replay</span>
            </button>
            <span className="text-sm text-dark-muted">
              <span className="text-accent-blue">Click on any candle</span> to set start position, then click Replay
            </span>
          </div>
          <div className="text-sm text-dark-muted">
            Start: {getCurrentTime()} • {replay.totalCandles.toLocaleString()} candles total
          </div>
        </div>
      </div>
    );
  }

  // Replay mode UI - TradingView style
  return (
    <div className="bg-dark-surface border-t border-dark-border">
      {/* Thin progress indicator */}
      <div className="h-1 bg-dark-border">
        <div 
          className="h-full bg-accent-blue transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Replay badge and time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-accent-blue/10 border border-accent-blue/30 rounded">
            <History size={14} className="text-accent-blue" />
            <span className="text-sm text-accent-blue font-medium">Replay</span>
          </div>
          <div className="text-sm text-dark-text font-mono">
            {getCurrentTime()}
          </div>
          <div className="text-xs text-dark-muted">
            {replay.currentIndex + 1} / {replay.totalCandles}
          </div>
        </div>

        {/* Center: Main controls */}
        <div className="flex items-center gap-1">
          {/* Step Forward button */}
          <button
            onClick={stepForward}
            disabled={atEnd}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors
              ${atEnd
                ? 'bg-dark-border/50 text-dark-muted cursor-not-allowed'
                : 'bg-dark-border text-dark-text hover:bg-dark-muted/30'
              }
            `}
            title="Step forward 1 candle"
          >
            <StepForward size={16} />
            <span className="text-xs">Step</span>
          </button>

          {/* Jump Forward button */}
          <button
            onClick={jumpForward}
            disabled={atEnd}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors
              ${atEnd
                ? 'bg-dark-border/50 text-dark-muted cursor-not-allowed'
                : 'bg-dark-border text-dark-text hover:bg-dark-muted/30'
              }
            `}
            title="Jump forward 10 candles"
          >
            <SkipForward size={16} />
            <span className="text-xs">+10</span>
          </button>

          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            disabled={atEnd}
            className={`
              flex items-center justify-center w-9 h-9 rounded-full transition-all mx-1
              ${replay.isPlaying 
                ? 'bg-accent-orange text-white hover:bg-orange-600' 
                : atEnd
                  ? 'bg-dark-border/50 text-dark-muted cursor-not-allowed'
                  : 'bg-accent-green text-white hover:bg-green-600'
              }
            `}
            title={replay.isPlaying ? 'Pause' : 'Play'}
          >
            {replay.isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Speed dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-dark-border text-dark-text hover:bg-dark-muted/30 transition-colors"
            >
              <span className="text-xs font-medium">{currentSpeedLabel}</span>
              <ChevronDown size={12} />
            </button>
            
            {showSpeedMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSpeedMenu(false)}
                />
                <div className="absolute bottom-full left-0 mb-1 bg-dark-surface border border-dark-border rounded shadow-xl z-50 overflow-hidden">
                  {SPEED_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSpeedSelect(option.value)}
                      className={`
                        w-full px-4 py-1.5 text-xs text-left hover:bg-dark-border transition-colors
                        ${replay.speed === option.value ? 'text-accent-blue bg-accent-blue/10' : 'text-dark-text'}
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Reset and Exit */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-dark-muted hover:text-dark-text hover:bg-dark-border transition-colors"
            title="Reset"
          >
            <RotateCcw size={14} />
            <span className="text-xs">Reset</span>
          </button>
          <button
            onClick={handleExitReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-accent-red hover:bg-accent-red/10 transition-colors"
            title="Exit replay"
          >
            <X size={14} />
            <span className="text-xs">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplayController;
