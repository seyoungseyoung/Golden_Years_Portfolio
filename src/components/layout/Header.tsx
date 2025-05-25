
import Link from 'next/link';
import { Landmark, Mail } from 'lucide-react'; // Mail 아이콘 추가

export default function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Landmark size={28} />
          <h1 className="text-2xl font-semibold">황금빛 노후 포트폴리오</h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            홈
          </Link>
          <Link href="/questionnaire" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            설문지
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            대시보드
          </Link>
          <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center">
            <Mail size={16} className="mr-1" /> {/* 문의하기 아이콘 추가 */}
            문의하기
          </Link>
        </nav>
      </div>
    </header>
  );
}
