"use client";

export default function MeetingMinuteActions() {
  return (
    <div className="no-print flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#0a3f2a]"
      >
        تصدير PDF
      </button>
    </div>
  );
}
