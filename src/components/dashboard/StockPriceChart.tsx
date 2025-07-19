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
  Cell,
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = Exclude<AnalyzeStockSignalOutput['chartData'], undefined>[number];
type SignalEvent = Exclude<AnalyzeStockSignalOutput['signalEvents'], undefined>[number];


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
        {payload.find(p => p.dataKey === 'volume') && typeof dataPoint.volume === 'number' && (
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
    return <p className="text-muted-foreground p-4 text-center">차트 데이터를 표시하기에 정보가 부족합니다.</p>;
  }

  const dataWithCandle = chartData.map(d => ({
    ...d,
    candleWick: [d.low, d.high],
    candleBody: d.open && d.close ? [d.open, d.close] : undefined,
    isRising: d.close >= (d.open ?? d.close),
    event: signalEvents.find(e => e.date === d.date),
  }));

  const pricesForDomain = chartData.flatMap(d => [d.high, d.low]).filter((p): p is number => typeof p === 'number' && isFinite(p));
  if (pricesForDomain.length === 0) {
    return <p className="text-destructive p-4 text-center">차트 데이터에 유효한 가격 정보가 없습니다.</p>;
  }

  let yMin = Math.min(...pricesForDomain);
  let yMax = Math.max(...pricesForDomain);
  const padding = (yMax - yMin) * 0.1;
  yMin = Math.max(0, yMin - padding);
  yMax += padding;

  const volumeData = chartData.map(d => d.volume).filter((v): v is number => typeof v === 'number' && isFinite(v));
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.5 : 1;
  const xAxisTickInterval = Math.max(1, Math.floor(chartData.length / 10));

  return (
    <div style={{ width: '100%', height: 450 }}>
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
          
          <Bar dataKey="candleWick" yAxisId="left" fill="hsl(var(--foreground))" barSize={1} isAnimationActive={false} name="고가/저가" />
          <Bar dataKey="candleBody" yAxisId="left" isAnimationActive={false} name="시가/종가">
            {dataWithCandle.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
            ))}
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
