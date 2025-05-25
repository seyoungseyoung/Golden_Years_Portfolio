// src/components/dashboard/StockPriceChart.tsx
"use client";

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart, // Changed from LineChart
  Bar, // For candlestick body
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  BarChart, // Added BarChart import
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = AnalyzeStockSignalOutput['chartData'] extends (infer U)[] ? U : never;
type SignalEvent = AnalyzeStockSignalOutput['signalEvents'] extends (infer U)[] ? U : never;

// Custom shape for Candlestick
const Candlestick = (props: any) => {
  const { x, y, width, height, payload, yAxis } = props; // y and height are for the nominal dataKey "close"

  if (!payload || 
      typeof payload.open !== 'number' || 
      typeof payload.close !== 'number' || 
      typeof payload.high !== 'number' || 
      typeof payload.low !== 'number') {
    return null; // Don't render if OHLC data is incomplete
  }

  const { open: actualOpen, close: actualClose, high: actualHigh, low: actualLow } = payload;

  const yOpen = yAxis.scale(actualOpen);
  const yClose = yAxis.scale(actualClose);
  const yHigh = yAxis.scale(actualHigh);
  const yLow = yAxis.scale(actualLow);

  const isRising = actualClose >= actualOpen;
  const bodyFill = isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  const wickStroke = 'hsl(var(--foreground))';

  const candleX = x; // x from props is the left edge of the bar slot

  // Wick (thin line from high to low)
  const wickCenterX = candleX + width / 2;

  // Body (rectangle from open to close)
  const bodyTopY = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yOpen - yClose)); // Ensure minimum 1px height for doji-like candles

  return (
    <g>
      {/* Wick */}
      <line
        x1={wickCenterX}
        y1={yHigh}
        x2={wickCenterX}
        y2={yLow}
        stroke={wickStroke}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={candleX}
        y={bodyTopY}
        width={width}
        height={bodyHeight}
        fill={bodyFill}
      />
    </g>
  );
};


const YAxisPriceTickFormatter = (value: number) => {
  if (value === null || value === undefined) return '';
  return value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
};

const YAxisVolumeTickFormatter = (value: number) => {
  if (value === null || value === undefined) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as StockDataPoint & { event?: SignalEvent }; // payload[0].payload contains the original data item
    
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold text-foreground">{`날짜: ${label}`}</p>
        {typeof data.open === 'number' && <p style={{ color: 'hsl(var(--foreground))' }}>시가: {YAxisPriceTickFormatter(data.open)}</p>}
        {typeof data.high === 'number' && <p style={{ color: 'hsl(var(--chart-2))' }}>고가: {YAxisPriceTickFormatter(data.high)}</p>}
        {typeof data.low === 'number' && <p style={{ color: 'hsl(var(--destructive))' }}>저가: {YAxisPriceTickFormatter(data.low)}</p>}
        {typeof data.close === 'number' && <p style={{ color: 'hsl(var(--primary))' }}>종가: {YAxisPriceTickFormatter(data.close)}</p>}
        {typeof data.volume === 'number' && (
            <p style={{ color: 'hsl(var(--chart-4))' }}>
            거래량: {YAxisVolumeTickFormatter(data.volume)}
            </p>
        )}
        {data.event && (
           <p className={`mt-1 font-semibold ${
            data.event.type === 'buy' ? 'text-green-500' :
            data.event.type === 'sell' ? 'text-red-500' :
            'text-yellow-500'
           }`}>
            신호: {data.event.type === 'buy' ? '매수' : data.event.type === 'sell' ? '매도' : '관망'}
            {data.event.indicator && ` (${data.event.indicator})`}
           </p>
        )}
      </div>
    );
  }
  return null;
};

interface StockPriceChartProps {
  chartData: StockDataPoint[];
  signalEvents: SignalEvent[];
}

