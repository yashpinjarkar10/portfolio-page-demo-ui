import React, { useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  DollarSign,
  Percent,
  Clock,
  Target
} from 'lucide-react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';
import { formatTime } from '@/data/dummyData';

const TradingPanel: React.FC = () => {
  const {
    paperBroker,
    connectedBroker,
    currentPrice,
    selectedSymbol,
    replay,
    placeTrade,
    closeTrade,
    closeAllTrades,
  } = useAlgoAgentStore();

  // Quick trade with default quantity
  const handleBuy = useCallback(() => {
    if (connectedBroker !== 'paper' || currentPrice <= 0) return;
    placeTrade('BUY', currentPrice, 1);
  }, [connectedBroker, currentPrice, placeTrade]);

  const handleSell = useCallback(() => {
    if (connectedBroker !== 'paper' || currentPrice <= 0) return;
    placeTrade('SELL', currentPrice, 1);
  }, [connectedBroker, currentPrice, placeTrade]);

  const handleCloseAll = useCallback(() => {
    if (currentPrice > 0) {
      closeAllTrades(currentPrice);
    }
  }, [currentPrice, closeAllTrades]);

  // Calculate totals
  const { totalPnl, totalPnlPercent, openTrades, closedTrades } = useMemo(() => {
    const open = paperBroker.trades.filter(t => t.status === 'OPEN');
    const closed = paperBroker.trades.filter(t => t.status === 'CLOSED');
    
    const realizedPnl = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const unrealizedPnl = open.reduce((sum, t) => {
      const pnl = t.type === 'BUY' 
        ? (currentPrice - t.price) * t.quantity
        : (t.price - currentPrice) * t.quantity;
      return sum + pnl;
    }, 0);
    
    const total = realizedPnl + unrealizedPnl;
    const initialBalance = 1000000;
    const pnlPercent = (total / initialBalance) * 100;

    return {
      totalPnl: total,
      totalPnlPercent: pnlPercent,
      openTrades: open,
      closedTrades: closed,
    };
  }, [paperBroker.trades, currentPrice]);

  const isConnected = connectedBroker === 'paper';

  return (
    <div className="h-full flex flex-col">
      {/* Quick Trade Buttons */}
      <div className="p-4 border-b border-dark-border">
        <div className="text-sm text-dark-muted mb-2">Quick Trade</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBuy}
            disabled={!isConnected || currentPrice <= 0}
            className={`
              flex items-center justify-center gap-2 py-3 rounded font-medium
              ${isConnected && currentPrice > 0
                ? 'bg-accent-green text-white hover:bg-green-600'
                : 'bg-dark-border text-dark-muted cursor-not-allowed'
              }
            `}
          >
            <TrendingUp size={18} />
            BUY
          </button>
          <button
            onClick={handleSell}
            disabled={!isConnected || currentPrice <= 0}
            className={`
              flex items-center justify-center gap-2 py-3 rounded font-medium
              ${isConnected && currentPrice > 0
                ? 'bg-accent-red text-white hover:bg-red-600'
                : 'bg-dark-border text-dark-muted cursor-not-allowed'
              }
            `}
          >
            <TrendingDown size={18} />
            SELL
          </button>
        </div>
        <div className="mt-2 text-center text-xs text-dark-muted">
          Qty: 1 lot @ {currentPrice.toFixed(2)}
        </div>
      </div>

      {/* Account Summary */}
      <div className="p-4 border-b border-dark-border">
        <div className="text-sm text-dark-muted mb-3">Account Summary</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-dark-muted text-sm flex items-center gap-1">
              <DollarSign size={14} /> Balance
            </span>
            <span className="text-dark-text font-medium">
              ₹{paperBroker.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-muted text-sm flex items-center gap-1">
              <Target size={14} /> Equity
            </span>
            <span className="text-dark-text font-medium">
              ₹{paperBroker.equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-muted text-sm flex items-center gap-1">
              <Percent size={14} /> P&L
            </span>
            <span className={`font-medium ${totalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              <span className="text-xs ml-1">
                ({totalPnl >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-dark-muted">
              Open Trades ({openTrades.length})
            </span>
            {openTrades.length > 0 && (
              <button
                onClick={handleCloseAll}
                className="text-xs text-accent-red hover:text-red-400"
              >
                Close All
              </button>
            )}
          </div>

          {openTrades.length === 0 ? (
            <div className="text-center py-8 text-dark-muted text-sm">
              No open trades
            </div>
          ) : (
            <div className="space-y-2">
              {openTrades.map((trade) => {
                const unrealizedPnl = trade.type === 'BUY'
                  ? (currentPrice - trade.price) * trade.quantity
                  : (trade.price - currentPrice) * trade.quantity;
                const pnlPercent = (unrealizedPnl / (trade.price * trade.quantity)) * 100;

                return (
                  <div
                    key={trade.id}
                    className="bg-dark-bg p-3 rounded border border-dark-border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium
                            ${trade.type === 'BUY' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}
                          `}>
                            {trade.type}
                          </span>
                          <span className="text-dark-text font-medium">{trade.symbol}</span>
                        </div>
                        <div className="text-xs text-dark-muted mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(trade.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={() => closeTrade(trade.id, currentPrice)}
                        className="p-1 hover:bg-dark-border rounded text-dark-muted hover:text-dark-text"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-dark-muted">
                        {trade.quantity} @ {trade.price.toFixed(2)}
                      </span>
                      <span className={unrealizedPnl >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                        {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
                        <span className="text-xs ml-1">
                          ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Closed Trades */}
        {closedTrades.length > 0 && (
          <div className="p-4 border-t border-dark-border">
            <div className="text-sm text-dark-muted mb-3">
              Closed Trades ({closedTrades.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {closedTrades.slice(-10).reverse().map((trade) => (
                <div
                  key={trade.id}
                  className="bg-dark-bg/50 p-2 rounded border border-dark-border text-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`
                        px-1.5 py-0.5 rounded text-xs
                        ${trade.type === 'BUY' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}
                      `}>
                        {trade.type}
                      </span>
                      <span className="text-dark-muted">{trade.symbol}</span>
                    </div>
                    <span className={(trade.pnl || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                      {(trade.pnl || 0) >= 0 ? '+' : ''}₹{(trade.pnl || 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="text-xs text-dark-muted mt-1">
                    {trade.price.toFixed(2)} → {trade.exitPrice?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="p-4 bg-accent-orange/10 border-t border-accent-orange/20">
          <div className="text-sm text-accent-orange text-center">
            Connect Paper Broker to start trading
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPanel;
