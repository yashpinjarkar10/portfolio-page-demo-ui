import React from 'react';
import { ChevronDown, Play, RotateCcw, ShoppingCart } from 'lucide-react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';
import { DEMO_SYMBOLS } from '@/data/dummyData';

interface HeaderProps {
  onTradeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onTradeClick }) => {
  const { 
    selectedSymbol, 
    setSelectedSymbol,
    replay,
    currentPrice,
    resetReplay,
  } = useAlgoAgentStore();

  const symbolInfo = DEMO_SYMBOLS[selectedSymbol];
  const symbols = Object.keys(DEMO_SYMBOLS);

  // Get price change from first candle
  const firstPrice = symbolInfo?.data[0]?.close || 0;
  const priceChange = currentPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <header className="h-14 bg-dark-surface border-b border-dark-border flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AA</span>
        </div>
        <span className="text-dark-text font-semibold hidden sm:block">Algo Agent</span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-dark-border" />

      {/* Symbol Selector */}
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-dark-border transition-colors">
          <span className="text-dark-text font-medium">{selectedSymbol}</span>
          <ChevronDown size={16} className="text-dark-muted" />
        </button>
        
        {/* Dropdown */}
        <div className="absolute top-full left-0 mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-48">
          {symbols.map(symbol => (
            <button
              key={symbol}
              onClick={() => setSelectedSymbol(symbol)}
              className={`
                w-full px-4 py-2 text-left hover:bg-dark-border transition-colors
                ${symbol === selectedSymbol ? 'text-accent-blue' : 'text-dark-text'}
                first:rounded-t-lg last:rounded-b-lg
              `}
            >
              <div className="font-medium">{symbol}</div>
              <div className="text-xs text-dark-muted">{DEMO_SYMBOLS[symbol].name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Price */}
      <div className="flex items-center gap-3">
        <div className="text-xl font-semibold text-dark-text">
          {currentPrice > 0 ? currentPrice.toFixed(2) : '—'}
        </div>
        {currentPrice > 0 && (
          <div className={`text-sm ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Replay Status Badge */}
      {replay.isPlaying && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/30 rounded-full">
          <Play size={14} className="text-accent-blue" />
          <span className="text-sm text-accent-blue">Replay {replay.speed}x</span>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={resetReplay}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-dark-border transition-colors text-dark-muted hover:text-dark-text"
        title="Reset Everything"
      >
        <RotateCcw size={16} />
        <span className="hidden sm:inline text-sm">Reset</span>
      </button>

      {/* Trade Button */}
      <button
        onClick={onTradeClick}
        className="flex items-center gap-2 px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded font-medium transition-colors"
        title="Open Trading Panel"
      >
        <ShoppingCart size={16} />
        <span className="text-sm">Trade</span>
      </button>

      {/* Time indicator */}
      <div className="text-sm text-dark-muted">
        Candle {replay.currentIndex + 1}/{replay.totalCandles}
      </div>
    </header>
  );
};

export default Header;
