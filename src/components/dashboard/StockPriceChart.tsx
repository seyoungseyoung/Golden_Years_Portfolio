
// src/components/dashboard/StockPriceChart.tsx
"use client";

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = AnalyzeStockSignalOutput['chartData'] extends (infer U)[] | undefined ? U : never;
type SignalEvent = AnalyzeStockSignalOutput['signalEvents'] extends (infer U)[] | undefined ? U : never;

const Candlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isRising = close >= open;
  const color = isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  const wickColor = 'hsl(var(--foreground))';

  // Ensure all values are valid numbers before drawing
  if ([x, y, width, height, low, high, open, close].some(val => typeof val !== 'number' || !isFinite(val))) {
    return null;
  }
  
  const ratio = Math.abs(height / (open - close));

  return (
    <g stroke={wickColor} strokeWidth="1" fill={color}>
      {/* Wick */}
      <path
        d={`
          M ${x + width / 2},${y + height}
          L ${x + width / 2},${y + ratio * (high - close)}
          M ${x + width / 2},${y}
          L ${x + width / 2},${y + ratio * (low - open)}
        `}
      />
      {/* Body */}
      <path
        d={`
          M ${x},${y}
          L ${x + width},${y}
          L ${x + width},${y + height}
          L ${x},${y + height}
          L ${x},${y}
        `}
        fill={color}
      />
    </g>
  );
};


const YAxisPriceTickFormatter = (value: number) => {
  if (value === null || value === undefined || !isFinite(value)) return '';
  return value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
};

const YAxisVolumeTickFormatter = (value: number) => {
  if (value === null || value === undefined || !isFinite(value)) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as StockDataPoint & { event?: SignalEvent };
    
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold text-foreground">{`날짜: ${label}`}</p>
        {typeof dataPoint.open === 'number' && <p style={{ color: 'hsl(var(--foreground))' }}>시가: {YAxisPriceTickFormatter(dataPoint.open)}</p>}
        {typeof dataPoint.high === 'number' && <p style={{ color: 'hsl(var(--chart-2))' }}>고가: {YAxisPriceTickFormatter(dataPoint.high)}</p>}
        {typeof dataPoint.low === 'number' && <p style={{ color: 'hsl(var(--destructive))' }}>저가: {YAxisPriceTickFormatter(dataPoint.low)}</p>}
        {typeof dataPoint.close === 'number' && <p style={{ color: 'hsl(var(--primary))' }}>종가: {YAxisPriceTickFormatter(dataPoint.close)}</p>}
        {typeof dataPoint.volume === 'number' && (
            <p style={{ color: 'hsl(var(--chart-4))' }}>
            거래량: {YAxisVolumeTickFormatter(dataPoint.volume)}
            </p>
        )}
        {dataPoint.event && (
           <p className={`mt-1 font-semibold ${
            dataPoint.event.type === 'buy' ? 'text-green-500' :
            dataPoint.event.type === 'sell' ? 'text-red-500' :
            'text-yellow-500'
           }`}>
            신호: {dataPoint.event.type === 'buy' ? '매수' : dataPoint.event.type === 'sell' ? '매도' : '관망'}
            {dataPoint.event.indicator && ` (${dataPoint.event.indicator})`}
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
  if (!chartData || !Array.isArray(chartData) || chartData.length < 2) {
    console.warn("[StockPriceChart] Not enough valid data to render chart.", chartData);
    return <p className="text-muted-foreground p-4 text-center">차트 데이터를 표시하기에 정보가 부족합니다.</p>;
  }

  const dataWithCandle = chartData.map(d => ({
    ...d,
    candle: [d.open, d.close]
  }));

  const pricesForDomain = chartData.flatMap(d => [d.high, d.low]).filter(p => typeof p === 'number' && isFinite(p)) as number[];
  if (pricesForDomain.length === 0) {
    return <p className="text-destructive p-4 text-center">차트 데이터에 유효한 가격 정보가 없습니다.</p>;
  }

  let yMin = Math.min(...pricesForDomain);
  let yMax = Math.max(...pricesForDomain);
  const padding = (yMax - yMin) * 0.1;
  yMin = Math.max(0, yMin - padding);
  yMax += padding;

  const volumeData = chartData.map(d => d.volume).filter(v => typeof v === 'number' && isFinite(v)) as number[];
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.5 : 1;

  const xAxisTickInterval = Math.max(1, Math.floor(chartData.length / 10));

  return (
    <div style={{ width: '100%', height: 450 }}>
      {/* Price Chart */}
      <ResponsiveContainer width="100%" height="70%">
        <ComposedChart data={dataWithCandle} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.substring(5) : ''} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30} textAnchor="end" height={40}
            interval={xAxisTickInterval} padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            yAxisId="left" domain={[yMin, yMax]}
            tickFormatter={YAxisPriceTickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={60} orientation="left" scale="linear"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          
          <Bar name="가격" yAxisId="left" dataKey="candle" shape={<Candlestick />} isAnimationActive={false}>
          </Bar>

          {signalEvents.map((event, index) => (
            <ReferenceDot key={`event-${index}`} yAxisId="left"
              x={event.date} y={event.price} r={8}
              fill={event.type === 'buy' ? 'hsl(var(--chart-2))' : event.type === 'sell' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'}
              stroke="hsl(var(--background))" strokeWidth={2} isFront={true}
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
          <ComposedChart data={dataWithCandle} margin={{ top: 10, right: 30, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis dataKey="date" tickFormatter={(tick) => tick?.substring(5) ?? ''}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false} height={20}
              interval={xAxisTickInterval} padding={{left:10, right:10}}
            />
            <YAxis yAxisId="rightVolume" orientation="left"
              domain={[0, yVolumeMax]} tickFormatter={YAxisVolumeTickFormatter}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={60} axisLine={false} tickLine={false} scale="linear"
            />
            <Tooltip content={<CustomTooltip />}/>
            <Bar yAxisId="rightVolume" dataKey="volume" name="거래량" fill="hsl(var(--chart-4))" opacity={0.6} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
