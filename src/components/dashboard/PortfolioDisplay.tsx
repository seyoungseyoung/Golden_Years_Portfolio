"use client";

import type { InvestmentStrategyOutput } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { Briefcase, ListChecks, Lightbulb, Info } from "lucide-react";

interface PortfolioDisplayProps {
  strategy: InvestmentStrategyOutput;
}

export function PortfolioDisplay({ strategy }: PortfolioDisplayProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl text-primary flex items-center gap-3"><Briefcase /> Your Personalized Investment Strategy</CardTitle>
          <CardDescription className="text-foreground/80">
            Based on your profile, here's a suggested strategy for your golden years.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AssetAllocationChart allocationData={strategy.assetAllocation} />
          
          <InfoCard icon={<ListChecks />} title="ETF / Stock Recommendations">
            <p className="whitespace-pre-wrap">{strategy.etfRecommendations || "No specific recommendations provided."}</p>
          </InfoCard>

          <InfoCard icon={<Lightbulb />} title="Trading Strategy">
             <p className="whitespace-pre-wrap">{strategy.tradingStrategy || "No specific trading strategy provided."}</p>
          </InfoCard>
          
          <InfoCard icon={<Info />} title="Strategy Explanation" className="md:col-span-2">
            <p className="whitespace-pre-wrap">{strategy.explanation || "No explanation provided."}</p>
          </InfoCard>
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function InfoCard({ icon, title, children, className }: InfoCardProps) {
  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })} 
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-foreground/90 text-sm">
        {children}
      </CardContent>
    </Card>
  );
}
