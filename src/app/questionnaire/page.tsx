import { QuestionnaireForm } from "@/components/forms/QuestionnaireForm";
import { Suspense } from "react";

export default function QuestionnairePage() {
  return (
    <div className="py-8">
        <Suspense fallback={<p>설문지를 불러오는 중...</p>}>
            <QuestionnaireForm />
        </Suspense>
    </div>
  );
}
