// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { PortfolioDisplay } from "@/components/dashboard/PortfolioDisplay";
import { MarketCommentary } from "@/components/dashboard/MarketCommentary";
import { StockSignalAnalyzer } from "@/components/dashboard/StockSignalAnalyzer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardPage() {
  const router = useRouter();
  const { strategy, isInitialized } = usePortfolio(); 
  const [isPageLoading, setIsPageLoading] = useState(true);


  useEffect(() => {
    if (isInitialized) { // Wait for context to confirm initialization status
        setIsPageLoading(false);
    }
  }, [isInitialized]);
  
  if (isPageLoading) {
    return <DashboardSkeleton />;
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">투자 전략을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-6">
          맞춤형 투자 전략을 생성하려면 설문지를 작성해주세요.
        </p>
        <Button onClick={() => router.push("/questionnaire")} className="bg-primary text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> 설문지로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">나의 금융 대시보드</h1>
        <p className="text-lg text-muted-foreground">
          맞춤형 전략을 검토하고 AI 기반 시장 인사이트 및 주식 분석을 활용하세요.
        </p>
      </div>
      <PortfolioDisplay strategy={strategy} />
      <Separator className="my-12" />
      <MarketCommentary />
      <Separator className="my-12" /> 
      <StockSignalAnalyzer />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
      <Separator className="my-12" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-10 w-1/4" />
        </CardContent>
      </Card>
       <Separator className="my-12" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-1/3" />
        </CardContent>
      </Card>
    </div>
  );
}
