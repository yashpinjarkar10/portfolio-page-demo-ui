import { create } from 'zustand';
import type { Trade, Position, BrokerAccount, ReplayState } from '@/types';
import { DEMO_SYMBOLS, getTotalCandles } from '@/data/dummyData';

interface AlgoAgentState {
  // Symbol selection
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;

  // Replay state
  replay: ReplayState;
  setReplayPlaying: (playing: boolean) => void;
  setReplaySpeed: (speed: number) => void;
  setReplayIndex: (index: number) => void;
  incrementReplayIndex: () => void;
  resetReplay: () => void;

  // Broker state
  paperBroker: BrokerAccount;
  connectedBroker: 'paper' | 'live' | null;
  setConnectedBroker: (broker: 'paper' | 'live' | null) => void;

  // Trading actions
  placeTrade: (type: 'BUY' | 'SELL', price: number, quantity: number) => void;
  closeTrade: (tradeId: string, exitPrice: number) => void;
  closeAllTrades: (exitPrice: number) => void;

  // Current price (for PnL calculation)
  currentPrice: number;
  setCurrentPrice: (price: number) => void;

  // Panel state
  rightPanelOpen: boolean;
  rightPanelTab: 'broker' | 'trades' | 'positions' | 'orders';
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: 'broker' | 'trades' | 'positions' | 'orders') => void;

  // Drawing tools
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  drawingMode: boolean;
  setDrawingMode: (mode: boolean) => void;
}

const INITIAL_BALANCE = 1000000; // 10 Lakh INR

const createInitialPaperBroker = (): BrokerAccount => ({
  id: 'paper-broker',
  name: 'Paper Trading',
  type: 'PAPER',
  balance: INITIAL_BALANCE,
  equity: INITIAL_BALANCE,
  margin: 0,
  availableMargin: INITIAL_BALANCE,
  positions: [],
  trades: [],
  connected: false,
});

