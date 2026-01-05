// Types for the Algo Agent Demo

import type { ISeriesApi } from 'lightweight-charts';

export interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  status: 'OPEN' | 'CLOSED';
  exitPrice?: number;
  exitTimestamp?: number;
  pnl?: number;
  pnlPercent?: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface BrokerAccount {
  id: string;
  name: string;
  type: 'PAPER' | 'LIVE';
  balance: number;
  equity: number;
  margin: number;
  availableMargin: number;
  positions: Position[];
  trades: Trade[];
  connected: boolean;
}

export interface ReplayState {
  isPlaying: boolean;
  speed: number; // 1x, 2x, 4x, 8x
  currentIndex: number;
  totalCandles: number;
  currentTime: number;
}

export interface ChartMarker {
  time: number;
  position: 'belowBar' | 'aboveBar' | 'inBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  text: string;
  size?: number;
}

export interface IndicatorConfig {
  period?: number;
  color?: string;
  mult?: number;
  [key: string]: unknown;
}

export interface IndicatorInstance {
  type: string;
  def: IndicatorDefinition;
  cfg: IndicatorConfig;
  series: ISeriesApi<'Line'> | ISeriesApi<'Histogram'> | Record<string, ISeriesApi<'Line' | 'Histogram'>>;
  isOverlay: boolean;
  scaleId: string;
}

export interface IndicatorDefinition {
  pane: 'overlay' | 'sep';
  render: 'line' | 'hist' | 'composite';
  defaults: IndicatorConfig;
  calc: (data: OHLCVData[], cfg: IndicatorConfig) => unknown;
  lines?: { k: string; color?: string; type?: string; width?: number; style?: number }[];
}

// Broker types
export type BrokerType = 'paper' | 'zerodha' | 'angelone' | 'upstox' | 'fyers';

export interface BrokerConfig {
  id: BrokerType;
  name: string;
  logo: string;
  color: string;
  available: boolean;
}
