# Algo Agent Demo

A demo trading application with chart replay and paper trading features, built with React, TradingView Lightweight Charts, and TypeScript.

## Features

- **📊 Candlestick Chart**: Full-featured candlestick chart using TradingView Lightweight Charts v5
- **⏪ Chart Replay**: Go back in time and replay historical chart data
- **📝 Paper Trading**: Virtual trading broker to practice without real money
- **💰 Trade Tracking**: Real-time P&L calculation and trade history
- **🎛️ Speed Control**: Adjust replay speed (1x, 2x, 4x, 8x, 16x)
- **📱 Responsive Design**: TradingView-like professional UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to the Algo-Agent folder
cd Algo-Agent

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

## Usage

### Replay Feature

1. Use the **play/pause** button to start/stop chart replay
2. Use **step forward/backward** buttons to move one candle at a time
3. Use **skip** buttons to jump 10 candles
4. Drag the **progress slider** to jump to any point
5. Adjust **speed** (1x-16x) for faster replay

### Paper Trading

1. Click on **Broker** tab in the right sidebar
2. Connect **Paper Trading** broker
3. Switch to **Trading** tab
4. Use **BUY/SELL** buttons to place trades
5. View open positions and P&L in real-time
6. Close individual trades or close all at once

### Symbols Available

- NIFTY50
- BANK NIFTY  
- Reliance Industries
- TCS

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **Lightweight Charts v5** - TradingView Charts
- **Zustand** - State Management
- **Lucide React** - Icons

## Project Structure

```
Algo-Agent/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Top navigation bar
│   │   ├── TradingChart.tsx    # Candlestick chart component
│   │   ├── ReplayController.tsx # Playback controls
│   │   ├── RightSidebar.tsx    # Broker & trading panel
│   │   └── TradingPanel.tsx    # Trade execution & positions
│   ├── data/
│   │   └── dummyData.ts        # Mock OHLCV data generator
│   ├── store/
│   │   └── useAlgoAgentStore.ts # Zustand state management
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx                 # Main application
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Future Enhancements

- [ ] Add technical indicators (SMA, EMA, RSI, MACD)
- [ ] Strategy automation
- [ ] Real broker integration (Zerodha, Angel One, etc.)
- [ ] Advanced order types (Stop Loss, Take Profit)
- [ ] Performance analytics dashboard
- [ ] Export trade history

## License

MIT
