
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-market-changes.ts';
import '@/ai/flows/generate-investment-strategy.ts';
import '@/ai/flows/analyze-stock-signal.ts';
import '@/ai/flows/suggest-technical-indicators.ts'; // 새로 추가된 플로우
