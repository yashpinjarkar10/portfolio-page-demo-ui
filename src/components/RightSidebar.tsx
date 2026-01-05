import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ClipboardList, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Zap,
  BarChart3,
  PlayCircle,
  Bot
} from 'lucide-react';
import { useAlgoAgentStore } from '@/store/useAlgoAgentStore';
import TradingPanel from './TradingPanel';
import Chatbot from './Chatbot';
import type { BrokerConfig } from '@/types';

const BROKERS: BrokerConfig[] = [
  { 
    id: 'paper', 
    name: 'Paper Trading', 
    logo: '📝', 
    color: '#2962ff', 
    available: true 
  },
  { 
    id: 'zerodha', 
    name: 'Zerodha', 
    logo: '🔶', 
    color: '#387ed1', 
    available: false 
  },
  { 
    id: 'angelone', 
    name: 'Angel One', 
    logo: '👼', 
    color: '#ff6b35', 
    available: false 
  },
  { 
    id: 'upstox', 
    name: 'Upstox', 
    logo: '📈', 
    color: '#7b2dff', 
    available: false 
  },
  { 
    id: 'fyers', 
    name: 'Fyers', 
    logo: '🎯', 
    color: '#00b386', 
    available: false 
  },
];

type TabType = 'broker' | 'trading' | 'backtest' | 'assistant' | 'settings';

const RightSidebar: React.FC = () => {
  const {
    rightPanelOpen,
    setRightPanelOpen,
    connectedBroker,
    setConnectedBroker,
    replay,
  } = useAlgoAgentStore();

  const [activeTab, setActiveTab] = useState<TabType>('broker');

  const handleBrokerConnect = (brokerId: string) => {
    if (brokerId === 'paper') {
      setConnectedBroker(connectedBroker === 'paper' ? null : 'paper');
    }
  };

  const tabs = [
    { id: 'broker' as const, icon: Wallet, label: 'Broker' },
    { id: 'trading' as const, icon: TrendingUp, label: 'Trading' },
    { id: 'backtest' as const, icon: BarChart3, label: 'Backtest' },
    { id: 'assistant' as const, icon: Bot, label: 'AI Assistant' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`
      h-full bg-dark-surface border-l border-dark-border
      transition-all duration-300 flex
      ${rightPanelOpen ? 'w-80' : 'w-12'}
    `}>
      {/* Collapsed sidebar with icons */}
      <div className="w-12 border-r border-dark-border flex flex-col py-2">
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-3 hover:bg-dark-border rounded mx-1 text-dark-muted hover:text-dark-text"
          title={rightPanelOpen ? 'Collapse' : 'Expand'}
        >
          {rightPanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        
        <div className="mt-2 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (!rightPanelOpen) setRightPanelOpen(true);
              }}
              className={`
                p-3 rounded mx-1 transition-colors
                ${activeTab === tab.id && rightPanelOpen
                  ? 'bg-accent-blue text-white'
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-border'
                }
              `}
              title={tab.label}
            >
              <tab.icon size={18} />
            </button>
          ))}
        </div>

        {/* Replay mode indicator */}
        {replay.isPlaying && (
          <div className="mt-auto p-3">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          </div>
        )}
      </div>

      {/* Expanded content */}
      {rightPanelOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab header */}
          <div className="p-4 border-b border-dark-border">
            <h2 className="text-lg font-medium text-dark-text flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.icon && 
                React.createElement(tabs.find(t => t.id === activeTab)!.icon, { size: 20 })
              }
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'broker' && (
              <div className="p-4">
                <div className="text-sm text-dark-muted mb-4">
                  Connect a broker to start trading during replay
                </div>

                <div className="space-y-3">
                  {BROKERS.map(broker => (
                    <button
                      key={broker.id}
                      onClick={() => handleBrokerConnect(broker.id)}
                      disabled={!broker.available}
                      className={`
                        w-full p-4 rounded-lg border transition-all
                        ${broker.available
                          ? connectedBroker === broker.id
                            ? 'border-accent-blue bg-accent-blue/10'
                            : 'border-dark-border hover:border-dark-muted bg-dark-bg'
                          : 'border-dark-border bg-dark-bg/50 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{broker.logo}</span>
                        <div className="flex-1 text-left">
                          <div className="text-dark-text font-medium">
                            {broker.name}
                          </div>
                          <div className="text-xs text-dark-muted">
                            {broker.available 
                              ? connectedBroker === broker.id 
                                ? 'Connected' 
                                : 'Click to connect'
                              : 'Coming Soon'
                            }
                          </div>
                        </div>
                        {connectedBroker === broker.id && (
                          <Check size={20} className="text-accent-green" />
                        )}
                        {!broker.available && (
                          <AlertCircle size={18} className="text-dark-muted" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Connection status card */}
                {connectedBroker && (
                  <div className="mt-6 p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
                    <div className="flex items-center gap-2 text-accent-blue mb-2">
                      <Zap size={18} />
                      <span className="font-medium">Ready to Trade</span>
                    </div>
                    <p className="text-sm text-dark-muted">
                      Paper broker connected. You can now place trades during chart replay.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trading' && <TradingPanel />}

            {activeTab === 'backtest' && (
              <div className="p-4">
                <div className="text-center py-12">
                  <PlayCircle size={48} className="mx-auto text-dark-muted mb-4" />
                  <h3 className="text-lg font-medium text-dark-text mb-2">
                    Manual Backtesting
                  </h3>
                  <p className="text-sm text-dark-muted mb-4">
                    Use the replay feature to manually test your trading strategies. 
                    Place trades as the chart plays and track your results.
                  </p>
                  <div className="bg-dark-bg p-4 rounded-lg text-left">
                    <h4 className="text-sm font-medium text-dark-text mb-2">How to use:</h4>
                    <ol className="text-sm text-dark-muted space-y-2">
                      <li>1. Connect Paper Broker</li>
                      <li>2. Start chart replay</li>
                      <li>3. Place BUY/SELL trades manually</li>
                      <li>4. Track your P&L in real-time</li>
                      <li>5. Reset to try again</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assistant' && (
              <div className="h-full flex flex-col -m-4">
                <Chatbot 
                  symbol={useAlgoAgentStore.getState().selectedSymbol} 
                  currentPrice={useAlgoAgentStore.getState().currentPrice} 
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="bg-dark-bg p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-dark-text mb-2">
                      Chart Settings
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-dark-muted">Show Volume</span>
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded border-dark-border"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-dark-muted">Show Grid</span>
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded border-dark-border"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="bg-dark-bg p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-dark-text mb-2">
                      Trading Settings
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-dark-muted block mb-1">
                          Default Quantity
                        </label>
                        <input 
                          type="number" 
                          defaultValue={1}
                          min={1}
                          className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2 text-dark-text"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-dark-muted mt-8">
                    Algo Agent Demo v1.0
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
