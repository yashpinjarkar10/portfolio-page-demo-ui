import React, { useState, useCallback } from 'react';
import { X, GripVertical } from 'lucide-react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';

interface RiskRewardToolProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'long' | 'short';
  entryPrice: number;
  chartHeight: number;
}

const RiskRewardTool: React.FC<RiskRewardToolProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  entryPrice,
  chartHeight 
}) => {
  const { currentPrice } = useAlgoAgentStore();
  
  // Calculate initial values based on entry price
  const defaultRisk = entryPrice * 0.01; // 1% risk
  const defaultReward = entryPrice * 0.02; // 2% reward (1:2 R:R)
  
  const [entry, setEntry] = useState(entryPrice);
  const [stopLoss, setStopLoss] = useState(
    type === 'long' ? entryPrice - defaultRisk : entryPrice + defaultRisk
  );
  const [takeProfit, setTakeProfit] = useState(
    type === 'long' ? entryPrice + defaultReward : entryPrice - defaultReward
  );
  const [quantity, setQuantity] = useState(1);
  const [isDragging, setIsDragging] = useState<'entry' | 'sl' | 'tp' | null>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanelDragging, setIsPanelDragging] = useState(false);

  // Calculate risk/reward metrics
  const riskPerShare = Math.abs(entry - stopLoss);
  const rewardPerShare = Math.abs(takeProfit - entry);
  const totalRisk = riskPerShare * quantity;
  const totalReward = rewardPerShare * quantity;
  const riskRewardRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
  const riskPercent = entry > 0 ? (riskPerShare / entry) * 100 : 0;
  const rewardPercent = entry > 0 ? (rewardPerShare / entry) * 100 : 0;

  // Handle panel drag
  const handlePanelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsPanelDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanelDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsPanelDragging(false);
      setIsDragging(null);
    };

    if (isPanelDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanelDragging, dragOffset]);

  // Update entry when current price changes
  React.useEffect(() => {
    if (isOpen && currentPrice > 0) {
      setEntry(currentPrice);
      const risk = currentPrice * 0.01;
      const reward = currentPrice * 0.02;
      setStopLoss(type === 'long' ? currentPrice - risk : currentPrice + risk);
      setTakeProfit(type === 'long' ? currentPrice + reward : currentPrice - reward);
    }
  }, [isOpen, currentPrice, type]);

  if (!isOpen) return null;

  const isLong = type === 'long';
  const profitColor = isLong ? 'bg-accent-green' : 'bg-accent-red';
  const lossColor = isLong ? 'bg-accent-red' : 'bg-accent-green';

  return (
    <div 
      className="fixed z-50 select-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handlePanelMouseDown}
    >
      <div className="bg-dark-surface border border-dark-border rounded-lg shadow-2xl w-72">
        {/* Header */}
        <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-dark-border cursor-move">
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-dark-muted" />
            <span className="font-medium text-sm">
              {isLong ? 'Long Position' : 'Short Position'}
            </span>
            <span className={`px-1.5 py-0.5 text-xs rounded ${isLong ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
              {riskRewardRatio.toFixed(2)} R:R
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-dark-muted hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Visual representation */}
        <div className="p-3 border-b border-dark-border">
          <div className="relative h-32 bg-dark-bg rounded-lg overflow-hidden">
            {/* Take Profit Zone */}
            <div 
              className={`absolute left-0 right-0 ${isLong ? 'top-0' : 'bottom-0'} ${profitColor}/20`}
              style={{ height: '40%' }}
            >
              <div className={`absolute ${isLong ? 'bottom-0' : 'top-0'} left-0 right-0 h-0.5 ${profitColor}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-accent-green font-medium">
                  TP: ₹{takeProfit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Entry Zone */}
            <div 
              className="absolute left-0 right-0 bg-accent-blue/20"
              style={{ top: '40%', height: '20%' }}
            >
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-accent-blue"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-accent-blue font-medium">
                  Entry: ₹{entry.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Stop Loss Zone */}
            <div 
              className={`absolute left-0 right-0 ${isLong ? 'bottom-0' : 'top-0'} ${lossColor}/20`}
              style={{ height: '40%' }}
            >
              <div className={`absolute ${isLong ? 'top-0' : 'bottom-0'} left-0 right-0 h-0.5 ${lossColor}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-accent-red font-medium">
                  SL: ₹{stopLoss.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price inputs */}
        <div className="p-3 space-y-2 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-accent-green">Take Profit</span>
            <input
              type="number"
              value={takeProfit.toFixed(2)}
              onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs bg-dark-bg border border-dark-border rounded text-right focus:border-accent-green"
              step="0.05"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-accent-blue">Entry Price</span>
            <input
              type="number"
              value={entry.toFixed(2)}
              onChange={(e) => setEntry(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs bg-dark-bg border border-dark-border rounded text-right focus:border-accent-blue"
              step="0.05"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-accent-red">Stop Loss</span>
            <input
              type="number"
              value={stopLoss.toFixed(2)}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-xs bg-dark-bg border border-dark-border rounded text-right focus:border-accent-red"
              step="0.05"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-muted">Quantity</span>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-24 px-2 py-1 text-xs bg-dark-bg border border-dark-border rounded text-right"
              min="1"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-red/10 rounded p-2">
              <div className="text-xs text-dark-muted">Risk</div>
              <div className="text-sm font-medium text-accent-red">
                ₹{totalRisk.toFixed(2)}
              </div>
              <div className="text-xs text-dark-muted">
                {riskPercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-accent-green/10 rounded p-2">
              <div className="text-xs text-dark-muted">Reward</div>
              <div className="text-sm font-medium text-accent-green">
                ₹{totalReward.toFixed(2)}
              </div>
              <div className="text-xs text-dark-muted">
                {rewardPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-muted">Risk/Reward Ratio</span>
            <span className={`font-bold ${riskRewardRatio >= 2 ? 'text-accent-green' : riskRewardRatio >= 1 ? 'text-accent-orange' : 'text-accent-red'}`}>
              1:{riskRewardRatio.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-dark-muted">
            <span>Break-even Win Rate</span>
            <span>{(100 / (1 + riskRewardRatio)).toFixed(1)}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-dark-border">
          <button
            onClick={onClose}
            className={`w-full py-2 rounded font-medium text-sm text-white transition-colors ${isLong ? 'bg-accent-green hover:bg-green-600' : 'bg-accent-red hover:bg-red-600'}`}
          >
            Apply to Chart
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskRewardTool;
