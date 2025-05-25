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
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; // 백만 단위 추가
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toLocaleString(); // 일반 숫자 포맷팅
};

const YAxisVolumeTickFormatter = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold text-foreground">{`날짜: ${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${
              pld.dataKey === 'volume' 
                ? YAxisVolumeTickFormatter(pld.value) 
                : typeof pld.value === 'number' ? YAxisPriceTickFormatter(pld.value) : pld.value}`}
          </p>
        ))}
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

  const closePrices = chartData.map(d => d.close);
  let calculatedYMin = Math.min(...closePrices);
  let calculatedYMax = Math.max(...closePrices);

  if (calculatedYMin === calculatedYMax) {
    // If all data points are the same, create a small spread around the value
    const spread = Math.abs(calculatedYMin * 0.05) || 1; // 5% spread or +/- 1 if value is 0 or very small
    calculatedYMin -= spread;
    calculatedYMax += spread;
  } else {
    // Add 5% padding to top and bottom relative to the actual data range
    const range = calculatedYMax - calculatedYMin;
    calculatedYMin -= range * 0.05;
    calculatedYMax += range * 0.05;
  }
  // Ensure calculatedYMin is never greater than calculatedYMax after adjustments
  if (calculatedYMin > calculatedYMax) {
      const temp = calculatedYMin;
      calculatedYMin = calculatedYMax;
      calculatedYMax = temp;
      // If they became equal after swap (e.g. both were 0 and spread was 0), add a minimal range
      if (calculatedYMin === calculatedYMax) {
          calculatedYMin -= 0.5;
          calculatedYMax += 0.5;
      }
  }


  const yMinPriceDomain = calculatedYMin;
  const yMaxPriceDomain = calculatedYMax;


  // For Y-axis of volume chart
  const volumeData = chartData.filter(d => d.volume !== undefined && d.volume !== null).map(d => d.volume as number);
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.2 : 1; // Ensure yVolumeMax is at least 1 to avoid 0 domain


  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={dataWithSignals} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}> {/* Increased right margin for YAxis labels */}
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => tick.substring(5)} // MM-DD format
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30}
            textAnchor="end"
            height={40}
            interval="preserveStartEnd" // Ensure first and last ticks are shown
          />
          <YAxis 
            yAxisId="left"
            domain={[yMinPriceDomain, yMaxPriceDomain]} 
            tickFormatter={YAxisPriceTickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={55} // Adjusted width for potentially longer tick labels
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
        </LineChart>
      </ResponsiveContainer>
      {volumeData.length > 0 && (
        <ResponsiveContainer width="100%" height="30%">
            <BarChart data={dataWithSignals} margin={{ top: 10, right: 30, left: 5, bottom: 5 }}> {/* Increased right margin */}
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => tick.substring(5)}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                height={20}
                interval="preserveStartEnd"
            />
            <YAxis 
                yAxisId="right" // This ID is for the BarChart's YAxis
                orientation="left" // Ticks on the left of the axis line
                domain={[0, yVolumeMax]} 
                tickFormatter={YAxisVolumeTickFormatter}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={55} // Adjusted width
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
