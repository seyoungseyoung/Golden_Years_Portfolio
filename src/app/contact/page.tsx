
// src/app/contact/page.tsx
"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleContactFormSubmitAction } from "./actions";

const contactFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  subject: z.string().optional(),
  message: z.string().min(10, { message: "문의 내용은 최소 10자 이상 입력해주세요." }).max(1000, { message: "문의 내용은 최대 1000자까지 입력 가능합니다." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsSubmitting(true);
    try {
      const result = await handleContactFormSubmitAction(values);
      if (result.success) {
        toast({
          title: "문의 접수 완료",
          description: "문의해주셔서 감사합니다. 빠른 시일 내에 회신드리겠습니다.",
        });
        form.reset();
      } else {
        toast({
          title: "전송 오류",
          description: result.error || "문의를 전송하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "전송 오류",
        description: "알 수 없는 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-primary flex items-center gap-2">
            <Mail /> 문의하기
          </CardTitle>
          <CardDescription>
            문의사항이나 기능 업데이트 요청이 있으시면 아래 양식을 작성해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="성함을 입력해주세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 주소</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="답변 받으실 이메일 주소를 입력해주세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="문의 제목을 입력해주세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>문의 내용</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="문의하실 내용을 자세히 적어주세요 (최소 10자)"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    문의 보내기
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
