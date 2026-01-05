import React, { useState } from 'react';
import { 
  MousePointer2, 
  Crosshair,
  TrendingUp,
  TrendingDown,
  Square,
  Circle,
  Type,
  Pencil,
  Ruler,
  Target,
  ArrowUpRight,
  Minus,
  Hash,
  Move,
  ZoomIn,
  Magnet,
  Eye,
  EyeOff,
  Trash2,
  Layers,
  Lock,
  Unlock,
  Copy,
  RotateCcw,
  ChevronDown,
  Triangle
} from 'lucide-react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';

type ToolCategory = 'cursor' | 'lines' | 'shapes' | 'text' | 'measure' | 'zoom';
type Tool = string;

interface ToolItem {
  id: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  shortcut?: string;
}

interface ToolGroup {
  id: ToolCategory;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  tools: ToolItem[];
}

const LeftToolbar: React.FC = () => {
  const { selectedTool, setSelectedTool } = useAlgoAgentStore();
  const [expandedGroup, setExpandedGroup] = useState<ToolCategory | null>(null);
  const [objectsVisible, setObjectsVisible] = useState(true);
  const [magnetEnabled, setMagnetEnabled] = useState(false);
  const [lockedDrawings, setLockedDrawings] = useState(false);

  const toolGroups: ToolGroup[] = [
    {
      id: 'cursor',
      icon: MousePointer2,
      label: 'Cursor Tools',
      tools: [
        { id: 'cursor', icon: MousePointer2, label: 'Cursor', shortcut: '' },
        { id: 'crosshair', icon: Crosshair, label: 'Crosshair', shortcut: '' },
        { id: 'dot', icon: Target, label: 'Dot', shortcut: '' },
      ]
    },
    {
      id: 'lines',
      icon: TrendingUp,
      label: 'Line Tools',
      tools: [
        { id: 'trendline', icon: TrendingUp, label: 'Trend Line', shortcut: 'Alt+T' },
        { id: 'ray', icon: ArrowUpRight, label: 'Ray', shortcut: 'Alt+R' },
        { id: 'extended', icon: Minus, label: 'Extended Line', shortcut: '' },
        { id: 'horizontal', icon: Minus, label: 'Horizontal Line', shortcut: 'Alt+H' },
        { id: 'vertical', icon: Minus, label: 'Vertical Line', shortcut: 'Alt+V' },
        { id: 'channel', icon: TrendingDown, label: 'Parallel Channel', shortcut: '' },
        { id: 'pitchfork', icon: Triangle, label: 'Pitchfork', shortcut: '' },
      ]
    },
    {
      id: 'shapes',
      icon: Square,
      label: 'Shapes',
      tools: [
        { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'Alt+Shift+R' },
        { id: 'circle', icon: Circle, label: 'Circle', shortcut: '' },
        { id: 'triangle', icon: Triangle, label: 'Triangle', shortcut: '' },
        { id: 'arrow', icon: ArrowUpRight, label: 'Arrow', shortcut: '' },
      ]
    },
    {
      id: 'text',
      icon: Type,
      label: 'Text & Annotations',
      tools: [
        { id: 'text', icon: Type, label: 'Text', shortcut: 'Alt+X' },
        { id: 'callout', icon: Type, label: 'Callout', shortcut: '' },
        { id: 'note', icon: Pencil, label: 'Note', shortcut: '' },
        { id: 'price-label', icon: Hash, label: 'Price Label', shortcut: '' },
      ]
    },
    {
      id: 'measure',
      icon: Ruler,
      label: 'Measurement Tools',
      tools: [
        { id: 'measure', icon: Ruler, label: 'Measure', shortcut: '' },
        { id: 'risk-reward', icon: Target, label: 'Long Position', shortcut: '' },
        { id: 'risk-reward-short', icon: Target, label: 'Short Position', shortcut: '' },
        { id: 'date-range', icon: Ruler, label: 'Date Range', shortcut: '' },
        { id: 'price-range', icon: Ruler, label: 'Price Range', shortcut: '' },
        { id: 'date-price-range', icon: Ruler, label: 'Date & Price Range', shortcut: '' },
      ]
    },
    {
      id: 'zoom',
      icon: ZoomIn,
      label: 'Zoom',
      tools: [
        { id: 'zoom-in', icon: ZoomIn, label: 'Zoom In', shortcut: '' },
        { id: 'zoom-out', icon: ZoomIn, label: 'Zoom Out', shortcut: '' },
      ]
    },
  ];

  const bottomActions = [
    { 
      id: 'magnet', 
      icon: Magnet, 
      label: 'Magnet Mode', 
      active: magnetEnabled,
      onClick: () => setMagnetEnabled(!magnetEnabled)
    },
    { 
      id: 'visibility', 
      icon: objectsVisible ? Eye : EyeOff, 
      label: objectsVisible ? 'Hide All Drawings' : 'Show All Drawings',
      active: !objectsVisible,
      onClick: () => setObjectsVisible(!objectsVisible)
    },
    { 
      id: 'lock', 
      icon: lockedDrawings ? Lock : Unlock, 
      label: lockedDrawings ? 'Unlock Drawings' : 'Lock Drawings',
      active: lockedDrawings,
      onClick: () => setLockedDrawings(!lockedDrawings)
    },
    { 
      id: 'delete', 
      icon: Trash2, 
      label: 'Remove Drawings',
      onClick: () => {
        if ((window as any).clearChartDrawings) {
          (window as any).clearChartDrawings();
        }
      }
    },
  ];

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setExpandedGroup(null);
  };

  const getSelectedToolFromGroup = (group: ToolGroup): ToolItem => {
    const selected = group.tools.find(t => t.id === selectedTool);
    return selected || group.tools[0];
  };

  const isGroupActive = (group: ToolGroup): boolean => {
    return group.tools.some(t => t.id === selectedTool);
  };

  return (
    <div className="w-11 bg-dark-surface border-r border-dark-border flex flex-col items-center py-2 h-full">
      {/* Main Tool Groups */}
      <div className="flex flex-col gap-0.5 w-full px-1">
        {toolGroups.map((group) => {
          const isActive = isGroupActive(group);
          const activeToolInGroup = getSelectedToolFromGroup(group);
          const IconComponent = isActive ? activeToolInGroup.icon : group.icon;
          
          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => {
                  if (expandedGroup === group.id) {
                    setExpandedGroup(null);
                  } else {
                    setExpandedGroup(group.id);
                  }
                }}
                onDoubleClick={() => handleToolSelect(group.tools[0].id)}
                className={`
                  w-9 h-9 flex items-center justify-center rounded transition-all group relative
                  ${isActive
                    ? 'bg-accent-blue text-white'
                    : 'text-dark-muted hover:text-white hover:bg-dark-hover'
                  }
                `}
                title={group.label}
              >
                <IconComponent size={18} />
                {/* Dropdown indicator */}
                <ChevronDown 
                  size={8} 
                  className="absolute bottom-0.5 right-0.5 opacity-50"
                />
              </button>

              {/* Expanded dropdown */}
              {expandedGroup === group.id && (
                <div className="absolute left-full top-0 ml-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 min-w-48 py-1">
                  <div className="px-3 py-1.5 text-xs text-dark-muted border-b border-dark-border mb-1">
                    {group.label}
                  </div>
                  {group.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className={`
                        w-full px-3 py-2 flex items-center gap-3 transition-colors
                        ${selectedTool === tool.id
                          ? 'bg-accent-blue/20 text-accent-blue'
                          : 'text-dark-text hover:bg-dark-hover'
                        }
                      `}
                    >
                      <tool.icon size={16} />
                      <span className="flex-1 text-left text-sm">{tool.label}</span>
                      {tool.shortcut && (
                        <span className="text-xs text-dark-muted">{tool.shortcut}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-7 h-px bg-dark-border my-3" />

      {/* Quick Actions */}
      <div className="flex flex-col gap-0.5 w-full px-1">
        {bottomActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`
              w-9 h-9 flex items-center justify-center rounded transition-all group relative
              ${action.active
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'text-dark-muted hover:text-white hover:bg-dark-hover'
              }
            `}
            title={action.label}
          >
            <action.icon size={16} />
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Object Tree */}
      <div className="w-full px-1 pb-1">
        <button
          className="w-9 h-9 flex items-center justify-center rounded text-dark-muted hover:text-white hover:bg-dark-hover transition-all group relative"
          title="Object Tree"
        >
          <Layers size={16} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
            Object Tree
          </span>
        </button>
      </div>
    </div>
  );
};

export default LeftToolbar;
