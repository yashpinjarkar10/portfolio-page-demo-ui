// Dummy OHLCV data generator for demo purposes
// Generates realistic stock market data with trends, volatility, and patterns

export interface OHLCVData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate random walk with trends
function generateRandomWalk(
  startPrice: number,
  numCandles: number,
  volatility: number = 0.02,
  trendBias: number = 0.0001
): OHLCVData[] {
  const data: OHLCVData[] = [];
  let currentPrice = startPrice;
  
  // Start from 6 months ago
  const startTime = Math.floor(Date.now() / 1000) - (180 * 24 * 60 * 60);
  const candleInterval = 5 * 60; // 5-minute candles
  
  for (let i = 0; i < numCandles; i++) {
    // Random trend changes
    const trendChange = (Math.random() - 0.5) * 0.001;
    const currentTrend = trendBias + trendChange;
    
    // Generate OHLC
    const change = (Math.random() - 0.5) * 2 * volatility + currentTrend;
    const open = currentPrice;
    const close = open * (1 + change);
    
    // High and Low with some wicks
    const wickSize = Math.random() * volatility * 0.5;
    const high = Math.max(open, close) * (1 + wickSize);
    const low = Math.min(open, close) * (1 - wickSize);
    
    // Volume with some randomness (higher on big moves)
    const priceChange = Math.abs(close - open) / open;
    const baseVolume = 100000 + Math.random() * 500000;
    const volume = baseVolume * (1 + priceChange * 10);
    
    data.push({
      time: startTime + (i * candleInterval),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
    });
    
    currentPrice = close;
  }
  
  return data;
}

// Generate data with patterns (support/resistance, breakouts)
function addPatterns(data: OHLCVData[]): OHLCVData[] {
  // Add some support/resistance bounces
  const supportLevel = Math.min(...data.slice(0, 100).map(d => d.low)) * 0.98;
  const resistanceLevel = Math.max(...data.slice(0, 100).map(d => d.high)) * 1.02;
  
  return data.map((candle, index) => {
    // Bounce off support
    if (candle.low < supportLevel) {
      const bounce = (supportLevel - candle.low) * 0.5;
      return {
        ...candle,
        low: supportLevel,
        close: candle.close + bounce,
        high: Math.max(candle.high, candle.close + bounce),
      };
    }
    
    // Rejection at resistance
    if (candle.high > resistanceLevel && index < data.length * 0.7) {
      const rejection = (candle.high - resistanceLevel) * 0.3;
      return {
        ...candle,
        high: resistanceLevel,
        close: candle.close - rejection,
        low: Math.min(candle.low, candle.close - rejection),
      };
    }
    
    return candle;
  });
}

// Pre-generated demo data for NIFTY50
export const NIFTY_DATA: OHLCVData[] = addPatterns(
  generateRandomWalk(22500, 2000, 0.003, 0.00005)
);

// Pre-generated demo data for RELIANCE
export const RELIANCE_DATA: OHLCVData[] = addPatterns(
  generateRandomWalk(2950, 2000, 0.004, 0.0001)
);

// Pre-generated demo data for TCS
export const TCS_DATA: OHLCVData[] = addPatterns(
  generateRandomWalk(4200, 2000, 0.0025, 0.00008)
);

// Pre-generated demo data for BANKNIFTY
export const BANKNIFTY_DATA: OHLCVData[] = addPatterns(
  generateRandomWalk(48500, 2000, 0.005, 0.00003)
);

// Symbol mapping
export const DEMO_SYMBOLS: Record<string, { name: string; data: OHLCVData[] }> = {
  'NIFTY50': { name: 'NIFTY 50', data: NIFTY_DATA },
  'BANKNIFTY': { name: 'BANK NIFTY', data: BANKNIFTY_DATA },
  'RELIANCE': { name: 'Reliance Industries', data: RELIANCE_DATA },
  'TCS': { name: 'Tata Consultancy Services', data: TCS_DATA },
};

// Get subset of data for replay (up to current index)
export function getReplayData(
  symbol: string,
  endIndex: number
): OHLCVData[] {
  const symbolData = DEMO_SYMBOLS[symbol];
  if (!symbolData) return [];
  return symbolData.data.slice(0, endIndex + 1);
}

// Get total candles available
export function getTotalCandles(symbol: string): number {
  return DEMO_SYMBOLS[symbol]?.data.length || 0;
}

// Format time to readable string
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default DEMO_SYMBOLS;
