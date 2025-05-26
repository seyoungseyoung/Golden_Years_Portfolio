import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart2, Bell, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center">
      <Image 
        src="https://i.imgur.com/B4gzCpz.png"
        alt="황금빛 노후 포트폴리오 일러스트"
        width={300}
        height={200}
        className="mb-8 rounded-lg shadow-lg w-auto"
        data-ai-hint="retirement growth"
        priority
        unoptimized={true}
      />
      <h1 className="text-5xl font-bold text-primary mb-6">
        황금빛 노후 포트폴리오
      </h1>
      <p className="text-xl text-foreground/80 mb-10 max-w-2xl">
        “맞춤형 질문으로 시작하여, 당신만의 투자 전략과 실행 지침을 받아보세요.”
      </p>
      <Link href="/questionnaire">
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          나만의 맞춤 전략 받기 <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <FeatureCard
          icon={<ShieldCheck className="h-10 w-10 text-primary" />}
          title="맞춤형 전략"
          description="약 8가지 질문에 답하고 은퇴 계획에 맞춘 투자 계획을 받아보세요."
        />
        <FeatureCard
          icon={<BarChart2 className="h-10 w-10 text-primary" />}
          title="AI 기반 인사이트"
          description="AI를 활용하여 자산 배분을 생성하고 전략에 대한 명확한 설명을 받아보세요."
        />
        <FeatureCard
          icon={<Bell className="h-10 w-10 text-primary" />}
          title="최신 정보 확인"
          description="시장 해설과 포트폴리오 변경 사항을 통해 자신감 있는 결정을 내리세요."
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
