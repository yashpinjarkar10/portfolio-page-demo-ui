import React, { useRef, useEffect, useMemo, useState } from 'react';
import TradingChart, { type TradingChartRef } from './components/TradingChart';
import ReplayController from './components/ReplayController';
import RightSidebar from './components/RightSidebar';
import LeftToolbar from './components/LeftToolbar';
import Header from './components/Header';
import TradePopup from './components/TradePopup';
import RiskRewardTool from './components/RiskRewardTool';
import DrawingCanvas from './components/DrawingCanvas';
import { useAlgoAgentStore } from './store/useAlgoAgentStore';
import { getReplayData, DEMO_SYMBOLS } from './data/dummyData';
import type { ChartMarker } from './types';

const App: React.FC = () => {
  const chartRef = useRef<TradingChartRef>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(500);
  const [chartWidth, setChartWidth] = useState(800);
  const [isTradePopupOpen, setIsTradePopupOpen] = useState(false);
  const [riskRewardType, setRiskRewardType] = useState<'long' | 'short' | null>(null);
  
  const {
    selectedSymbol,
    replay,
    paperBroker,
    currentPrice,
    selectedTool,
    setSelectedTool,
    setCurrentPrice,
  } = useAlgoAgentStore();

  // Calculate chart height on mount and resize
  useEffect(() => {
    const updateSize = () => {
      // Header: 56px, ReplayController: ~52px, some padding
      setChartHeight(window.innerHeight - 120);
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.clientWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Get current data slice for replay
  const chartData = useMemo(() => {
    return getReplayData(selectedSymbol, replay.currentIndex);
  }, [selectedSymbol, replay.currentIndex]);

  // Generate markers from trades - only show markers up to current replay index
  const markers = useMemo((): ChartMarker[] => {
    const currentData = DEMO_SYMBOLS[selectedSymbol]?.data;
    if (!currentData) return [];
    
    const currentTimestamp = currentData[replay.currentIndex]?.time;
    if (!currentTimestamp) return [];

    return paperBroker.trades
      .filter(t => t.symbol === selectedSymbol)
      .filter(t => t.timestamp <= currentTimestamp) // Only show trades up to current time
      .flatMap(trade => {
        const markers: ChartMarker[] = [];
        
        // Entry marker
        if (trade.timestamp <= currentTimestamp) {
          markers.push({
            time: trade.timestamp,
            position: trade.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: trade.type === 'BUY' ? '#26a69a' : '#ef5350',
            shape: trade.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${trade.type} @ ${trade.price.toFixed(2)}`,
            size: 1,
          });
        }

        // Exit marker - only show if exit happened and we've reached that time
        if (trade.status === 'CLOSED' && trade.exitTimestamp && trade.exitTimestamp <= currentTimestamp) {
          markers.push({
            time: trade.exitTimestamp,
            position: trade.type === 'BUY' ? 'aboveBar' : 'belowBar',
            color: '#ff9800',
            shape: 'square',
            text: `EXIT @ ${trade.exitPrice?.toFixed(2)}`,
            size: 1,
          });
        }

        return markers;
      });
  }, [paperBroker.trades, selectedSymbol, replay.currentIndex]);

  // Update chart when data changes
  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      chartRef.current.setData(chartData);
      
      // Update current price
      const lastCandle = chartData[chartData.length - 1];
      if (lastCandle) {
        setCurrentPrice(lastCandle.close);
      }
      
      // Scroll to right during playback
      if (replay.isPlaying) {
        chartRef.current.scrollToRight();
      }
    }
  }, [chartData, replay.isPlaying, setCurrentPrice]);

  // Update markers
  useEffect(() => {
    if (chartRef.current && markers.length > 0) {
      chartRef.current.setMarkers(markers);
    }
  }, [markers]);

  // Handle risk-reward tool selection from LeftToolbar
  useEffect(() => {
    if (selectedTool === 'risk-reward') {
      setRiskRewardType('long');
      setSelectedTool('crosshair');
    } else if (selectedTool === 'risk-reward-short') {
      setRiskRewardType('short');
      setSelectedTool('crosshair');
    }
  }, [selectedTool, setSelectedTool]);

  return (
    <div className="h-screen flex flex-col bg-dark-bg text-dark-text overflow-hidden">
      {/* Header */}
      <Header onTradeClick={() => setIsTradePopupOpen(true)} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <LeftToolbar />

        {/* Chart area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart */}
          <div ref={chartContainerRef} className="flex-1 relative">
            <TradingChart
              ref={chartRef}
              height={chartHeight}
              showVolume={true}
            />

            {/* Drawing Canvas Overlay */}
            <DrawingCanvas 
              chartRef={chartRef}
              width={chartWidth}
              height={chartHeight}
            />

            {/* Quick stats overlay */}
            <div className="absolute top-4 left-4 flex gap-2 z-20 pointer-events-none">
              <div className="bg-dark-surface/90 backdrop-blur-sm px-3 py-2 rounded border border-dark-border">
                <div className="text-xs text-dark-muted">Symbol</div>
                <div className="text-sm font-medium text-dark-text">{selectedSymbol}</div>
              </div>
              <div className="bg-dark-surface/90 backdrop-blur-sm px-3 py-2 rounded border border-dark-border">
                <div className="text-xs text-dark-muted">Timeframe</div>
                <div className="text-sm font-medium text-dark-text">5 Min</div>
              </div>
              {/* Selected tool indicator */}
              {!['cursor', 'crosshair', 'dot'].includes(selectedTool) && (
                <div className="bg-accent-blue/20 backdrop-blur-sm px-3 py-2 rounded border border-accent-blue/30">
                  <div className="text-xs text-accent-blue">Tool</div>
                  <div className="text-sm font-medium text-accent-blue capitalize">{selectedTool.replace('-', ' ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Replay controls */}
          <ReplayController />
        </div>

        {/* Right sidebar */}
        <RightSidebar />
      </div>

      {/* Trade Popup */}
      <TradePopup
        isOpen={isTradePopupOpen}
        onClose={() => setIsTradePopupOpen(false)}
        currentPrice={currentPrice}
        symbol={selectedSymbol}
      />

      {/* Risk Reward Tool */}
      <RiskRewardTool
        isOpen={riskRewardType !== null}
        onClose={() => setRiskRewardType(null)}
        type={riskRewardType || 'long'}
        entryPrice={currentPrice}
        chartHeight={chartHeight}
      />
    </div>
  );
};

export default App;
