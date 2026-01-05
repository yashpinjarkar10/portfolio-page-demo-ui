import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  symbol: string;
  currentPrice: number;
}

const Chatbot: React.FC<ChatbotProps> = ({ symbol, currentPrice }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm your AI trading assistant. I can help you with:\n\n• **Market Analysis** - Get insights on ${symbol}\n• **Trading Strategies** - Learn about different approaches\n• **Risk Management** - Tips to protect your capital\n• **Technical Indicators** - Understand chart patterns\n\nHow can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: TrendingUp, label: 'Analyze trend', query: `What's the current trend for ${symbol}?` },
    { icon: AlertCircle, label: 'Risk tips', query: 'Give me risk management tips for day trading' },
    { icon: Lightbulb, label: 'Strategy', query: 'Suggest a trading strategy for current market' },
  ];

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('trend') || lowerMessage.includes('analysis')) {
      return `📊 **${symbol} Analysis**\n\nCurrent Price: ₹${currentPrice.toFixed(2)}\n\nBased on recent price action:\n• **Short-term**: The market shows moderate volatility\n• **Support Level**: ₹${(currentPrice * 0.98).toFixed(2)}\n• **Resistance Level**: ₹${(currentPrice * 1.02).toFixed(2)}\n\n💡 **Tip**: Watch for breakouts above resistance or breakdowns below support for potential trade opportunities.`;
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('management')) {
      return `🛡️ **Risk Management Tips**\n\n1. **Position Sizing**: Never risk more than 1-2% of your capital on a single trade\n\n2. **Stop Loss**: Always set a stop loss before entering\n   • Suggested: 1-1.5% below entry for long positions\n\n3. **Risk-Reward Ratio**: Aim for at least 1:2 (risk ₹1 to make ₹2)\n\n4. **Daily Loss Limit**: Stop trading if you lose 3% of capital in a day\n\n5. **Diversification**: Don't put all capital in one stock`;
    }
    
    if (lowerMessage.includes('strategy') || lowerMessage.includes('trading')) {
      return `📈 **Trading Strategy Suggestions**\n\n**1. Momentum Trading**\n• Entry: When price breaks above 20-period high\n• Exit: Trail stop at 2 ATR below price\n\n**2. Mean Reversion**\n• Entry: When RSI < 30 (oversold)\n• Exit: When RSI > 50\n\n**3. Breakout Trading**\n• Watch for consolidation patterns\n• Enter on volume breakout\n• Stop below the breakout candle\n\n🎯 **Current Context**: At ₹${currentPrice.toFixed(2)}, consider waiting for a clear setup before entering.`;
    }
    
    if (lowerMessage.includes('buy') || lowerMessage.includes('sell') || lowerMessage.includes('entry')) {
      return `⚠️ **Trade Recommendation**\n\nI can provide analysis but not financial advice. Here's what to consider:\n\n**For ${symbol} at ₹${currentPrice.toFixed(2)}:**\n\n• Check if price is near support (potential buy zone)\n• Look for confirmation from volume\n• Ensure risk-reward is favorable (1:2 minimum)\n• Set stop loss before entering\n\n🔔 **Remember**: This is a demo environment. Always do your own research before trading real money.`;
    }
    
    if (lowerMessage.includes('indicator') || lowerMessage.includes('technical')) {
      return `📉 **Key Technical Indicators**\n\n**1. Moving Averages**\n• SMA 20: Short-term trend\n• SMA 50: Medium-term trend\n• Golden Cross: Bullish signal\n\n**2. RSI (Relative Strength Index)**\n• Above 70: Overbought\n• Below 30: Oversold\n\n**3. MACD**\n• Signal line crossover for entries\n\n**4. Volume**\n• Confirm breakouts with high volume\n\n💡 Combine multiple indicators for better accuracy!`;
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `👋 Hello! Great to chat with you!\n\nI'm here to help you navigate the markets. You can ask me about:\n\n• Market analysis for ${symbol}\n• Trading strategies\n• Risk management\n• Technical indicators\n\nWhat would you like to know?`;
    }
    
    return `🤔 I understand you're asking about "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}"\n\nHere's what I can help with:\n\n• **"Analyze trend"** - Get ${symbol} analysis\n• **"Trading strategy"** - Strategy suggestions\n• **"Risk management"** - Protect your capital\n• **"Technical indicators"** - Learn chart analysis\n\nTry asking one of these or click the quick action buttons above!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateResponse(input);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="p-3 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Astryx AI</h3>
            <p className="text-xs text-dark-muted">Trading Assistant</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-dark-border">
        <div className="flex gap-1 flex-wrap">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.query)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-surface hover:bg-dark-border rounded-full transition-colors"
            >
              <action.icon size={12} className="text-accent-blue" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-accent-blue' 
                : 'bg-gradient-to-br from-purple-500 to-blue-500'
            }`}>
              {message.role === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-white" />
              )}
            </div>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === 'user'
                ? 'bg-accent-blue text-white'
                : 'bg-dark-surface'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.content.split('\n').map((line, i) => {
                  // Parse markdown-like formatting
                  let formattedLine = line;
                  
                  // Bold text
                  formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  
                  return (
                    <span 
                      key={i} 
                      dangerouslySetInnerHTML={{ __html: formattedLine }}
                      className="block"
                    />
                  );
                })}
              </div>
              <div className={`text-[10px] mt-1 ${
                message.role === 'user' ? 'text-blue-200' : 'text-dark-muted'
              }`}>
                {message.timestamp.toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-dark-surface rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about trading..."
            className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm focus:outline-none focus:border-accent-blue"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-3 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-dark-muted mt-2 text-center">
          Demo AI - Responses are simulated for demonstration
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
