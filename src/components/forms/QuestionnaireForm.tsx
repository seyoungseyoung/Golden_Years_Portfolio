// src/components/forms/QuestionnaireForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { handleGenerateStrategyAction } from "@/app/questionnaire/actions";
import { useToast } from "@/hooks/use-toast";
import type { InvestmentStrategyInput } from "@/types";
import { useState } from "react";

const formSchema = z.object({
  retirementHorizon: z.string().min(1, "은퇴 시기는 필수 항목입니다."),
  cashFlowNeeds: z.string().min(1, "현금 흐름 필요성은 필수 항목입니다."),
  assetSize: z.string().min(1, "자산 규모는 필수 항목입니다."),
  taxSensitivity: z.string().min(1, "세금 민감도는 필수 항목입니다."),
  themePreference: z.string().min(1, "투자 테마 선호도는 필수 항목입니다."),
  investmentRegionPreference: z.string().min(1, "투자 지역 선호도는 필수 항목입니다."), // 새로 추가된 필드
  managementStyle: z.string().min(1, "관리 스타일은 필수 항목입니다."),
  otherAssets: z.string().optional(),
  riskTolerance: z.string().min(1, "위험 감수 수준은 필수 항목입니다."),
});

type QuestionnaireFormValues = z.infer<typeof formSchema>;

const questionCategories: Record<keyof QuestionnaireFormValues, { label: string; description: string; options?: string[]; placeholder?: string }> = {
  retirementHorizon: { 
    label: "은퇴 시기", 
    description: "계획된 은퇴까지 몇 년 남았나요?",
    options: ["이미 은퇴함", "5년 미만", "5-10년", "10-20년", "20년 이상"]
  },
  cashFlowNeeds: {
    label: "현금 흐름 필요성",
    description: "투자를 통해 월 소득이 필요한가요? 그렇다면 얼마인가요?",
    options: ["월 소득 필요 없음", "월 0원 - 100만원", "월 101만원 - 300만원", "월 301만원 - 500만원", "월 500만원 이상"]
  },
  assetSize: {
    label: "투자 자산 규모",
    description: "투자 자산의 대략적인 규모는 어느 정도인가요?",
    options: ["5천만원 미만", "5천만원 - 2억 5천만원 미만", "2억 5천만원 - 10억원 미만", "10억원 - 50억원 미만", "50억원 이상"]
  },
  taxSensitivity: {
    label: "세금 민감도",
    description: "투자가 세금에 얼마나 민감한가요?",
    options: ["매우 민감함", "다소 민감함", "민감하지 않음"]
  },
  themePreference: {
    label: "투자 테마 선호도",
    description: "어떤 투자 테마를 선호하시나요?",
    options: ["배당", "성장", "ESG (환경, 사회, 지배구조)", "국내 중심", "해외 중심", "균형 / 분산"]
  },
  investmentRegionPreference: { // 새로 추가된 질문
    label: "투자 지역 선호도",
    description: "어느 국가/지역의 주식에 주로 투자하고 싶으신가요?",
    options: ["국내 주식 중심", "미국 주식 중심", "기타 선진국 주식 중심 (유럽, 일본 등)", "신흥국 주식 중심 (중국, 인도 등)", "글로벌 분산 투자"]
  },
  managementStyle: {
    label: "관리 스타일",
    description: "투자를 얼마나 적극적으로 관리하고 싶으신가요?",
    options: ["적극적 (직접 관리 선호)", "소극적 / 자동화 (설정 후 신경 쓰지 않는 방식 선호)"]
  },
  riskTolerance: {
    label: "위험 감수 수준",
    description: "투자 위험에 대한 편안함 수준은 어느 정도인가요?",
    options: ["보수적 (자본 보존 우선)", "다소 보수적", "중립적 (위험과 수익 균형)", "다소 공격적", "공격적 (높은 수익 추구, 높은 위험 감수)"]
  },
  otherAssets: {
    label: "기타 자산",
    description: "다른 중요한 자산(예: 연금, 부동산)이 있으신가요? 간략하게 기재해주세요.",
    placeholder: "예: 회사 연금, 시내 임대 부동산"
  }
};


export function QuestionnaireForm() {
  const router = useRouter();
  const { setStrategy } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retirementHorizon: "",
      cashFlowNeeds: "",
      assetSize: "",
      taxSensitivity: "",
      themePreference: "",
      investmentRegionPreference: "", // 새로 추가된 필드 기본값
      managementStyle: "",
      otherAssets: "",
      riskTolerance: "",
    },
  });

  async function onSubmit(values: QuestionnaireFormValues) {
    setIsSubmitting(true);
    try {
      const result = await handleGenerateStrategyAction(values as InvestmentStrategyInput);
      if (result.success && result.data) {
        setStrategy(result.data);
        toast({
          title: "전략 생성 완료!",
          description: "맞춤형 투자 전략이 준비되었습니다.",
        });
        router.push("/dashboard");
      } else {
        let errorMessage = result.error || "전략 생성에 실패했습니다.";
        if (result.fieldErrors) {
          errorMessage += " 입력 항목을 확인해주세요.";
          result.fieldErrors.forEach(err => {
            form.setError(err.path[0] as keyof QuestionnaireFormValues, { message: err.message });
          });
        }
        toast({
          title: "오류",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // 질문 순서 정의 (새로운 질문 위치 포함)
  const questionOrder: (keyof QuestionnaireFormValues)[] = [
    "retirementHorizon",
    "cashFlowNeeds",
    "assetSize",
    "taxSensitivity",
    "themePreference",
    "investmentRegionPreference", // 새로운 질문 위치
    "managementStyle",
    "riskTolerance",
    "otherAssets",
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl text-primary flex items-center gap-2">
          <Wand2 /> 투자 프로필 만들기
        </CardTitle>
        <CardDescription>
          황금빛 노후를 위한 맞춤형 투자 전략을 세우는 데 도움이 되도록 다음 질문에 답해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {questionOrder.map((fieldName) => {
              const q = questionCategories[fieldName];
              if (!q) return null; // 혹시 모를 오류 방지
              return (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">{q.label}</FormLabel>
                      <FormDescription>{q.description}</FormDescription>
                      {q.options ? (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`${q.label} 선택`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {q.options.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Textarea placeholder={q.placeholder} {...field} rows={3}/>
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
            
            <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  전략 생성 중...
                </>
              ) : (
                "내 전략 생성하기"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
