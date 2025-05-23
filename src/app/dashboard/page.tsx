"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { PortfolioDisplay } from "@/components/dashboard/PortfolioDisplay";
import { MarketCommentary } from "@/components/dashboard/MarketCommentary";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardPage() {
  const router = useRouter();
  const { strategy, isLoading: contextIsLoading } = usePortfolio(); // isLoading from context is general purpose
  const [isPageLoading, setIsPageLoading] = useState(true);


  useEffect(() => {
    // This effect handles initial load and ensures strategy is checked from context
    // For client components, context value might not be available on first server render pass
    // and will hydrate on client.
    if (!contextIsLoading) { // Check context loading state if available, or just proceed
        setIsPageLoading(false);
        if (!strategy) {
            // If no strategy after context has loaded, redirect
            // This check might run multiple times, ensure router.push is conditional
            // router.push('/questionnaire'); // Potentially too aggressive, user might be navigating back
        }
    }
  }, [strategy, contextIsLoading, router]);
  
  if (isPageLoading) {
    return <DashboardSkeleton />;
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Investment Strategy Found</h2>
        <p className="text-muted-foreground mb-6">
          Please complete the questionnaire to generate your personalized investment strategy.
        </p>
        <Button onClick={() => router.push("/questionnaire")} className="bg-primary text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Go to Questionnaire
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">Your Financial Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Review your personalized strategy and get AI-driven market insights.
        </p>
      </div>
      <PortfolioDisplay strategy={strategy} />
      <Separator className="my-12" />
      <MarketCommentary />
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
    </div>
  );
}