export const useAlgoAgentStore = create<AlgoAgentState>((set, get) => ({
  // Symbol
  selectedSymbol: 'NIFTY50',
  setSelectedSymbol: (symbol) => {
    set({ 
      selectedSymbol: symbol,
      replay: {
        ...get().replay,
        currentIndex: 100,
        totalCandles: getTotalCandles(symbol),
        isPlaying: false,
      }
    });
  },

  // Replay
  replay: {
    isPlaying: false,
    speed: 1,
    currentIndex: 100,
    totalCandles: getTotalCandles('NIFTY50'),
    currentTime: 0,
  },
  setReplayPlaying: (playing) => set((state) => ({
    replay: { ...state.replay, isPlaying: playing }
  })),
  setReplaySpeed: (speed) => set((state) => ({
    replay: { ...state.replay, speed }
  })),
  setReplayIndex: (index) => set((state) => ({
    replay: { 
      ...state.replay, 
      currentIndex: Math.max(0, Math.min(index, state.replay.totalCandles - 1))
    }
  })),
  incrementReplayIndex: () => set((state) => {
    const newIndex = state.replay.currentIndex + 1;
    if (newIndex >= state.replay.totalCandles) {
      return { replay: { ...state.replay, isPlaying: false } };
    }
    return { replay: { ...state.replay, currentIndex: newIndex } };
  }),
  resetReplay: () => set((state) => ({
    replay: { 
      ...state.replay, 
      isPlaying: false, 
      currentIndex: 100,
    },
    paperBroker: createInitialPaperBroker(),
  })),

  // Broker
  paperBroker: createInitialPaperBroker(),
  connectedBroker: null,
  setConnectedBroker: (broker) => set((state) => ({
    connectedBroker: broker,
    paperBroker: {
      ...state.paperBroker,
      connected: broker === 'paper',
    }
  })),

  // Trading
  currentPrice: 0,
  setCurrentPrice: (price) => {
    set({ currentPrice: price });
    // Update positions PnL
    set((state) => ({
      paperBroker: {
        ...state.paperBroker,
        positions: state.paperBroker.positions.map(pos => ({
          ...pos,
          currentPrice: price,
          pnl: (price - pos.avgPrice) * pos.quantity,
          pnlPercent: ((price - pos.avgPrice) / pos.avgPrice) * 100,
        })),
        equity: state.paperBroker.balance + 
          state.paperBroker.positions.reduce((sum, pos) => 
            sum + (price - pos.avgPrice) * pos.quantity, 0
          ),
      }
    }));
  },

  placeTrade: (type, price, quantity) => set((state) => {
    const trade: Trade = {
      id: `trade-${Date.now()}`,
      symbol: state.selectedSymbol,
      type,
      price,
      quantity,
      timestamp: DEMO_SYMBOLS[state.selectedSymbol]?.data[state.replay.currentIndex]?.time || Date.now() / 1000,
      status: 'OPEN',
    };

    // Calculate margin required
    const marginRequired = price * quantity * 0.2; // 20% margin

    if (marginRequired > state.paperBroker.availableMargin) {
      console.warn('Insufficient margin');
      return state;
    }

    // Update or create position
    const existingPosition = state.paperBroker.positions.find(
      p => p.symbol === state.selectedSymbol
    );

    let newPositions: Position[];
    if (existingPosition) {
      const newQuantity = type === 'BUY' 
        ? existingPosition.quantity + quantity 
        : existingPosition.quantity - quantity;
      
      if (newQuantity === 0) {
        newPositions = state.paperBroker.positions.filter(
          p => p.symbol !== state.selectedSymbol
        );
      } else {
        newPositions = state.paperBroker.positions.map(p => 
          p.symbol === state.selectedSymbol 
            ? { 
                ...p, 
                quantity: newQuantity,
                avgPrice: type === 'BUY' 
                  ? (p.avgPrice * p.quantity + price * quantity) / (p.quantity + quantity)
                  : p.avgPrice,
              }
            : p
        );
      }
    } else {
      newPositions = [
        ...state.paperBroker.positions,
        {
          symbol: state.selectedSymbol,
          quantity: type === 'BUY' ? quantity : -quantity,
          avgPrice: price,
          currentPrice: price,
          pnl: 0,
          pnlPercent: 0,
        }
      ];
    }

    return {
      paperBroker: {
        ...state.paperBroker,
        trades: [...state.paperBroker.trades, trade],
        positions: newPositions,
        margin: state.paperBroker.margin + marginRequired,
        availableMargin: state.paperBroker.availableMargin - marginRequired,
      }
    };
  }),

  closeTrade: (tradeId, exitPrice) => set((state) => {
    const trade = state.paperBroker.trades.find(t => t.id === tradeId);
    if (!trade || trade.status === 'CLOSED') return state;

    const pnl = trade.type === 'BUY' 
      ? (exitPrice - trade.price) * trade.quantity
      : (trade.price - exitPrice) * trade.quantity;
    
    const marginReleased = trade.price * trade.quantity * 0.2;

    return {
      paperBroker: {
        ...state.paperBroker,
        trades: state.paperBroker.trades.map(t => 
          t.id === tradeId 
            ? { 
                ...t, 
                status: 'CLOSED' as const, 
                exitPrice, 
                exitTimestamp: Date.now() / 1000,
                pnl,
                pnlPercent: (pnl / (trade.price * trade.quantity)) * 100,
              }
            : t
        ),
        balance: state.paperBroker.balance + pnl,
        margin: state.paperBroker.margin - marginReleased,
        availableMargin: state.paperBroker.availableMargin + marginReleased + pnl,
      }
    };
  }),

  closeAllTrades: (exitPrice) => set((state) => {
    let totalPnl = 0;
    let totalMarginReleased = 0;

    const closedTrades = state.paperBroker.trades.map(trade => {
      if (trade.status === 'CLOSED') return trade;
      
      const pnl = trade.type === 'BUY' 
        ? (exitPrice - trade.price) * trade.quantity
        : (trade.price - exitPrice) * trade.quantity;
      
      totalPnl += pnl;
      totalMarginReleased += trade.price * trade.quantity * 0.2;

      return {
        ...trade,
        status: 'CLOSED' as const,
        exitPrice,
        exitTimestamp: Date.now() / 1000,
        pnl,
        pnlPercent: (pnl / (trade.price * trade.quantity)) * 100,
      };
    });

    return {
      paperBroker: {
        ...state.paperBroker,
        trades: closedTrades,
        positions: [],
        balance: state.paperBroker.balance + totalPnl,
        equity: state.paperBroker.balance + totalPnl,
        margin: 0,
        availableMargin: state.paperBroker.balance + totalPnl,
      }
    };
  }),

  // Panel
  rightPanelOpen: true,
  rightPanelTab: 'broker',
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  // Drawing tools
  selectedTool: 'crosshair',
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  drawingMode: false,
  setDrawingMode: (mode) => set({ drawingMode: mode }),
}));
