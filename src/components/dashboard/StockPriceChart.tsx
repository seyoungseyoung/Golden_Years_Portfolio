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
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
};

const YAxisVolumeTickFormatter = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
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
                : pld.value.toFixed(2)}`}
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
      event: eventOnDate // Add event to the data point if it exists
    };
  });

  const yMin = Math.min(...chartData.map(d => d.close)) * 0.95;
  const yMax = Math.max(...chartData.map(d => d.close)) * 1.05;

  // For Y-axis of volume chart
  const volumeData = chartData.filter(d => d.volume !== undefined && d.volume !== null).map(d => d.volume as number);
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.2 : 0;


  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={dataWithSignals} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => tick.substring(5)} // MM-DD format
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30}
            textAnchor="end"
            height={40}
          />
          <YAxis 
            yAxisId="left"
            domain={[yMin, yMax]} 
            tickFormatter={YAxisPriceTickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={45}
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
              r={8} // Increased radius for better visibility
              fill={event.type === 'buy' ? 'hsl(var(--chart-2))' : event.type === 'sell' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              isFront={true} // Ensure dot is on top
            >
              {/* Custom label/icon inside ReferenceDot */}
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
            <BarChart data={dataWithSignals} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => tick.substring(5)}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                height={20}
            />
            <YAxis 
                yAxisId="right"
                orientation="left"
                domain={[0, yVolumeMax]} 
                tickFormatter={YAxisVolumeTickFormatter}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={45}
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

// Helper components for simple arrow shapes if needed (instead of lucide icons)
// const BuyArrow = (props: any) => (
//   <svg {...props} viewBox="0 0 10 10" width="10" height="10">
//     <polygon points="5,0 10,10 0,10" fill="green" />
//   </svg>
// );

// const SellArrow = (props: any) => (
//   <svg {...props} viewBox="0 0 10 10" width="10" height="10">
//     <polygon points="0,0 10,0 5,10" fill="red" />
//   </svg>
// );
