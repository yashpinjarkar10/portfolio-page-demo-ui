import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';

interface ChartPoint {
  price: number;
  time: number;
}

interface PixelPoint {
  x: number;
  y: number;
}

interface Drawing {
  id: string;
  type: string;
  points: ChartPoint[]; // Store in price/time coordinates
  color: string;
  lineWidth: number;
}

interface DrawingCanvasProps {
  chartRef: React.RefObject<{ 
    getChart: () => any;
    getCandleSeries: () => any;
  }>;
  width: number;
  height: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ chartRef, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingsRef = useRef<Drawing[]>([]); // Persist drawings in ref
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startChartPoint, setStartChartPoint] = useState<ChartPoint | null>(null);
  
  const { selectedTool, setSelectedTool } = useAlgoAgentStore();

  // Sync ref with state
  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  // Tools that support drawing
  const drawingTools = [
    'trendline', 'ray', 'extended', 'horizontal', 'vertical', 'channel',
    'rectangle', 'circle', 'triangle', 'arrow',
    'text', 'callout', 'note', 'price-label',
    'measure', 'date-range', 'price-range'
  ];

  const isDrawingTool = drawingTools.includes(selectedTool);

  // Get color based on tool type
  const getToolColor = (tool: string): string => {
    if (tool.includes('risk-reward')) return '#10b981';
    if (tool.includes('measure') || tool.includes('range')) return '#f59e0b';
    if (['rectangle', 'circle', 'triangle'].includes(tool)) return '#8b5cf6';
    return '#3b82f6';
  };

  // Convert pixel coordinates to chart coordinates (price/time)
  const pixelToChart = useCallback((x: number, y: number): ChartPoint | null => {
    const chart = chartRef.current?.getChart();
    const series = chartRef.current?.getCandleSeries();
    if (!chart || !series) return null;

    try {
      const timeScale = chart.timeScale();
      const time = timeScale.coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      
      if (time === null || price === null) return null;
      
      return { 
        price, 
        time: typeof time === 'number' ? time : Number(time) 
      };
    } catch {
      return null;
    }
  }, [chartRef]);

  // Convert chart coordinates to pixel coordinates
  const chartToPixel = useCallback((point: ChartPoint): PixelPoint | null => {
    const chart = chartRef.current?.getChart();
    const series = chartRef.current?.getCandleSeries();
    if (!chart || !series) return null;

    try {
      const timeScale = chart.timeScale();
      const x = timeScale.timeToCoordinate(point.time);
      const y = series.priceToCoordinate(point.price);
      
      if (x === null || y === null) return null;
      
      return { x, y };
    } catch {
      return null;
    }
  }, [chartRef]);

  // Draw all drawings on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chart = chartRef.current?.getChart();
    const series = chartRef.current?.getCandleSeries();
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Don't draw if chart isn't ready
    if (!chart || !series) return;

    // Draw all saved drawings using ref for stable access
    drawingsRef.current.forEach(drawing => {
      const pixelPoints = drawing.points
        .map(p => chartToPixel(p))
        .filter((p): p is PixelPoint => p !== null);
      
      if (pixelPoints.length > 0) {
        drawShape(ctx, drawing.type, pixelPoints, drawing.color, drawing.lineWidth);
      }
    });

    // Draw current drawing in progress
    if (currentDrawing) {
      const pixelPoints = currentDrawing.points
        .map(p => chartToPixel(p))
        .filter((p): p is PixelPoint => p !== null);
      
      if (pixelPoints.length > 0) {
        drawShape(ctx, currentDrawing.type, pixelPoints, currentDrawing.color, currentDrawing.lineWidth);
      }
    }
  }, [currentDrawing, width, height, chartToPixel, chartRef]);

  // Draw a shape based on its type
  const drawShape = (
    ctx: CanvasRenderingContext2D, 
    type: string, 
    points: PixelPoint[], 
    color: string, 
    lineWidth: number
  ) => {
    if (points.length < 1) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const [p1, p2] = points;

    switch (type) {
      case 'trendline':
      case 'ray':
      case 'extended':
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          // Draw endpoints
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'horizontal':
        if (p1) {
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(0, p1.y);
          ctx.lineTo(width, p1.y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Price label
          ctx.fillStyle = color;
          ctx.fillRect(width - 70, p1.y - 10, 70, 20);
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
        }
        break;

      case 'vertical':
        if (p1) {
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(p1.x, 0);
          ctx.lineTo(p1.x, height);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;

      case 'rectangle':
        if (p1 && p2) {
          ctx.beginPath();
          ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
          ctx.fillStyle = color + '20';
          ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        }
        break;

      case 'circle':
        if (p1 && p2) {
          const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = color + '20';
          ctx.fill();
        }
        break;

      case 'triangle':
        if (p1 && p2) {
          const midX = (p1.x + p2.x) / 2;
          ctx.beginPath();
          ctx.moveTo(midX, p1.y);
          ctx.lineTo(p1.x, p2.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = color + '20';
          ctx.fill();
        }
        break;

      case 'arrow':
        if (p1 && p2) {
          const headLen = 15;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
        break;

      case 'risk-reward':
      case 'risk-reward-short':
        if (p1 && p2) {
          const isLong = type === 'risk-reward';
          const entryY = p1.y;
          const targetY = isLong ? Math.min(p1.y, p2.y) : Math.max(p1.y, p2.y);
          const stopY = isLong ? Math.max(p1.y, p2.y) : Math.min(p1.y, p2.y);
          
          // Entry line (blue)
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          ctx.moveTo(p1.x, entryY);
          ctx.lineTo(p2.x, entryY);
          ctx.stroke();
          
          // Take Profit zone (green)
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(p1.x, targetY, p2.x - p1.x, entryY - targetY);
          ctx.strokeStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(p1.x, targetY);
          ctx.lineTo(p2.x, targetY);
          ctx.stroke();
          
          // Stop Loss zone (red)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(p1.x, entryY, p2.x - p1.x, stopY - entryY);
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(p1.x, stopY);
          ctx.lineTo(p2.x, stopY);
          ctx.stroke();
          
          // Labels
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#10b981';
          ctx.fillText('TP', p1.x + 5, targetY + 14);
          ctx.fillStyle = '#3b82f6';
          ctx.fillText('Entry', p1.x + 5, entryY - 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillText('SL', p1.x + 5, stopY - 5);
        }
        break;

      case 'measure':
      case 'date-range':
      case 'price-range':
        if (p1 && p2) {
          // Measure box
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#f59e0b';
          ctx.beginPath();
          ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
          ctx.setLineDash([]);
          
          // Diagonal line
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          // Stats label
          const dx = Math.abs(p2.x - p1.x);
          const dy = Math.abs(p2.y - p1.y);
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.fillRect(midX - 40, midY - 12, 80, 24);
          ctx.fillStyle = '#fff';
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${dx.toFixed(0)} × ${dy.toFixed(0)}`, midX, midY + 4);
        }
        break;

      case 'text':
      case 'callout':
      case 'note':
      case 'price-label':
        if (p1) {
          ctx.fillStyle = color;
          ctx.fillRect(p1.x, p1.y - 15, 60, 20);
          ctx.fillStyle = '#fff';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Text', p1.x + 30, p1.y - 2);
        }
        break;
    }
  };

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingTool) return;

    e.stopPropagation(); // Prevent chart click handler

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const chartPoint = pixelToChart(x, y);
    if (!chartPoint) return;

    setStartChartPoint(chartPoint);
    setIsDrawing(true);

    // For single-point tools
    if (['horizontal', 'vertical', 'text', 'callout', 'note', 'price-label'].includes(selectedTool)) {
      const newDrawing: Drawing = {
        id: `drawing-${Date.now()}`,
        type: selectedTool,
        points: [chartPoint],
        color: getToolColor(selectedTool),
        lineWidth: 2,
      };
      setDrawings(prev => [...prev, newDrawing]);
      setIsDrawing(false);
      setStartChartPoint(null);
      // Reset to cursor after placing
      setSelectedTool('crosshair');
    } else {
      setCurrentDrawing({
        id: `drawing-${Date.now()}`,
        type: selectedTool,
        points: [chartPoint],
        color: getToolColor(selectedTool),
        lineWidth: 2,
      });
    }
  }, [isDrawingTool, selectedTool, pixelToChart, setSelectedTool]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startChartPoint || !currentDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const chartPoint = pixelToChart(x, y);
    if (!chartPoint) return;

    setCurrentDrawing({
      ...currentDrawing,
      points: [startChartPoint, chartPoint],
    });
  }, [isDrawing, startChartPoint, currentDrawing, pixelToChart]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentDrawing) return;

    e.stopPropagation(); // Prevent chart click handler

    if (currentDrawing.points.length >= 2) {
      setDrawings(prev => [...prev, currentDrawing]);
    }

    setIsDrawing(false);
    setCurrentDrawing(null);
    setStartChartPoint(null);
    
    // Reset to cursor after drawing
    setSelectedTool('crosshair');
  }, [isDrawing, currentDrawing, setSelectedTool]);

  // Subscribe to chart updates to redraw when chart scrolls/zooms
  useEffect(() => {
    const chart = chartRef.current?.getChart();
    if (!chart) return;

    const timeScale = chart.timeScale();
    
    const handleVisibleRangeChange = () => {
      redrawCanvas();
    };

    timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    
    // Also redraw on any chart size change
    const handleResize = () => {
      redrawCanvas();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [chartRef, redrawCanvas]);

  // Redraw when drawings change or tool changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, selectedTool]);

  // Update canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      redrawCanvas();
    }
  }, [width, height, redrawCanvas]);

  // Always redraw continuously to keep drawings synchronized with chart
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      redrawCanvas();
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [redrawCanvas]);

  // Clear all drawings
  const clearDrawings = useCallback(() => {
    setDrawings([]);
    setCurrentDrawing(null);
  }, []);

  // Expose clear function globally
  useEffect(() => {
    (window as any).clearChartDrawings = clearDrawings;
    return () => {
      delete (window as any).clearChartDrawings;
    };
  }, [clearDrawings]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-10 ${isDrawingTool ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDrawing && currentDrawing && currentDrawing.points.length >= 2) {
          setDrawings(prev => [...prev, currentDrawing]);
        }
        setIsDrawing(false);
        setCurrentDrawing(null);
        setStartChartPoint(null);
      }}
    />
  );
};

export default DrawingCanvas;
