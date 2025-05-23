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
  marketNews: z.string().min(50, "Please provide substantial market news (at least 50 characters)."),
});

type MarketCommentaryFormValues = z.infer<typeof formSchema>;

export function MarketCommentary() {
  const { strategy, marketUpdate, setMarketUpdate, isLoading, setIsLoading } = usePortfolio();
  const { toast } = useToast();
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  const form = useForm<MarketCommentaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { marketNews: "" },
  });

  async function onSubmit(values: MarketCommentaryFormValues) {
    if (!strategy) {
      toast({ title: "Error", description: "No investment strategy found. Please generate one first.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const portfolioDetails = `Asset Allocation: ${strategy.assetAllocation}. ETF/Stock Recommendations: ${strategy.etfRecommendations}.`;
    
    try {
      const result = await handleSummarizeMarketChangesAction({
        portfolio: portfolioDetails,
        marketNews: values.marketNews,
      });

      if (result.success && result.data) {
        setMarketUpdate(result.data);
        toast({ title: "Market Update Processed", description: "AI summary and suggestions are ready." });
        if (result.data.suggestedAction) {
            // Trigger simulation view or alert. For now, just log.
            console.log("Suggested action: ", result.data.suggestedAction);
        }
      } else {
        toast({ title: "Error", description: result.error || "Failed to process market news.", variant: "destructive" });
      }
    } catch (error) {
       toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2"><Newspaper /> Market Commentary & AI Insights</CardTitle>
          <CardDescription>Enter recent market news or trends to get an AI-powered summary and suggested actions for your portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="marketNews"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Market News / Trends</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste relevant market news, articles, or describe current trends here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || !strategy}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Get AI Insights
              </Button>
              {!strategy && <p className="text-sm text-destructive text-center mt-2">Please generate an investment strategy first to enable market insights.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {marketUpdate && (
        <Card className="shadow-md animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="text-xl text-primary">AI Market Summary & Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold text-foreground/90">Market Summary:</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{marketUpdate.summary}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/90">Suggested Action:</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{marketUpdate.suggestedAction || "No specific action suggested."}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground/90">Reasoning:</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{marketUpdate.reasoning}</p>
            </div>
            {marketUpdate.suggestedAction && (
                 <Button onClick={() => setShowSimulationModal(true)} variant="outline" className="mt-2">
                    Simulate Suggested Action (Coming Soon)
                 </Button>
            )}
          </CardContent>
        </Card>
      )}
      {/* Placeholder for Simulation Modal/View */}
      {showSimulationModal && marketUpdate?.suggestedAction && (
        <Card className="mt-4 p-4 border-accent">
            <CardHeader><CardTitle>Portfolio Simulation (Preview)</CardTitle></CardHeader>
            <CardContent>
                <p>If you take the action: <strong>{marketUpdate.suggestedAction}</strong></p>
                <p className="mt-2 text-muted-foreground"><em>Detailed simulation view is under development. This feature will show how your portfolio might change.</em></p>
                <div className="mt-4 flex gap-2">
                    <Button variant="default" onClick={() => { console.log("Accepted (Simulated)"); setShowSimulationModal(false); }}>Accept (Simulated)</Button>
                    <Button variant="outline" onClick={() => { console.log("Rejected (Simulated)"); setShowSimulationModal(false); }}>Reject (Simulated)</Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
