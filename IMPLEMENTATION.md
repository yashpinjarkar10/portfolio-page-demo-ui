# Algo Agent Implementation Guide

## 📚 Table of Contents
1. [Prebuilt Libraries](#prebuilt-libraries)
2. [Custom Components](#custom-components)
3. [State Management](#state-management)
4. [Data Flow](#data-flow)
5. [Drawing System](#drawing-system)
6. [Trading System](#trading-system)

---

## 🔧 Prebuilt Libraries

### 1. **TradingView Lightweight Charts** (`lightweight-charts` v5.0.8)
**Where:** `src/components/TradingChart.tsx`

**What it does:** Professional candlestick charting library

**Implementation:**
```typescript
import { createChart, CandlestickSeries } from 'lightweight-charts';

// Create chart instance
const chart = createChart(container, {
  width: container.clientWidth,
  height: height,
  layout: { background: { color: '#131722' } },
  // ... more config
});

// Add candlestick series
const candleSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350'
});
```

**Key Methods Used:**
- `createChart()` - Creates chart instance
- `addSeries()` - Adds candlestick/volume series
- `setData()` - Updates chart data
- `timeScale()` - Access time axis for scrolling
- `coordinateToPrice()` / `priceToCoordinate()` - Convert pixels ↔ prices
- `coordinateToTime()` / `timeToCoordinate()` - Convert pixels ↔ timestamps
- `subscribeCrosshairMove()` - Track mouse movement on chart

**Files:**
- `src/components/TradingChart.tsx` (lines 100-350)

---

### 2. **Zustand** (`zustand` v5.0.0)
**Where:** `src/store/useAlgoAgentStore.ts`

**What it does:** Lightweight state management (like Redux but simpler)

**Implementation:**
```typescript
import { create } from 'zustand';

export const useAlgoAgentStore = create<AlgoAgentStore>((set) => ({
  // State
  selectedSymbol: 'NIFTY50',
  currentPrice: 0,
  selectedTool: 'crosshair',
  
  // Actions
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setCurrentPrice: (price) => set({ currentPrice: price }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
}));
```

**How to use:**
```typescript
// In any component
const { selectedSymbol, setSelectedSymbol } = useAlgoAgentStore();
```

**Files:**
- `src/store/useAlgoAgentStore.ts` (entire file)

---

### 3. **React 18.3.1**
**Where:** All component files

**What it does:** UI framework

**Key Hooks Used:**
- `useState` - Component state
- `useEffect` - Side effects (subscriptions, cleanup)
- `useRef` - Direct DOM access, persist values without re-render
- `useCallback` - Memoize functions
- `useMemo` - Memoize computed values
- `useImperativeHandle` - Expose methods to parent via ref
- `forwardRef` - Pass refs to child components

---

### 4. **Vite** (`vite` v6.4.1)
**Where:** `vite.config.ts`, build system

**What it does:** Fast build tool with Hot Module Replacement (HMR)

**Configuration:**
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
});
```

**Commands:**
- `npm run dev` - Start dev server
- `npm run build` - Production build

---

### 5. **TailwindCSS** (`tailwindcss` v3.4.15)
**Where:** All components, `tailwind.config.js`, `src/index.css`

**What it does:** Utility-first CSS framework

**Custom Theme:**
```javascript
// tailwind.config.js
colors: {
  'dark-bg': '#0a0a0a',
  'dark-surface': '#141414',
  'dark-border': '#1f1f1f',
  'dark-text': '#f5f5f5',
  'accent-blue': '#3b82f6'
}
```

---

## 🎨 Custom Components

### 1. **TradingChart** (`src/components/TradingChart.tsx`)
**Custom wrapper around Lightweight Charts**

**What we built:**
- Chart initialization with dark theme
- Candlestick + Volume series management
- Trade markers system
- IST timezone formatting
- Interactive tooltip
- Crosshair tracking
- Exposed methods via `useImperativeHandle`:
  ```typescript
  {
    setData: (data) => void,
    setMarkers: (markers) => void,
    getChart: () => IChartApi,
    getCandleSeries: () => ISeriesApi
  }
  ```

**Key Implementation:**
```typescript
// Line 231-250: Initialize chart
const chart = createChart(container, {...});
chartRef.current = chart;

// Line 252-258: Add candlestick series
const candleSeries = chart.addSeries(CandlestickSeries, {...});
candleSeriesRef.current = candleSeries;

// Line 260-271: Add volume series
const volumeSeries = chart.addSeries(HistogramSeries, {...});

// Line 294-330: Crosshair tooltip
chart.subscribeCrosshairMove(param => {
  // Show OHLC data on hover
});
```

---

### 2. **ReplayController** (`src/components/ReplayController.tsx`)
**100% Custom - Video player-style controls**

**What we built:**
- Play/Pause replay
- Step forward/backward (candle by candle)
- Speed control (1x, 2x, 5x, 10x)
- Progress slider
- Current candle index display

**Implementation:**
```typescript
// Line 15-40: Play/pause with interval
useEffect(() => {
  if (isPlaying) {
    const interval = setInterval(() => {
      if (currentIndex < maxIndex) {
        setReplayIndex(currentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    }, 1000 / speed);
    return () => clearInterval(interval);
  }
}, [isPlaying, currentIndex, speed]);

// Line 80-95: Step controls
const handleStepBackward = () => {
  if (currentIndex > 0) {
    setReplayIndex(currentIndex - 1);
  }
};
```

---

### 3. **DrawingCanvas** (`src/components/DrawingCanvas.tsx`)
**100% Custom - Canvas-based drawing overlay**

**What we built:**
- HTML5 Canvas overlay on chart
- Price/Time coordinate system (not pixels!)
- Drawing tools: lines, shapes, text, measure, risk/reward
- Persistent drawings across zoom/scroll
- Real-time synchronization with chart

**Key Innovation - Coordinate Conversion:**
```typescript
// Line 75-90: Pixel → Chart coordinates
const pixelToChart = (x: number, y: number): ChartPoint | null => {
  const chart = chartRef.current?.getChart();
  const series = chartRef.current?.getCandleSeries();
  
  const time = chart.timeScale().coordinateToTime(x);
  const price = series.coordinateToPrice(y);
  
  return { price, time };
};

// Line 92-106: Chart → Pixel coordinates
const chartToPixel = (point: ChartPoint): PixelPoint | null => {
  const x = chart.timeScale().timeToCoordinate(point.time);
  const y = series.priceToCoordinate(point.price);
  
  return { x, y };
};
```

**Storage Strategy:**
```typescript
// Line 32-35: Store drawings in price/time
interface Drawing {
  points: ChartPoint[]; // { price, time }[] - NOT pixels!
  type: string;
  color: string;
}

// Line 108-133: Render by converting to pixels
const redrawCanvas = () => {
  drawings.forEach(drawing => {
    const pixelPoints = drawing.points
      .map(p => chartToPixel(p))
      .filter(p => p !== null);
    
    drawShape(ctx, drawing.type, pixelPoints, ...);
  });
};
```

**Animation Loop:**
```typescript
// Line 471-481: Continuous redraw at 60fps
useEffect(() => {
  let animationId: number;
  
  const animate = () => {
    redrawCanvas();
    animationId = requestAnimationFrame(animate);
  };
  
  animationId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationId);
}, [redrawCanvas]);
```

---

### 4. **LeftToolbar** (`src/components/LeftToolbar.tsx`)
**100% Custom - TradingView-style toolbar**

**What we built:**
- Tool groups with dropdowns
- Cursor, Lines, Shapes, Text, Measure tools
- Active tool highlighting
- Delete all drawings button

**Implementation:**
```typescript
// Line 15-45: Tool groups configuration
const toolGroups = [
  {
    category: 'cursor',
    icon: MousePointer2,
    tools: [
      { id: 'crosshair', icon: Plus },
      { id: 'dot', icon: Circle },
      { id: 'arrow', icon: ArrowUpRight }
    ]
  },
  // ... more groups
];

// Line 80-100: Active tool state
const isToolActive = (toolId: string) => {
  return selectedTool === toolId;
};
```

---

### 5. **TradePopup** (`src/components/TradePopup.tsx`)
**100% Custom - ZERODHA-style order entry**

**What we built:**
- Draggable popup
- BUY/SELL tabs
- Order types: LIMIT, MARKET, STOP
- Quantity and price inputs
- Lot size presets
- Order validity (IOC/DAY)

**Implementation:**
```typescript
// Line 45-60: Execute trade
const handleExecuteTrade = () => {
  const trade = executeTrade({
    symbol,
    type: isBuy ? 'BUY' : 'SELL',
    quantity,
    price: orderType === 'MARKET' ? currentPrice : price,
    orderType,
    timestamp: Date.now()
  });
};
```

---

### 6. **RiskRewardTool** (`src/components/RiskRewardTool.tsx`)
**100% Custom - SL/TP calculator**

**What we built:**
- Entry/Target/Stop loss inputs
- Automatic R:R ratio calculation
- Break-even win rate
- Visual preview of risk zones

**Implementation:**
```typescript
// Line 40-55: Calculate R:R
useEffect(() => {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(target - entryPrice);
  const ratio = risk > 0 ? (reward / risk).toFixed(2) : '0';
  setRiskReward(ratio);
  
  // Break-even formula
  const rr = parseFloat(ratio);
  const winRate = rr > 0 ? (1 / (1 + rr) * 100).toFixed(1) : '50.0';
  setBreakEvenWinRate(winRate);
}, [entryPrice, target, stopLoss]);
```

---

### 7. **RightSidebar** (`src/components/RightSidebar.tsx`)
**100% Custom - Multi-tab sidebar**

**What we built:**
- Tab navigation (Broker, Trading, Backtest, AI, Settings)
- Paper broker connection UI
- Trading panel with positions/orders
- Chatbot integration

---

### 8. **Chatbot** (`src/components/Chatbot.tsx`)
**100% Custom - AI assistant UI**

**What we built:**
- Message history
- Quick action buttons
- Typing animation
- Demo responses (hardcoded)

**Implementation:**
```typescript
// Line 35-50: Send message
const handleSend = () => {
  setMessages([
    ...messages,
    { role: 'user', content: input, timestamp: Date.now() }
  ]);
  
  // Simulate AI response
  setTimeout(() => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Demo response...',
      timestamp: Date.now()
    }]);
  }, 1000);
};
```

---

## 🗂️ State Management

### Global State (Zustand)
**File:** `src/store/useAlgoAgentStore.ts`

```typescript
interface AlgoAgentStore {
  // Symbol & Price
  selectedSymbol: string;
  currentPrice: number;
  
  // Replay State
  replay: {
    isPlaying: boolean;
    currentIndex: number;
    speed: number;
  };
  
  // Trading
  paperBroker: {
    connected: boolean;
    balance: number;
    trades: Trade[];
    positions: Position[];
  };
  
  // Drawing Tools
  selectedTool: string;
  
  // Actions
  setSelectedSymbol: (symbol: string) => void;
  setCurrentPrice: (price: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setReplayIndex: (index: number) => void;
  executeTrade: (trade: TradeInput) => Trade;
  closePosition: (tradeId: string, exitPrice: number) => void;
  setSelectedTool: (tool: string) => void;
}
```

**How it works:**
1. Components import: `const { selectedSymbol } = useAlgoAgentStore();`
2. Any component can read/write state
3. Changes trigger re-renders in all subscribed components

---

## 📊 Data Flow

### 1. **Dummy Data Generation**
**File:** `src/data/dummyData.ts`

**What we built:**
```typescript
// Line 10-30: Generate random OHLCV candles
const generateOHLCVData = (basePrice: number, count: number) => {
  for (let i = 0; i < count; i++) {
    const volatility = basePrice * 0.02;
    const open = previousClose;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.floor(Math.random() * 1000000 + 500000);
    
    data.push({ time, open, high, low, close, volume });
  }
};

// Line 40-60: 4 symbols with 2000 candles each
export const DEMO_SYMBOLS = {
  'NIFTY50': { data: generateOHLCVData(24000, 2000) },
  'BANKNIFTY': { data: generateOHLCVData(51000, 2000) },
  'RELIANCE': { data: generateOHLCVData(2800, 2000) },
  'TCS': { data: generateOHLCVData(3900, 2000) }
};
```

### 2. **Replay System Flow**
```
User clicks Play
  ↓
ReplayController updates: setIsPlaying(true)
  ↓
useEffect interval increments: setReplayIndex(index + 1)
  ↓
App.tsx useMemo recalculates: chartData = getReplayData(symbol, index)
  ↓
chartRef.current.setData(chartData.slice(0, index))
  ↓
TradingView chart updates visually
```

**File:** `src/App.tsx` lines 45-50
```typescript
const chartData = useMemo(() => {
  return getReplayData(selectedSymbol, replay.currentIndex);
}, [selectedSymbol, replay.currentIndex]);
```

### 3. **Trade Execution Flow**
```
User fills TradePopup form
  ↓
Clicks "Place Order"
  ↓
Calls: executeTrade({ symbol, type, quantity, price })
  ↓
Zustand store creates trade object:
  {
    id: uuid(),
    symbol, type, quantity, price,
    status: 'OPEN',
    pnl: 0,
    timestamp: currentCandle.time
  }
  ↓
Adds to paperBroker.trades array
  ↓
App.tsx detects new trade → generates marker
  ↓
chartRef.current.setMarkers([...markers])
  ↓
TradingView shows entry arrow on chart
```

**File:** `src/store/useAlgoAgentStore.ts` lines 120-145

---

## 🎨 Drawing System

### Architecture
```
User selects tool from LeftToolbar
  ↓
setSelectedTool('rectangle')
  ↓
DrawingCanvas detects: isDrawingTool = true
  ↓
Canvas className: 'pointer-events-auto cursor-crosshair z-10'
  ↓
User clicks + drags on chart
  ↓
onMouseDown: pixelToChart(x, y) → { price, time }
  ↓
onMouseMove: update currentDrawing.points
  ↓
onMouseUp: save to drawings array
  ↓
requestAnimationFrame loop:
  - chartToPixel(drawing.points)
  - drawShape(ctx, type, pixelPoints)
  ↓
Drawings persist across zoom/scroll/tool changes
```

### Coordinate System
**Why we use price/time instead of pixels:**

❌ **Pixel storage (wrong):**
```typescript
// If we stored { x: 250, y: 150 }
// Problem: When chart zooms, price 24000 is no longer at x=250
// Drawing would stay at x=250 but chart moved → broken!
```

✅ **Price/Time storage (correct):**
```typescript
// Store { price: 24000, time: 1735689600 }
// When chart zooms: we recalculate pixels from price/time
// Drawing follows the chart data → always correct!
```

### Drawing Persistence Strategy
```typescript
// Line 30-35: Use ref + state
const drawingsRef = useRef<Drawing[]>([]);  // Persist across re-renders
const [drawings, setDrawings] = useState<Drawing[]>([]); // Trigger updates

// Line 37-40: Sync ref with state
useEffect(() => {
  drawingsRef.current = drawings;
}, [drawings]);

// Line 108-133: redrawCanvas reads from ref
const redrawCanvas = () => {
  drawingsRef.current.forEach(drawing => {
    // Convert price/time → pixels → draw
  });
};
```

**Why both ref AND state?**
- **State:** Triggers React re-renders
- **Ref:** Stable reference in animation loop (doesn't cause re-renders)

---

## 💰 Trading System

### Paper Broker Implementation
**File:** `src/store/useAlgoAgentStore.ts` lines 100-200

**Features:**
1. **Virtual balance:** ₹10,00,000
2. **Margin calculation:** 
   ```typescript
   const margin = (price * quantity * 0.2); // 20% margin
   ```
3. **P&L tracking:**
   ```typescript
   const pnl = type === 'BUY' 
     ? (currentPrice - trade.price) * quantity
     : (trade.price - currentPrice) * quantity;
   ```
4. **Position management:**
   ```typescript
   // Open trades
   trades.filter(t => t.status === 'OPEN')
   
   // Close trade
   closePosition(tradeId, exitPrice) {
     trade.status = 'CLOSED';
     trade.exitPrice = exitPrice;
     trade.exitTimestamp = currentTime;
     trade.pnl = calculatePnL(trade);
   }
   ```

### Trade Markers on Chart
**File:** `src/App.tsx` lines 52-85

```typescript
const markers = useMemo(() => {
  return paperBroker.trades.map(trade => {
    const markers = [];
    
    // Entry marker
    markers.push({
      time: trade.timestamp,
      position: trade.type === 'BUY' ? 'belowBar' : 'aboveBar',
      color: trade.type === 'BUY' ? '#26a69a' : '#ef5350',
      shape: trade.type === 'BUY' ? 'arrowUp' : 'arrowDown',
      text: `${trade.type} @ ${trade.price.toFixed(2)}`
    });
    
    // Exit marker (only if closed)
    if (trade.status === 'CLOSED') {
      markers.push({
        time: trade.exitTimestamp,
        color: '#ff9800',
        shape: 'square',
        text: `EXIT @ ${trade.exitPrice.toFixed(2)}`
      });
    }
    
    return markers;
  }).flat();
}, [paperBroker.trades]);
```

---

## 🗺️ Component Hierarchy

```
App.tsx
├── Header
│   └── Trade button → opens TradePopup
│
├── LeftToolbar
│   └── Drawing tools selection
│
├── Chart Area
│   ├── TradingChart (TradingView Lightweight Charts)
│   ├── DrawingCanvas (overlay with z-10)
│   └── Quick Stats Overlay
│
├── ReplayController
│   └── Play/Pause/Step/Speed controls
│
├── RightSidebar
│   ├── Broker Tab
│   ├── Trading Tab (positions/orders)
│   ├── Backtest Tab
│   ├── AI Assistant Tab → Chatbot
│   └── Settings Tab
│
├── TradePopup (modal)
│   └── Order entry form
│
└── RiskRewardTool (modal)
    └── SL/TP calculator
```

---

## 🔄 Update Cycles

### Chart Update Flow
```
replay.currentIndex changes
  ↓
useMemo recalculates chartData
  ↓
useEffect detects chartData change
  ↓
chartRef.current.setData(newData)
  ↓
TradingView re-renders candles
  ↓
DrawingCanvas animation loop:
  - chartToPixel() uses new chart coordinates
  - Drawings redraw at new pixel positions
```

### Drawing Update Flow
```
User draws shape
  ↓
setDrawings([...prev, newDrawing])
  ↓
State update triggers:
  - drawingsRef.current = drawings
  - redrawCanvas dependencies update
  ↓
requestAnimationFrame loop:
  - Converts price/time → pixels
  - Clears canvas
  - Redraws all shapes
  ↓
Runs at 60fps continuously
```

---

## 🎯 Key Design Decisions

### 1. **Why Zustand over Redux?**
- Simpler API (no actions/reducers boilerplate)
- Smaller bundle size
- Works without Context Provider
- Perfect for small-to-medium apps

### 2. **Why Canvas over SVG/HTML for drawings?**
- Better performance (60fps with many shapes)
- Pixel-perfect rendering
- Easier to layer over TradingView chart
- Direct bitmap manipulation

### 3. **Why price/time coordinates?**
- Chart can zoom/scroll without breaking drawings
- Drawings anchored to actual price levels
- Professional trading platform behavior

### 4. **Why `requestAnimationFrame` over `setInterval`?**
- Syncs with browser paint (60fps)
- Pauses when tab inactive (saves CPU)
- Smoother animations
- Better performance

### 5. **Why refs AND state for drawings?**
- State: Triggers React updates when adding/removing
- Ref: Stable reference in animation loop (prevents infinite re-renders)

---

## 📁 File Structure Summary

```
src/
├── components/
│   ├── TradingChart.tsx        [Prebuilt wrapper]
│   ├── ReplayController.tsx    [Custom]
│   ├── DrawingCanvas.tsx       [Custom]
│   ├── LeftToolbar.tsx         [Custom]
│   ├── RightSidebar.tsx        [Custom]
│   ├── TradePopup.tsx          [Custom]
│   ├── RiskRewardTool.tsx      [Custom]
│   ├── Chatbot.tsx             [Custom]
│   └── Header.tsx              [Custom]
│
├── store/
│   └── useAlgoAgentStore.ts    [Custom Zustand store]
│
├── data/
│   └── dummyData.ts            [Custom OHLCV generator]
│
├── types/
│   └── index.ts                [Custom TypeScript interfaces]
│
└── App.tsx                     [Custom - main orchestrator]
```

---

## 🚀 How Everything Connects

1. **App.tsx** orchestrates everything:
   - Manages chart ref
   - Passes data to TradingChart
   - Overlays DrawingCanvas
   - Conditionally renders modals

2. **Zustand store** is the single source of truth:
   - All components read from it
   - Changes propagate automatically

3. **TradingChart** exposes methods via `useImperativeHandle`:
   - Parent can call `setData()`, `setMarkers()`
   - Parent can access `getChart()` for advanced operations

4. **DrawingCanvas** sits on top with `z-10`:
   - Transparent when cursor tool active
   - Interactive when drawing tool active
   - Always renders drawings at 60fps

5. **ReplayController** drives time:
   - Changes `replay.currentIndex`
   - App.tsx reacts → updates chart
   - Markers appear/disappear based on time

---

## 🎓 Learning Resources

**TradingView Lightweight Charts:**
- Docs: https://tradingview.github.io/lightweight-charts/
- Examples: https://tradingview.github.io/lightweight-charts/tutorials/

**Zustand:**
- Docs: https://docs.pmnd.rs/zustand/

**Canvas API:**
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

**React Hooks:**
- useRef: https://react.dev/reference/react/useRef
- useImperativeHandle: https://react.dev/reference/react/useImperativeHandle

---

## 📝 Summary

| Component | Type | Purpose |
|-----------|------|---------|
| TradingView Lightweight Charts | Prebuilt | Candlestick charting |
| Zustand | Prebuilt | State management |
| React | Prebuilt | UI framework |
| Vite | Prebuilt | Build tool |
| TailwindCSS | Prebuilt | Styling |
| **TradingChart** | **Custom wrapper** | Chart + tooltip + markers |
| **ReplayController** | **Custom** | Video player controls |
| **DrawingCanvas** | **Custom** | Canvas overlay with tools |
| **LeftToolbar** | **Custom** | Tool selection UI |
| **TradePopup** | **Custom** | Order entry form |
| **RiskRewardTool** | **Custom** | SL/TP calculator |
| **Paper Broker** | **Custom logic** | Virtual trading in Zustand |
| **OHLCV Data** | **Custom generator** | Random candle data |

**Total:**
- 5 prebuilt libraries
- 10+ custom components
- 1 custom state management layer
- 1 custom data generator

Everything connects through **Zustand** for state and **refs** for direct component communication!
