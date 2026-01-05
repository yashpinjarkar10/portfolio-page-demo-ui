import React, { useState } from 'react';
import { 
  MousePointer2, 
  Pencil, 
  Square, 
  Type, 
  TrendingUp,
  Ruler,
  Link2,
  Eye,
  Trash2,
  Layers,
  MessageSquare,
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Chatbot from './Chatbot';

interface LeftSidebarProps {
  symbol: string;
  currentPrice: number;
}

type Tool = 'cursor' | 'crosshair' | 'draw' | 'trendline' | 'rectangle' | 'text' | 'measure' | 'magnet';

const LeftSidebar: React.FC<LeftSidebarProps> = ({ symbol, currentPrice }) => {
  const [selectedTool, setSelectedTool] = useState<Tool>('crosshair');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const tools = [
    { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
    { id: 'crosshair', icon: Pencil, label: 'Crosshair' },
    { id: 'trendline', icon: TrendingUp, label: 'Trend Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'measure', icon: Ruler, label: 'Measure' },
    { id: 'magnet', icon: Link2, label: 'Magnet' },
  ];

  const bottomTools = [
    { id: 'visibility', icon: Eye, label: 'Visibility' },
    { id: 'delete', icon: Trash2, label: 'Delete' },
    { id: 'layers', icon: Layers, label: 'Object Tree' },
  ];

  return (
    <>
      {/* Tools Sidebar */}
      <div className="w-10 bg-dark-surface border-r border-dark-border flex flex-col items-center py-2 relative h-full">
        {/* Drawing Tools */}
        <div className="flex flex-col gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id as Tool)}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors group relative ${
                selectedTool === tool.id
                  ? 'bg-accent-blue text-white'
                  : 'text-dark-muted hover:text-white hover:bg-dark-border'
              }`}
              title={tool.label}
            >
              <tool.icon size={16} />
              <span className="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-6 h-px bg-dark-border my-2" />

        {/* AI Chatbot Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors group relative ${
            isChatOpen
              ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
              : 'text-dark-muted hover:text-white hover:bg-dark-border'
          }`}
          title="AI Assistant"
        >
          <Bot size={18} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            AI Assistant
          </span>
          {/* Notification dot */}
          {!isChatOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          )}
        </button>

        <div className="flex-1" />

        {/* Bottom Tools */}
        <div className="flex flex-col gap-1">
          {bottomTools.map((tool) => (
            <button
              key={tool.id}
              className="w-8 h-8 flex items-center justify-center rounded text-dark-muted hover:text-white hover:bg-dark-border transition-colors group relative"
              title={tool.label}
            >
              <tool.icon size={16} />
              <span className="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chatbot Panel */}
      <div 
        className={`fixed left-10 top-14 bottom-0 w-80 bg-dark-bg border-r border-dark-border shadow-2xl z-40 transition-transform duration-300 ${
          isChatOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={() => setIsChatOpen(false)}
            className="absolute -right-6 top-4 w-6 h-12 bg-dark-surface border border-dark-border border-l-0 rounded-r flex items-center justify-center text-dark-muted hover:text-white transition-colors z-50"
          >
            <ChevronLeft size={14} />
          </button>
          
          <Chatbot symbol={symbol} currentPrice={currentPrice} />
        </div>
      </div>

      {/* Overlay when chat is open */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsChatOpen(false)}
          style={{ left: '330px', top: '56px' }}
        />
      )}
    </>
  );
};

export default LeftSidebar;
