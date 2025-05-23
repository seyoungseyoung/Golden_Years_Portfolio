import { QuestionnaireForm } from "@/components/forms/QuestionnaireForm";
import { Suspense } from "react";

export default function QuestionnairePage() {
  return (
    <div className="py-8">
        <Suspense fallback={<p>Loading questionnaire...</p>}>
            <QuestionnaireForm />
        </Suspense>
    </div>
  );
}
