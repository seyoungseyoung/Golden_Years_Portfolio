import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart2, Bell, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center">
      <Image 
        src="https://placehold.co/300x200.png" 
        alt="Golden Years Portfolio Illustration" 
        width={300} 
        height={200} 
        className="mb-8 rounded-lg shadow-lg"
        data-ai-hint="retirement finance growth"
      />
      <h1 className="text-5xl font-bold text-primary mb-6">
        Golden Years Portfolio
      </h1>
      <p className="text-xl text-foreground/80 mb-10 max-w-2xl">
        “Start with tailored questions, receive your unique investment strategy and execution guidance.”
      </p>
      <Link href="/questionnaire">
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          Get Your Personalized Strategy <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <FeatureCard
          icon={<ShieldCheck className="h-10 w-10 text-primary" />}
          title="Personalized Strategy"
          description="Answer ~8 questions to get a custom investment plan tailored to your retirement needs."
        />
        <FeatureCard
          icon={<BarChart2 className="h-10 w-10 text-primary" />}
          title="AI-Powered Insights"
          description="Leverage AI to generate asset allocations and receive clear explanations for your strategy."
        />
        <FeatureCard
          icon={<Bell className="h-10 w-10 text-primary" />}
          title="Stay Informed"
          description="Get market commentary and simulated portfolio changes to make confident decisions."
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-card/80 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="items-center">
        {icon}
        <CardTitle className="text-2xl text-primary mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-foreground/70 text-center">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
