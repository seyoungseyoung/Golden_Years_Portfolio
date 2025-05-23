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
  const parts = dataString.split(',').map(part => part.trim());
  const data: ChartDataItem[] = [];
  parts.forEach(part => {
    const match = part.match(/([a-zA-Z\s]+)\s*(\d+)%/);
    if (match) {
      data.push({ name: match[1].trim(), value: parseInt(match[2], 10) });
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
          <CardTitle className="flex items-center gap-2 text-xl"><LucidePieChart /> Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Asset allocation data is not available or couldn't be parsed.</p>
          <p className="mt-2">Raw data: {allocationData || "N/A"}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><LucidePieChart /> Asset Allocation</CardTitle>
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
         <p className="mt-4 text-sm text-muted-foreground text-center">Detailed: {allocationData}</p>
      </CardContent>
    </Card>
  );
}
