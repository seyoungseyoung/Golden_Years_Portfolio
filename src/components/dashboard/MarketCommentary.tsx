// src/components/dashboard/MarketCommentary.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { handleSummarizeMarketChangesAction } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Newspaper, Zap } from "lucide-react";
import type { SummarizeMarketChangesOutput } from "@/types";

const formSchema = z.object({
  marketNews: z.string().min(50, "충분한 시장 뉴스를 제공해주세요 (최소 50자)."),
});

type MarketCommentaryFormValues = z.infer<typeof formSchema>;

export function MarketCommentary() {
  const { strategy, marketUpdate, setMarketUpdate } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  const form = useForm<MarketCommentaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { marketNews: "" },
  });

  async function onSubmit(values: MarketCommentaryFormValues) {
    if (!strategy) {
      toast({ title: "오류", description: "투자 전략을 찾을 수 없습니다. 먼저 생성해주세요.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const portfolioDetails = `Asset Allocation: ${strategy.assetAllocation}. ETF/Stock Recommendations: ${strategy.etfRecommendations}.`;
    
    try {
      const result = await handleSummarizeMarketChangesAction({
        portfolio: portfolioDetails,
        marketNews: values.marketNews,
      });

      if (result.success && result.data) {
        setMarketUpdate(result.data);
        toast({ title: "시장 업데이트 처리됨", description: "AI 요약 및 제안이 준비되었습니다." });
        if (result.data.suggestedAction) {
            console.log("Suggested action: ", result.data.suggestedAction);
        }
      } else {
        toast({ title: "오류", description: result.error || "시장 뉴스 처리에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "오류", description: "예상치 못한 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2"><Newspaper /> 시장 해설 및 AI 인사이트</CardTitle>
          <CardDescription>최근 시장 뉴스나 동향을 입력하여 포트폴리오에 대한 AI 기반 요약 및 제안 조치를 받아보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="marketNews"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">시장 뉴스 / 동향</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="관련 시장 뉴스, 기사를 붙여넣거나 현재 동향을 여기에 설명해주세요..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting || !strategy}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI 분석 요청 중...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    AI 인사이트 받기
                  </>
                )}
              </Button>
              {!strategy && <p className="text-sm text-destructive text-center mt-2">시장 인사이트를 활성화하려면 먼저 투자 전략을 생성해주세요.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {marketUpdate && (
        <Card className="shadow-md animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="text-xl text-primary">AI 시장 요약 및 제안</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold text-foreground/90">시장 요약:</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{marketUpdate.summary}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/90">제안 조치:</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{marketUpdate.suggestedAction || "제안된 특정 조치가 없습니다."}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/90">근거:</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{marketUpdate.reasoning}</p>
            </div>
            {marketUpdate.suggestedAction && (
                 <Button onClick={() => setShowSimulationModal(true)} variant="outline" className="mt-2">
                    제안 조치 시뮬레이션 (출시 예정)
                 </Button>
            )}
          </CardContent>
        </Card>
      )}
      {showSimulationModal && marketUpdate?.suggestedAction && (
        <Card className="mt-4 p-4 border-accent">
            <CardHeader><CardTitle>포트폴리오 시뮬레이션 (미리보기)</CardTitle></CardHeader>
            <CardContent>
                <p>다음 조치를 취할 경우: <strong>{marketUpdate.suggestedAction}</strong></p>
                <p className="mt-2 text-muted-foreground"><em>상세 시뮬레이션 보기는 개발 중입니다. 이 기능은 포트폴리오가 어떻게 변할 수 있는지 보여줍니다.</em></p>
                <div className="mt-4 flex gap-2">
                    <Button variant="default" onClick={() => { console.log("Accepted (Simulated)"); setShowSimulationModal(false); }}>수락 (시뮬레이션)</Button>
                    <Button variant="outline" onClick={() => { console.log("Rejected (Simulated)"); setShowSimulationModal(false); }}>거절 (시뮬레이션)</Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
