
// src/app/contact/actions.ts
"use server";

import { z } from 'zod';
import nodemailer from 'nodemailer';

// 입력 유효성 검사를 위한 스키마
const ContactFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  subject: z.string().optional(),
  message: z.string().min(10, { message: "문의 내용은 최소 10자 이상 입력해주세요." }).max(1000, { message: "문의 내용은 최대 1000자까지 입력 가능합니다."}),
});

export type ContactFormInput = z.infer<typeof ContactFormSchema>;

export async function handleContactFormSubmitAction(
  data: ContactFormInput
): Promise<{ success: boolean; error?: string }> {
  const validationResult = ContactFormSchema.safeParse(data);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues.map(issue => issue.message).join(', ');
    return { success: false, error: `입력값 오류: ${errorMessage}` };
  }

  const { name, email, subject, message } = validationResult.data;

  // 환경 변수에서 SMTP 설정 가져오기
  const smtpServer = process.env.SMTP_SERVER;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUsername = process.env.SMTP_USERNAME;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpRecipient = process.env.SMTP_RECIPIENT;

  if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword || !smtpRecipient) {
    console.error("SMTP 설정이 환경 변수에 올바르게 구성되지 않았습니다.");
    return { success: false, error: "서버 설정 오류로 인해 메일을 발송할 수 없습니다. 관리자에게 문의해주세요." };
  }

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
    // Gmail과 같은 일부 서비스는 TLS 관련 문제를 일으킬 수 있습니다. 필요시 다음 옵션을 추가하세요.
    // tls: {
    //   ciphers:'SSLv3'
    // }
  });

  const mailOptions = {
    from: `"${name || '익명 사용자'}" <${smtpUsername}>`, // 발신자는 SMTP 계정 사용자여야 할 수 있음
    to: smtpRecipient,
    replyTo: email, // 사용자가 입력한 이메일로 답장할 수 있도록 설정
    subject: subject || `새로운 문의: ${name || email}님으로부터`,
    html: `
      <p><strong>이름:</strong> ${name || '제공되지 않음'}</p>
      <p><strong>이메일:</strong> ${email}</p>
      <p><strong>제목:</strong> ${subject || '제공되지 않음'}</p>
      <hr>
      <p><strong>문의 내용:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>이 메일은 황금빛 노후 포트폴리오 웹사이트의 문의하기 폼을 통해 발송되었습니다.</em></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error("이메일 발송 중 오류 발생:", error);
    // 오류 객체에 따라 더 구체적인 메시지 분기 가능
    let userErrorMessage = "메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    if (error.code === 'EENVELOPE' && error.responseCode === 550) {
        userErrorMessage = "수신자 이메일 주소에 문제가 있어 메일을 발송할 수 없습니다. 관리자에게 문의해주세요.";
    } else if (error.code === 'EAUTH') {
        userErrorMessage = "메일 서버 인증에 실패했습니다. 관리자에게 문의해주세요.";
    }
    // ... 기타 오류 코드 처리
    return { success: false, error: userErrorMessage };
  }
}
