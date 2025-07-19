
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
  Customized,
} from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { AnalyzeStockSignalOutput } from '@/types';

type StockDataPoint = AnalyzeStockSignalOutput['chartData'] extends (infer U)[] | undefined ? U : never;
type SignalEvent = AnalyzeStockSignalOutput['signalEvents'] extends (infer U)[] | undefined ? U : never;

const Candlestick = (props: any) => {
  const { x, y, width, height, open, close, high, low, fill, index } = props;

  if (index < 5) {
      console.log(`Candlestick[${index}] PROPS:`, props);
  }

  if (x === undefined || y === undefined || width <= 0 || height === undefined || open === undefined || close === undefined || high === undefined || low === undefined) {
    if (index < 5) console.warn(`Candlestick[${index}]: Invalid props for drawing.`);
    return null;
  }
  
  const isRising = close >= open;
  const bodyFill = isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  const wickStroke = 'hsl(var(--foreground))';

  const bodyY = Math.min(y, y + height);
  const bodyHeight = Math.max(1, Math.abs(height));
  const wickCenterX = x + width / 2;

  // recharts' Bar y prop is the top of the bar, and height can be negative for rising bars.
  // high/low are absolute values, we need to scale them
  // This approach is complex within a shape. Let's simplify.
  // The provided props `x, y, width, height` already define the candle body.

  return (
    <g key={`candlestick-${props.payload.date || index}`}>
      {/* Wick */}
      <line
        x1={wickCenterX}
        y1={props.yAxis.scale(high)}
        x2={wickCenterX}
        y2={props.yAxis.scale(low)}
        stroke={wickStroke}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x}
        y={bodyY}
        width={width}
        height={bodyHeight}
        fill={bodyFill}
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
    // The payload for ComposedChart can be tricky. We need to find the one with our main data.
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
    console.warn("[StockPriceChart] 차트 데이터가 유효하지 않거나 부족합니다.", chartData);
    return <p className="text-muted-foreground p-4 text-center">차트 데이터를 표시하기에 정보가 부족합니다.</p>;
  }

  console.log(`[StockPriceChart] 렌더링: chartData ${chartData.length}개, signalEvents ${signalEvents.length}개`);

  const dataWithSignals = chartData.map(point => ({
    ...point,
    event: signalEvents.find(event => event.date === point.date),
    candle: [point.open, point.close] // for the candlestick bar
  }));

  const pricesForDomain = chartData.flatMap(d => [d.high, d.low]).filter(p => typeof p === 'number' && isFinite(p)) as number[];
  if (pricesForDomain.length === 0) {
    console.error("[StockPriceChart] Y축 도메인을 계산할 유효한 가격 데이터가 없습니다.");
    return <p className="text-destructive p-4 text-center">차트 데이터에 유효한 가격 정보가 없습니다.</p>;
  }

  let yMin = Math.min(...pricesForDomain);
  let yMax = Math.max(...pricesForDomain);
  const padding = (yMax - yMin) * 0.1;
  yMin -= padding;
  yMax += padding;

  if (yMin < 0 && pricesForDomain.every(p => p >= 0)) {
    yMin = 0;
  }
  if (yMin >= yMax) {
    yMin = yMax - 1; // Prevent domain error if all values are the same
  }

  const volumeData = chartData.map(d => d.volume).filter(v => typeof v === 'number' && isFinite(v)) as number[];
  const yVolumeMax = volumeData.length > 0 ? Math.max(...volumeData) * 1.5 : 1;

  const xAxisTickInterval = Math.max(1, Math.floor(chartData.length / 10)); // Show about 10 ticks

  return (
    <div style={{ width: '100%', height: 450 }}>
      {/* Price Chart */}
      <ResponsiveContainer width="100%" height="70%">
        <ComposedChart data={dataWithSignals} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
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
          
          {/* Candlestick Wicks (as a Bar with custom shape) */}
          <Bar yAxisId="left" dataKey="high" fill="none" isAnimationActive={false}>
            {dataWithSignals.map((entry, index) => (
              <Customized
                key={`wick-${index}`}
                component={(props: any) => {
                  const { x, width, yAxis } = props;
                  if (x === undefined || width === undefined || !yAxis) return null;
                  const wickCenterX = x + width / 2;
                  return (
                    <line
                      x1={wickCenterX} y1={yAxis.scale(entry.high)}
                      x2={wickCenterX} y2={yAxis.scale(entry.low)}
                      stroke={'hsl(var(--foreground))'} strokeWidth={1}
                    />
                  );
                }}
              />
            ))}
          </Bar>

          {/* Candlestick Body (as a Bar) */}
          <Bar yAxisId="left" dataKey="candle" isAnimationActive={false}>
            {dataWithSignals.map((entry, index) => (
                <Customized
                    key={`body-${index}`}
                    component={(props: any) => {
                        const {x, width, yAxis} = props;
                        if (x === undefined || width === undefined || !yAxis || entry.open === undefined || entry.close === undefined) return null;
                        
                        const yOpen = yAxis.scale(entry.open);
                        const yClose = yAxis.scale(entry.close);
                        const isRising = entry.close >= entry.open;
                        
                        return (
                            <rect
                                x={x}
                                y={Math.min(yOpen, yClose)}
                                width={width}
                                height={Math.max(1, Math.abs(yOpen - yClose))}
                                fill={isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                            />
                        );
                    }}
                />
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

      {/* Volume Chart */}
      {volumeData.length > 0 && (
        <ResponsiveContainer width="100%" height="30%">
          <ComposedChart data={dataWithSignals} margin={{ top: 10, right: 30, left: 5, bottom: 20 }}>
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

