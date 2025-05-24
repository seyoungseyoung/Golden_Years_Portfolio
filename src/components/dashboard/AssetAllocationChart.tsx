"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as LucidePieChart } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AssetAllocationChartProps {
  allocationData: string; // e.g., "Stocks 60%, Bonds 30%, Cash 10%"
}

interface ChartDataItem {
  name: string;
  value: number;
}

// Basic parser, can be improved for robustness
const parseAllocationData = (dataString: string): ChartDataItem[] => {
  if (!dataString || typeof dataString !== 'string') return [];
  // Enhanced regex to better handle names with spaces and ensure robustness
  const parts = dataString.match(/([a-zA-Z\s\/]+)\s*(\d+)%/g) || [];
  const data: ChartDataItem[] = [];
  parts.forEach(partStr => {
    const match = partStr.match(/([a-zA-Z\s\/]+?)\s*(\d+)%/); // Non-greedy match for name
    if (match) {
      let name = match[1].trim();
      // Simple Korean mapping (can be expanded or made more dynamic)
      if (name.toLowerCase() === 'stocks') name = '주식';
      else if (name.toLowerCase() === 'bonds') name = '채권';
      else if (name.toLowerCase() === 'cash') name = '현금';
      else if (name.toLowerCase().includes('alternatives')) name = '대안 투자';
      
      data.push({ name: name, value: parseInt(match[2], 10) });
    }
  });
  return data;
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AssetAllocationChart({ allocationData }: AssetAllocationChartProps) {
  const data = parseAllocationData(allocationData);

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><LucidePieChart /> 자산 배분</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">자산 배분 데이터를 사용할 수 없거나 분석할 수 없습니다.</p>
          <p className="mt-2 text-sm text-muted-foreground">원본 데이터: {allocationData || "데이터 없음"}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><LucidePieChart /> 자산 배분</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
         <p className="mt-4 text-sm text-muted-foreground text-center">상세: {allocationData}</p>
      </CardContent>
    </Card>
  );
}