export function StockPriceChart({ chartData, signalEvents }: StockPriceChartProps) {
  if (!chartData || chartData.length === 0) {
    return <p className="text-muted-foreground">차트 데이터를 불러올 수 없습니다.</p>;
  }

  const dataWithSignals = chartData.map(point => {
    const eventOnDate = signalEvents.find(event => event.date === point.date);
    return {
      ...point,
      event: eventOnDate 
    };
  });
  
  const pricesForDomain = chartData.flatMap(d => [d.open, d.high, d.low, d.close])
    .filter(p => typeof p === 'number') as number[];
  
  let calculatedYMin = pricesForDomain.length > 0 ? Math.min(...pricesForDomain) : 0;
  let calculatedYMax = pricesForDomain.length > 0 ? Math.max(...pricesForDomain) : 1;

  if (calculatedYMin === calculatedYMax) {
    const spread = Math.abs(calculatedYMin * 0.05) || 1; 
    calculatedYMin -= spread;
    calculatedYMax += spread;
  } else {
    const range = calculatedYMax - calculatedYMin;
    calculatedYMin -= range * 0.05; // Add 5% padding below min
    calculatedYMax += range * 0.05; // Add 5% padding above max
  }
 
  if (calculatedYMin > calculatedYMax) { // Should not happen if logic is correct
      const temp = calculatedYMin;
      calculatedYMin = calculatedYMax;
      calculatedYMax = temp;
  }
  if (calculatedYMin === calculatedYMax) { // Final fallback
      calculatedYMin -= 0.5;
      calculatedYMax += 0.5;
  }

  const yMinPriceDomain = calculatedYMin;
  const yMaxPriceDomain = calculatedYMax;

  const volumeData = chartData.filter(d => d.volume !== undefined && d.volume !== null && typeof d.volume === 'number').map(d => d.volume as number);
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.5 : 1; // Increased padding for volume axis

  return (
    <div style={{ width: '100%', height: 450 }}>
      {/* Price Chart (Candlestick) */}
      <ResponsiveContainer width="100%" height="70%">
        <ComposedChart data={dataWithSignals} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}> 
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.substring(5) : ''} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30}
            textAnchor="end"
            height={40}
            interval="preserveStartEnd" 
          />
          <YAxis 
            yAxisId="left"
            domain={[yMinPriceDomain, yMaxPriceDomain]} 
            tickFormatter={YAxisPriceTickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={60} 
            allowDataOverflow={false}
            orientation="left"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          
          {/* Candlestick Series: dataKey is nominal, shape does the work */}
          <Bar yAxisId="left" dataKey="close" name="주가" shape={<Candlestick />} />

          {signalEvents.map((event, index) => (
            <ReferenceDot
              key={`event-${index}`}
              yAxisId="left"
              x={event.date}
              y={event.price} 
              r={8} 
              fill={event.type === 'buy' ? 'hsl(var(--chart-2))' : event.type === 'sell' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              isFront={true} 
            >
              <foreignObject x={-7} y={-7} width={14} height={14}>
                {event.type === 'buy' && <ArrowUpCircle size={14} className="text-white" />}
                {event.type === 'sell' && <ArrowDownCircle size={14} className="text-white" />}
                {event.type === 'hold' && <MinusCircle size={14} className="text-white" />}
              </foreignObject>
            </ReferenceDot>
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume Chart */}
      {volumeData.length > 0 && (
        <ResponsiveContainer width="100%" height="30%">
            <BarChart data={dataWithSignals} margin={{ top: 10, right: 30, left: 5, bottom: 20 }}> 
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.substring(5) : ''}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                height={20} // Adjusted height for bottom chart X-axis
                interval="preserveStartEnd"
            />
            <YAxis 
                yAxisId="rightVolume" // Unique yAxisId for volume
                orientation="left" 
                domain={[0, yVolumeMax]} 
                tickFormatter={YAxisVolumeTickFormatter}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={60} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip content={<CustomTooltip />}/>
            <Bar yAxisId="rightVolume" dataKey="volume" name="거래량" fill="hsl(var(--chart-4))" opacity={0.6} barSize={10} />
            </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

