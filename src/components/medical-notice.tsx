import { MEDICAL_NOTICE_TEXT } from "@/features/sessions/medical-notice-text";

export function MedicalNotice() {
  return (
    <p role="note" className="mood-card rounded-xl p-3 text-sm">
      {MEDICAL_NOTICE_TEXT}
    </p>
  );
}
