
// src/components/dashboard/StockSignalAnalyzer.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { handleAnalyzeStockSignalAction, handleSuggestIndicatorsAction } from "@/app/dashboard/actions"; // handleSuggestIndicatorsAction 추가
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Activity, TrendingUp, BarChartHorizontalBig, CheckSquare, LineChart, Info, Bot } from "lucide-react"; // Bot 추가
import type { AnalyzeStockSignalInput, AnalyzeStockSignalOutput } from "@/types";
import type { ValidIndicatorId } from "@/ai/flows/suggest-technical-indicators"; // 타입 임포트
import { StockPriceChart } from "./StockPriceChart"; 

const availableIndicators = [
  { id: "BollingerBands", label: "볼린저 밴드", icon: <Activity className="h-4 w-4 text-blue-500" /> },
  { id: "RSI", label: "RSI (상대강도지수)", icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
  { id: "MACD", label: "MACD (이동평균 수렴확산)", icon: <BarChartHorizontalBig className="h-4 w-4 text-purple-500" /> },
  { id: "Volume", label: "거래량 분석", icon: <CheckSquare className="h-4 w-4 text-orange-500" /> },
] as const;

type IndicatorId = typeof availableIndicators[number]["id"];

const formSchema = z.object({
  ticker: z.string().min(1, "티커를 입력해주세요.").max(10, "티커는 10자를 넘을 수 없습니다.").transform(value => value.toUpperCase()),
  indicators: z.array(z.custom<IndicatorId>()).min(1, "하나 이상의 지표를 선택해주세요."),
  customTimingPrompt: z.string().optional(),
});

type StockSignalFormValues = z.infer<typeof formSchema>;

export function StockSignalAnalyzer() {
  const { strategy } = usePortfolio();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStockSignalOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggestingIndicators, setIsSuggestingIndicators] = useState(false);
  const [suggestionReasoning, setSuggestionReasoning] = useState<string | null>(null);


  const form = useForm<StockSignalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: "",
      indicators: [],
      customTimingPrompt: "",
    },
  });

  async function handleSuggestIndicators() {
    const customPromptValue = form.getValues("customTimingPrompt");
    if (!customPromptValue || customPromptValue.trim() === "") {
      toast({
        title: "입력 필요",
        description: "원하는 매매 전략이나 타이밍을 입력해주세요.",
        variant: "destructive",
      });
      form.setFocus("customTimingPrompt");
      return;
    }

    setIsSuggestingIndicators(true);
    setSuggestionReasoning(null);
    try {
      const result = await handleSuggestIndicatorsAction({ userGoal: customPromptValue });
      if (result.success && result.data?.suggestedIndicators) {
        // AI가 반환한 ValidIndicatorId[] 타입을 IndicatorId[] 타입으로 캐스팅
        const suggestedIndicatorIds = result.data.suggestedIndicators as IndicatorId[];
        form.setValue("indicators", suggestedIndicatorIds, { shouldValidate: true });
        toast({
          title: "지표 추천 완료",
          description: "추천된 기술 지표가 선택되었습니다. 필요시 직접 수정할 수 있습니다.",
        });
        if (result.data.reasoning) {
          setSuggestionReasoning(result.data.reasoning);
        }
      } else {
        toast({
          title: "추천 오류",
          description: result.error || "기술 지표 추천에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "네트워크 오류",
        description: "지표 추천 중 예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingIndicators(false);
    }
  }

  async function onSubmit(values: StockSignalFormValues) {
    if (!strategy?.riskTolerance) {
      toast({
        title: "오류",
        description: "투자 전략에서 위험 감수 수준을 찾을 수 없습니다. 먼저 설문지를 작성해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const inputForAI: AnalyzeStockSignalInput = {
      ticker: values.ticker,
      indicators: values.indicators,
      riskTolerance: strategy.riskTolerance,
      customTimingPrompt: values.customTimingPrompt,
    };
    
    try {
      const result = await handleAnalyzeStockSignalAction(inputForAI);
      if (result.success && result.data) {
        setAnalysisResult(result.data);
        toast({ title: "분석 완료", description: "AI 주식 신호 분석 결과를 확인하세요." });
      } else {
        let errorMsg = result.error || "주식 신호 분석에 실패했습니다.";
        if (result.fieldErrors) {
           result.fieldErrors.forEach(err => {
            const fieldName = err.path[0] as keyof StockSignalFormValues;
            if (fieldName === 'ticker' || fieldName === 'indicators' || fieldName === 'customTimingPrompt') {
              form.setError(fieldName, { message: err.message });
            }
          });
          errorMsg = "입력값을 확인해주세요. " + errorMsg;
        }
        toast({ title: "분석 오류", description: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "네트워크 오류", description: "분석 중 예상치 못한 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const getIndicatorIcon = (indicatorIdOrLabel: string) => {
    const found = availableIndicators.find(ind => ind.id === indicatorIdOrLabel || ind.label === indicatorIdOrLabel);
    return found ? found.icon : <Info className="h-4 w-4" />;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
            <Search /> AI 주식 매매 타이밍 분석
          </CardTitle>
          <CardDescription>
            주식 티커, 선호하는 매매 전략, 기술 지표를 선택하여 AI 기반 매매 신호 분석을 받아보세요. 
            <strong className="text-destructive-foreground bg-destructive/80 px-1 rounded">이 분석은 투자 참고용이며, 실제 투자 결정은 신중한 판단 하에 이루어져야 합니다.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">주식 티커</FormLabel>
                    <FormControl>
                      <Input placeholder="예: AAPL, MSFT, 005930.KS (삼성전자)" {...field} />
                    </FormControl>
                    <FormDescription>분석할 주식의 티커 심볼을 입력하세요. (예: AAPL, MSFT, GOOG, 005930.KS)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customTimingPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">원하는 매매 전략/타이밍 (선택 사항)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="예: 단기 변동성을 활용한 빠른 매매 원함, 장기적 관점에서 저점 매수 후 보유 전략 선호 등"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      여기에 원하는 매매 전략이나 타이밍을 입력하시면, AI가 적절한 기술 지표를 추천하거나 분석 시 참고할 수 있습니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10"
                onClick={handleSuggestIndicators}
                disabled={isSuggestingIndicators || isAnalyzing}
              >
                {isSuggestingIndicators ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI 추천 받는 중...</>
                ) : (
                  <><Bot className="mr-2 h-4 w-4 text-primary" /> AI 기술 지표 추천받기</>
                )}
              </Button>
              {suggestionReasoning && (
                  <Card className="mt-2 p-3 bg-muted/30 border-primary/30">
                      <CardDescription className="text-xs">
                          <strong className="text-primary flex items-center gap-1"><Bot size={14}/> AI 추천 근거:</strong> {suggestionReasoning}
                      </CardDescription>
                  </Card>
              )}

              <FormField
                control={form.control}
                name="indicators"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-lg">기술 지표 선택</FormLabel>
                      <FormDescription>
                        분석에 사용할 기술 지표를 선택하세요. (하나 이상) AI 추천을 받거나 직접 선택할 수 있습니다.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {availableIndicators.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="indicators"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent/50 transition-colors"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm cursor-pointer flex items-center gap-2">
                                {item.icon} {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                disabled={isAnalyzing || isSuggestingIndicators || !strategy?.riskTolerance}
              >
                {isAnalyzing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 분석 중...</>
                ) : (
                  <><Search className="mr-2 h-4 w-4" /> 신호 분석하기</>
                )}
              </Button>
              {!strategy?.riskTolerance && (
                <p className="text-sm text-destructive text-center mt-2">
                  AI 분석을 위해 투자자 프로필(위험 감수 수준)이 필요합니다. 설문지를 먼저 완료해주세요.
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="shadow-md animate-in fade-in-50 mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <LineChart className="h-6 w-6" />
              AI 분석 결과 (종목: {form.getValues("ticker")})
            </CardTitle>
             {analysisResult.chartData && analysisResult.chartData.length === 0 && analysisResult.explanation && (
                <CardDescription className="text-destructive">{analysisResult.explanation}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {analysisResult.chartData && analysisResult.chartData.length > 0 ? (
              <div className="my-4">
                <h3 className="text-lg font-semibold mb-2 text-foreground/90">주가 차트</h3>
                <StockPriceChart 
                  chartData={analysisResult.chartData} 
                  signalEvents={analysisResult.signalEvents || []} 
                />
              </div>
            ) : (
              // 이미 CardHeader에서 chartData가 비어있고 explanation이 있을 경우 표시하므로 여기선 추가 메시지 불필요.
              // 필요하다면 <p className="text-muted-foreground">차트 데이터를 불러올 수 없습니다.</p> 등을 표시할 수 있음.
              null
            )}
            <div>
              <h4 className="font-semibold text-foreground/90">매매 신호:</h4>
              <p className={`text-lg font-bold ${
                analysisResult.signal?.includes("매수") ? "text-green-600 dark:text-green-400" :
                analysisResult.signal?.includes("매도") ? "text-red-600 dark:text-red-400" :
                analysisResult.signal?.includes("분석 불가") || analysisResult.signal?.includes("오류") ? "text-destructive" :
                "text-orange-500 dark:text-orange-400" // 관망 등
              }`}>
                {analysisResult.signal || "정보 없음"}
                {analysisResult.confidence && <span className="text-xs font-normal text-muted-foreground ml-2"> (확신 수준: {analysisResult.confidence})</span>}
              </p>
            </div>
             {analysisResult.explanation && (
                <div>
                    <h4 className="font-semibold text-foreground/90">상세 설명:</h4>
                    <p className="text-foreground/80 whitespace-pre-wrap">{analysisResult.explanation}</p>
                </div>
            )}
            {analysisResult.indicatorSummary && Object.keys(analysisResult.indicatorSummary).length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground/90 mt-3">지표별 요약:</h4>
                <ul className="space-y-1 text-foreground/80">
                  {Object.entries(analysisResult.indicatorSummary).map(([indicatorKey, summary]) => {
                     const foundIndicator = availableIndicators.find(i => i.id === indicatorKey || i.label === indicatorKey);
                     const displayName = foundIndicator ? foundIndicator.label : indicatorKey;
                     const displayIcon = getIndicatorIcon(indicatorKey);
                    return (
                      <li key={indicatorKey} className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
                        {React.cloneElement(displayIcon as React.ReactElement, { className: "h-5 w-5" })} 
                        <strong>{displayName}:</strong> 
                        <span>{summary}</span>
                      </li>
                    );
                  }
                  )}
                </ul>
              </div>
            )}
             <p className="mt-4 text-xs text-muted-foreground italic">
              주의: 이 분석은 투자 참고용이며, 실제 투자 결정은 개인의 판단과 책임 하에 신중하게 이루어져야 합니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
