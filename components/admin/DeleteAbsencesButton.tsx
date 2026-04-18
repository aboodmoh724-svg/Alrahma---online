"use client";

import { useFormStatus } from "react-dom";

type DeleteAbsencesButtonProps = {
  studentName: string;
};

export function DeleteAbsencesButton({
  studentName,
}: DeleteAbsencesButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        const confirmed = window.confirm(
          `هل تريد مسح جميع غيابات الطالب ${studentName}؟ لا يمكن التراجع عن هذه العملية.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "جار مسح الغيابات..." : "مسح غيابات الطالب"}
    </button>
  );
}
