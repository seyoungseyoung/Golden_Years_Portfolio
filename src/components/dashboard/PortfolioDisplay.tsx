"use client";

import type { InvestmentStrategyOutput } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { Briefcase, ListChecks, Lightbulb, Info } from "lucide-react";
import React from "react"; 

interface PortfolioDisplayProps {
  strategy: InvestmentStrategyOutput;
}

export function PortfolioDisplay({ strategy }: PortfolioDisplayProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl text-primary flex items-center gap-3"><Briefcase /> 나의 맞춤형 투자 전략</CardTitle>
          <CardDescription className="text-foreground/80">
            프로필을 기반으로 황금빛 노후를 위한 추천 전략입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AssetAllocationChart allocationData={strategy.assetAllocation} />
          
          <InfoCard icon={<ListChecks />} title="ETF / 주식 추천">
            <p className="whitespace-pre-wrap">{strategy.etfRecommendations || "제공된 특정 추천이 없습니다."}</p>
          </InfoCard>

          <InfoCard icon={<Lightbulb />} title="거래 전략">
             <p className="whitespace-pre-wrap">{strategy.tradingStrategy || "제공된 특정 거래 전략이 없습니다."}</p>
          </InfoCard>
          
          <InfoCard icon={<Info />} title="전략 설명" className="md:col-span-2">
            <p className="whitespace-pre-wrap">{strategy.explanation || "제공된 설명이 없습니다."}</p>
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
