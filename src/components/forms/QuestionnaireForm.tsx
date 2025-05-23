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

const formSchema = z.object({
  retirementHorizon: z.string().min(1, "Retirement horizon is required."),
  cashFlowNeeds: z.string().min(1, "Cash flow needs are required."),
  assetSize: z.string().min(1, "Asset size is required."),
  taxSensitivity: z.string().min(1, "Tax sensitivity is required."),
  themePreference: z.string().min(1, "Theme preference is required."),
  managementStyle: z.string().min(1, "Management style is required."),
  otherAssets: z.string().optional(),
  riskTolerance: z.string().min(1, "Risk tolerance is required."),
});

type QuestionnaireFormValues = z.infer<typeof formSchema>;

const questionCategories = {
  retirementHorizon: { 
    label: "Retirement Horizon", 
    description: "How many years until your planned retirement?",
    options: ["Already retired", "Less than 5 years", "5-10 years", "10-20 years", "20+ years"]
  },
  cashFlowNeeds: {
    label: "Cash Flow Needs",
    description: "Do you need monthly income from your investments? If so, how much?",
    options: ["No monthly income needed", "$0 - $1,000 / month", "$1,001 - $3,000 / month", "$3,001 - $5,000 / month", "$5,000+ / month"]
  },
  assetSize: {
    label: "Investment Asset Size",
    description: "What is the approximate size of your investment assets?",
    options: ["Less than $50,000", "$50,000 - $249,999", "$250,000 - $999,999", "$1,000,000 - $4,999,999", "$5,000,000+"]
  },
  taxSensitivity: {
    label: "Tax Sensitivity",
    description: "How sensitive are your investments to taxes?",
    options: ["Very tax-sensitive", "Somewhat tax-sensitive", "Not tax-sensitive"]
  },
  themePreference: {
    label: "Investment Theme Preference",
    description: "What investment themes do you prefer?",
    options: ["Dividends", "Growth", "ESG (Environmental, Social, Governance)", "Domestic Focus", "International Focus", "Balanced / Diversified"]
  },
  managementStyle: {
    label: "Management Style",
    description: "How actively do you want to manage your investments?",
    options: ["Active (I want to be hands-on)", "Passive / Automated (Prefer a set-it-and-forget-it approach)"]
  },
  riskTolerance: {
    label: "Risk Tolerance",
    description: "What is your comfort level with investment risk?",
    options: ["Conservative (Prioritize capital preservation)", "Moderately Conservative", "Moderate (Balanced approach to risk and return)", "Moderately Aggressive", "Aggressive (Seek higher returns, comfortable with higher risk)"]
  },
  otherAssets: {
    label: "Other Assets",
    description: "Do you have other significant assets (e.g., pension, real estate)? Please list them briefly.",
    placeholder: "e.g., Company pension, Rental property in downtown"
  }
};


export function QuestionnaireForm() {
  const router = useRouter();
  const { setStrategy, isLoading, setIsLoading } = usePortfolio();
  const { toast } = useToast();

  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retirementHorizon: "",
      cashFlowNeeds: "",
      assetSize: "",
      taxSensitivity: "",
      themePreference: "",
      managementStyle: "",
      otherAssets: "",
      riskTolerance: "",
    },
  });

  async function onSubmit(values: QuestionnaireFormValues) {
    setIsLoading(true);
    try {
      const result = await handleGenerateStrategyAction(values as InvestmentStrategyInput);
      if (result.success && result.data) {
        setStrategy(result.data);
        toast({
          title: "Strategy Generated!",
          description: "Your personalized investment strategy is ready.",
        });
        router.push("/dashboard");
      } else {
        let errorMessage = result.error || "Failed to generate strategy.";
        if (result.fieldErrors) {
          errorMessage += " Please check the form fields.";
          result.fieldErrors.forEach(err => {
            form.setError(err.path[0] as keyof QuestionnaireFormValues, { message: err.message });
          });
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl text-primary flex items-center gap-2">
          <Wand2 /> Create Your Investment Profile
        </CardTitle>
        <CardDescription>
          Answer these questions to help us tailor a personalized investment strategy for your golden years.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {Object.entries(questionCategories).map(([fieldName, q]) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName as keyof QuestionnaireFormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">{q.label}</FormLabel>
                    <FormDescription>{q.description}</FormDescription>
                    {q.options ? (
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${q.label.toLowerCase()}`} />
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
            ))}
            
            <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Strategy...
                </>
              ) : (
                "Generate My Strategy"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
