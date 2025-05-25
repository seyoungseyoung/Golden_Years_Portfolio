// src/components/dashboard/StockPriceChart.tsx
"use client";

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  BarChart,
  Bar,
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = AnalyzeStockSignalOutput['chartData'] extends (infer U)[] ? U : never;
type SignalEvent = AnalyzeStockSignalOutput['signalEvents'] extends (infer U)[] ? U : never;

interface StockPriceChartProps {
  chartData: StockDataPoint[];
  signalEvents: SignalEvent[];
}

const YAxisPriceTickFormatter = (value: number) => {
  if (value === null || value === undefined) return '';
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
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
    const data = payload[0].payload as StockDataPoint & { event?: SignalEvent };
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold text-foreground">{`날짜: ${label}`}</p>
        {data.open !== undefined && <p style={{ color: 'hsl(var(--foreground))' }}>시가: {YAxisPriceTickFormatter(data.open)}</p>}
        {data.high !== undefined && <p style={{ color: 'hsl(var(--chart-2))' }}>고가: {YAxisPriceTickFormatter(data.high)}</p>}
        {data.low !== undefined && <p style={{ color: 'hsl(var(--destructive))' }}>저가: {YAxisPriceTickFormatter(data.low)}</p>}
        {payload.map((pld: any, index: number) => {
          // Only render close and volume from the main payload array to avoid duplication if OHLC are also graphed directly
          if (pld.dataKey === 'close' || pld.dataKey === 'volume') {
            return (
              <p key={index} style={{ color: pld.color }}>
                {`${pld.name}: ${
                  pld.dataKey === 'volume' && typeof pld.value === 'number'
                    ? YAxisVolumeTickFormatter(pld.value) 
                    : typeof pld.value === 'number' ? YAxisPriceTickFormatter(pld.value) : pld.value}`}
              </p>
            )
          }
          return null;
        })}
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

  const pricesForDomain = chartData.flatMap(d => [d.open, d.high, d.low, d.close]).filter(p => typeof p === 'number') as number[];
  
  let calculatedYMin = pricesForDomain.length > 0 ? Math.min(...pricesForDomain) : 0;
  let calculatedYMax = pricesForDomain.length > 0 ? Math.max(...pricesForDomain) : 1;


  if (calculatedYMin === calculatedYMax) {
    const spread = Math.abs(calculatedYMin * 0.05) || 1; 
    calculatedYMin -= spread;
    calculatedYMax += spread;
  } else {
    const range = calculatedYMax - calculatedYMin;
    calculatedYMin -= range * 0.05;
    calculatedYMax += range * 0.05;
  }
 
  if (calculatedYMin > calculatedYMax) {
      const temp = calculatedYMin;
      calculatedYMin = calculatedYMax;
      calculatedYMax = temp;
      if (calculatedYMin === calculatedYMax) { // Should not happen if spread logic is correct
          calculatedYMin -= 0.5;
          calculatedYMax += 0.5;
      }
  }


  const yMinPriceDomain = Math.floor(calculatedYMin); // Use Math.floor/ceil for cleaner ticks
  const yMaxPriceDomain = Math.ceil(calculatedYMax);


  const volumeData = chartData.filter(d => d.volume !== undefined && d.volume !== null && typeof d.volume === 'number').map(d => d.volume as number);
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.2 : 1; 


  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={dataWithSignals} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}> 
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="close" 
            name="종가" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 6 }} 
          />
          {signalEvents.map((event, index) => (
            <ReferenceDot
              key={`event-${index}`}
              yAxisId="left"
              x={event.date}
              y={event.price} // This price is the close price on the event date
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
        </LineChart>
      </ResponsiveContainer>
      {volumeData.length > 0 && (
        <ResponsiveContainer width="100%" height="30%">
            <BarChart data={dataWithSignals} margin={{ top: 10, right: 30, left: 5, bottom: 5 }}> 
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => tick && typeof tick === 'string' ? tick.substring(5) : ''}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                height={20}
                interval="preserveStartEnd"
            />
            <YAxis 
                yAxisId="right" 
                orientation="left" 
                domain={[0, yVolumeMax]} 
                tickFormatter={YAxisVolumeTickFormatter}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={60} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip content={<CustomTooltip />}/>
            <Bar yAxisId="right" dataKey="volume" name="거래량" fill="hsl(var(--chart-4))" opacity={0.6} barSize={10} />
            </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

