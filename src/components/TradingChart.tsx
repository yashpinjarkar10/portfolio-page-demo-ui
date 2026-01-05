import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  createSeriesMarkers,
} from 'lightweight-charts';
import type { OHLCVData, ChartMarker } from '@/types';

interface ChartColors {
  bg: string;
  text: string;
  grid: string;
  border: string;
}

const DARK_COLORS: ChartColors = {
  bg: '#131722',
  text: '#d1d4dc',
  grid: '#1e222d',
  border: '#2a2e39',
};

const CANDLE_COLORS = {
  up: '#26a69a',
  down: '#ef5350',
};

export interface TradingChartRef {
  setData: (data: OHLCVData[]) => void;
  setMarkers: (markers: ChartMarker[]) => void;
  clearMarkers: () => void;
  fitContent: () => void;
  scrollToRight: () => void;
  getChart: () => IChartApi | null;
  getCandleSeries: () => ISeriesApi<'Candlestick'> | null;
}

interface TradingChartProps {
  height?: number;
  showVolume?: boolean;
  onCrosshairMove?: (price: number | null, time: number | null) => void;
}

const TradingChart = forwardRef<TradingChartRef, TradingChartProps>(
  ({ height = 500, showVolume = true, onCrosshairMove }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const markersPrimitiveRef = useRef<ReturnType<typeof createSeriesMarkers> | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    // Format time to IST
    const formatTimeIST = useCallback((timestamp: number): string => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }, []);

    // Set data
    const setData = useCallback((data: OHLCVData[]) => {
      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(data as CandlestickData<Time>[]);
      }
      if (volumeSeriesRef.current && showVolume) {
        volumeSeriesRef.current.setData(
          data.map(x => ({
            time: x.time as Time,
            value: x.volume || 0,
            color: x.close >= x.open 
              ? 'rgba(38, 166, 154, 0.3)' 
              : 'rgba(239, 83, 80, 0.3)',
          }))
        );
      }
    }, [showVolume]);

    // Set markers
    const setMarkers = useCallback((markers: ChartMarker[]) => {
      if (!candleSeriesRef.current || !markers.length) return;
      
      const sorted = [...markers].sort((a, b) => a.time - b.time);
      
      if (markersPrimitiveRef.current) {
        markersPrimitiveRef.current.setMarkers([]);
      }
      
      markersPrimitiveRef.current = createSeriesMarkers(
        candleSeriesRef.current, 
        sorted.map(m => ({
          time: m.time as Time,
          position: m.position,
          color: m.color,
          shape: m.shape,
          text: m.text,
          size: m.size || 1,
        }))
      );
    }, []);

    // Clear markers
    const clearMarkers = useCallback(() => {
      if (markersPrimitiveRef.current) {
        markersPrimitiveRef.current.setMarkers([]);
      }
    }, []);

    // Fit content
    const fitContent = useCallback(() => {
      chartRef.current?.timeScale().fitContent();
    }, []);

    // Scroll to right
    const scrollToRight = useCallback(() => {
      chartRef.current?.timeScale().scrollToRealTime();
    }, []);

    // Get chart instance
    const getChart = useCallback(() => chartRef.current, []);

    // Get candle series
    const getCandleSeries = useCallback(() => candleSeriesRef.current, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      setData,
      setMarkers,
      clearMarkers,
      fitContent,
      scrollToRight,
      getChart,
      getCandleSeries,
    }), [setData, setMarkers, clearMarkers, fitContent, scrollToRight, getChart, getCandleSeries]);

    // Initialize chart
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: height,
        layout: {
          background: { type: ColorType.Solid, color: DARK_COLORS.bg },
          textColor: DARK_COLORS.text,
        },
        grid: {
          vertLines: { color: DARK_COLORS.grid, visible: true },
          horzLines: { color: DARK_COLORS.grid, visible: true },
        },
        rightPriceScale: {
          borderColor: DARK_COLORS.border,
          scaleMargins: { top: 0.05, bottom: showVolume ? 0.2 : 0.05 },
        },
        timeScale: {
          borderColor: DARK_COLORS.border,
          timeVisible: true,
          secondsVisible: false,
          fixLeftEdge: false,
          fixRightEdge: false,
          lockVisibleTimeRangeOnResize: true,
          rightBarStaysOnScroll: true,
          shiftVisibleRangeOnNewBar: true,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            labelBackgroundColor: '#2962ff',
          },
          horzLine: {
            labelBackgroundColor: '#2962ff',
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false,
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
          axisDoubleClickReset: {
            time: true,
            price: true,
          },
          mouseWheel: true,
          pinch: true,
        },
        kineticScroll: {
          mouse: true,
          touch: true,
        },
      });

      chartRef.current = chart;

      // Add candle series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: CANDLE_COLORS.up,
        downColor: CANDLE_COLORS.down,
        borderVisible: false,
        wickUpColor: CANDLE_COLORS.up,
        wickDownColor: CANDLE_COLORS.down,
      });
      candleSeriesRef.current = candleSeries;

      // Add volume series
      if (showVolume) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: CANDLE_COLORS.up,
          priceFormat: { type: 'volume' },
          priceScaleId: 'vol',
        });
        chart.priceScale('vol').applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;
      }

      // Add tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        display: none;
        padding: 8px 12px;
        font-size: 12px;
        z-index: 100;
        background: rgba(30, 34, 45, 0.95);
        color: #d1d4dc;
        border: 1px solid #2a2e39;
        border-radius: 4px;
        pointer-events: none;
        font-family: 'Consolas', monospace;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      container.appendChild(tooltip);
      tooltipRef.current = tooltip;

      chart.subscribeCrosshairMove(param => {
        if (!param.time || !param.point) {
          tooltip.style.display = 'none';
          onCrosshairMove?.(null, null);
          return;
        }

        const data = param.seriesData.get(candleSeries) as CandlestickData;
        if (data) {
          const timeNum = typeof param.time === 'number' ? param.time : Number(param.time);
          const timeStr = formatTimeIST(timeNum);
          const change = data.close - data.open;
          const changePercent = (change / data.open) * 100;
          const isUp = data.close >= data.open;

          tooltip.style.display = 'block';
          tooltip.innerHTML = `
            <div style="margin-bottom: 6px; color: #787b86;">${timeStr}</div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
              <span style="color: #787b86;">O</span><span>${data.open.toFixed(2)}</span>
              <span style="color: #787b86;">H</span><span style="color: ${CANDLE_COLORS.up}">${data.high.toFixed(2)}</span>
              <span style="color: #787b86;">L</span><span style="color: ${CANDLE_COLORS.down}">${data.low.toFixed(2)}</span>
              <span style="color: #787b86;">C</span><span style="color: ${isUp ? CANDLE_COLORS.up : CANDLE_COLORS.down}">${data.close.toFixed(2)}</span>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #2a2e39; color: ${isUp ? CANDLE_COLORS.up : CANDLE_COLORS.down}">
              ${isUp ? '+' : ''}${change.toFixed(2)} (${isUp ? '+' : ''}${changePercent.toFixed(2)}%)
            </div>
          `;
          
          const x = Math.min(param.point.x + 16, container.clientWidth - 180);
          const y = Math.min(param.point.y + 16, container.clientHeight - 160);
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;

          onCrosshairMove?.(data.close, timeNum);
        }
      });

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        chart.applyOptions({
          width: container.clientWidth,
          height: height,
        });
      });
      resizeObserver.observe(container);

      // Cleanup
      return () => {
        resizeObserver.disconnect();
        tooltipRef.current?.remove();
        chart.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      };
    }, [height, showVolume, formatTimeIST, onCrosshairMove]);

    return (
      <div 
        ref={containerRef} 
        className="relative w-full"
        style={{ height }}
      />
    );
  }
);

TradingChart.displayName = 'TradingChart';

export default TradingChart;
