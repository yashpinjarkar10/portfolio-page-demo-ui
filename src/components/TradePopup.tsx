import React, { useState, useEffect } from 'react';
import { X, Maximize2, Plus, Minus, ChevronDown } from 'lucide-react';
import { useAlgoAgentStore } from '../store/useAlgoAgentStore';

interface TradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  symbol: string;
}

type OrderType = 'LIMIT' | 'MARKET' | 'STOP' | 'STOPLIMIT';
type OrderValidity = 'IOC' | 'DAY';
type Variety = 'regular' | 'amo' | 'co' | 'iceberg';
type ProductType = 'NRML' | 'MIS' | 'CNC';

const TradePopup: React.FC<TradePopupProps> = ({ isOpen, onClose, currentPrice, symbol }) => {
  const { paperBroker } = useAlgoAgentStore();
  
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [limitPrice, setLimitPrice] = useState(currentPrice || 0);
  const [stopPrice, setStopPrice] = useState(currentPrice || 0);
  const [quantity, setQuantity] = useState(1);
  const [validity, setValidity] = useState<OrderValidity>('DAY');
  const [variety, setVariety] = useState<Variety>('regular');
  const [productType, setProductType] = useState<ProductType>('NRML');
  const [disclosedQty, setDisclosedQty] = useState(0);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const spread = 0.2;
  const sellPrice = ((currentPrice || 0) - spread / 2).toFixed(1);
  const buyPrice = ((currentPrice || 0) + spread / 2).toFixed(1);

  const lotSizes = [1, 5, 25, 100, 500];

  useEffect(() => {
    if (currentPrice && currentPrice > 0) {
      setLimitPrice(currentPrice);
      setStopPrice(currentPrice);
    }
  }, [currentPrice]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.popup-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handlePlaceOrder = () => {
    const orderDetails = {
      symbol,
      side,
      orderType,
      price: orderType === 'MARKET' ? currentPrice : limitPrice,
      stopPrice: orderType === 'STOP' || orderType === 'STOPLIMIT' ? stopPrice : undefined,
      quantity,
      validity,
      variety,
      productType,
      disclosedQty
    };
    
    console.log('Placing order:', orderDetails);
    alert(`Order placed!\n${side} ${quantity} ${symbol} @ ${orderType === 'MARKET' ? 'MARKET' : limitPrice}`);
    onClose();
  };

  if (!isOpen) return null;

  const formatSymbol = (sym: string) => {
    return `NSE:SPOT:${sym}`;
  };

  return (
    <div 
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white rounded-lg shadow-2xl w-[280px] text-gray-800 border border-gray-200">
        {/* Header */}
        <div className="popup-header flex items-center justify-between px-3 py-2 border-b border-gray-200 cursor-move">
          <div className="flex items-center gap-2">
            <Maximize2 size={14} className="text-gray-400" />
            <span className="font-medium text-sm">Trading Panel</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Broker Info */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">ZERODHA</span>
              <span className={`w-2 h-2 rounded-full ${paperBroker?.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <button className="px-3 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600 transition-colors">
              Connect
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">{formatSymbol(symbol)}</div>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex rounded overflow-hidden">
            <button
              onClick={() => setSide('SELL')}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                side === 'SELL' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs font-medium">SELL</span>
              <span className="text-lg font-bold">{sellPrice}</span>
            </button>
            <div className="w-10 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
              {spread.toFixed(1)}
            </div>
            <button
              onClick={() => setSide('BUY')}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                side === 'BUY' 
                  ? 'bg-teal-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs font-medium">BUY</span>
              <span className="text-lg font-bold">{buyPrice}</span>
            </button>
          </div>
        </div>

        {/* Order Types */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex gap-1">
            {(['LIMIT', 'MARKET', 'STOP', 'STOPLIMIT'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  orderType === type
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Price Inputs */}
        <div className="px-3 py-2 space-y-2 border-b border-gray-100">
          {/* Limit Price */}
          {(orderType === 'LIMIT' || orderType === 'STOPLIMIT') && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Limit Price</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-gray-200 rounded text-right"
                  step="0.1"
                />
                <button 
                  onClick={() => setLimitPrice(p => p + 0.1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={12} />
                </button>
                <span className="text-xs text-gray-400">INR</span>
              </div>
            </div>
          )}

          {/* Stop Price */}
          {(orderType === 'STOP' || orderType === 'STOPLIMIT') && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Stop Price</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-gray-200 rounded text-right"
                  step="0.1"
                />
                <button 
                  onClick={() => setStopPrice(p => p + 0.1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={12} />
                </button>
                <span className="text-xs text-gray-400">INR</span>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Quantity</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-sm border border-gray-200 rounded text-center"
                min="1"
              />
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-1 hover:bg-gray-100 rounded border border-gray-200"
              >
                <Minus size={12} />
              </button>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="p-1 hover:bg-gray-100 rounded border border-gray-200"
              >
                <Plus size={12} />
              </button>
              <span className="text-xs text-orange-500 ml-1">1 Default</span>
            </div>
          </div>

          {/* Lot Sizes */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Lots</span>
            <div className="flex gap-1">
              {lotSizes.map((lot) => (
                <button
                  key={lot}
                  onClick={() => setQuantity(lot)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    quantity === lot
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {lot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setValidity('IOC')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                validity === 'IOC'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              IOC
            </button>
            <button
              onClick={() => setValidity('DAY')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                validity === 'DAY'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✓ DAY
            </button>
          </div>
        </div>

        {/* Other Configurations */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="text-xs text-gray-400 mb-2">Other Configurations</div>
          
          <div className="space-y-2">
            {/* Variety */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Variety</span>
              <div className="flex items-center gap-2">
                <select
                  value={variety}
                  onChange={(e) => setVariety(e.target.value as Variety)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                >
                  <option value="regular">regular</option>
                  <option value="amo">amo</option>
                  <option value="co">co</option>
                  <option value="iceberg">iceberg</option>
                </select>
                <span className="text-xs text-orange-500">regular</span>
              </div>
            </div>

            {/* Product Type */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Product Type</span>
              <div className="flex items-center gap-2">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                >
                  <option value="NRML">NRML</option>
                  <option value="MIS">MIS</option>
                  <option value="CNC">CNC</option>
                </select>
                <span className="text-xs text-orange-500">NRML</span>
              </div>
            </div>

            {/* Disclosed Qty */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Disclosed Qty</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={disclosedQty}
                  onChange={(e) => setDisclosedQty(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-center"
                  min="0"
                />
                <span className="text-xs text-orange-500">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-3">
          <button
            onClick={handlePlaceOrder}
            className={`w-full py-2.5 rounded font-medium text-sm text-white transition-colors ${
              side === 'BUY'
                ? 'bg-teal-500 hover:bg-teal-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {side} {quantity} {formatSymbol(symbol)}: {orderType === 'MARKET' ? 'MKT' : `LMT @ ${limitPrice.toFixed(1)}...`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradePopup;
