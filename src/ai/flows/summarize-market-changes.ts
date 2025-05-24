'use server';

/**
 * @fileOverview 시장 변경 사항을 요약하고 사용자가 취할 조치를 제안합니다.
 *
 * - summarizeMarketChanges - 시장 변경 사항을 요약하고 조치를 제안하는 함수입니다.
 * - SummarizeMarketChangesInput - summarizeMarketChanges 함수의 입력 유형입니다.
 * - SummarizeMarketChangesOutput - summarizeMarketChanges 함수의 반환 유형입니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMarketChangesInputSchema = z.object({
  portfolio: z
    .string()
    .describe('사용자 포트폴리오, 자산 배분 및 특정 보유 자산 포함.'),
  marketNews: z.string().describe('최신 시장 뉴스 및 동향.'),
});
export type SummarizeMarketChangesInput = z.infer<typeof SummarizeMarketChangesInputSchema>;

const SummarizeMarketChangesOutputSchema = z.object({
  summary: z.string().describe('시장 변경 사항 요약.'),
  suggestedAction: z
    .string()
    .describe('시장 변경 사항을 기반으로 사용자가 취할 수 있는 제안 조치.'),
  reasoning: z.string().describe('제안된 조치에 대한 근거.'),
});
export type SummarizeMarketChangesOutput = z.infer<typeof SummarizeMarketChangesOutputSchema>;

export async function summarizeMarketChanges(input: SummarizeMarketChangesInput): Promise<SummarizeMarketChangesOutput> {
  return summarizeMarketChangesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMarketChangesPrompt',
  input: {schema: SummarizeMarketChangesInputSchema},
  output: {schema: SummarizeMarketChangesOutputSchema},
  prompt: `당신은 시장 변화를 요약하고 그 변화에 기초하여 사용자가 취할 조치를 제안하는 금융 자문가입니다.

  포트폴리오: {{{portfolio}}}
  시장 뉴스: {{{marketNews}}}

  다음 형식으로 답변해 주세요:
  요약:
  제안 조치:
  근거:`,
});

const summarizeMarketChangesFlow = ai.defineFlow(
  {
    name: 'summarizeMarketChangesFlow',
    inputSchema: SummarizeMarketChangesInputSchema,
    outputSchema: SummarizeMarketChangesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
