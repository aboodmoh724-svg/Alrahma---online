"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Conversation = {
  id: string;
  type: string;
  parentPhone: string;
  student: { id: string; fullName: string; circle?: { name: string | null } | null };
  teacher: { id: string; fullName: string } | null;
  lastMessageAt: string;
  lastMessage: { body: string | null; attachmentName: string | null; senderRole: string; createdAt: string } | null;
};

type Message = {
  id: string;
  senderRole: string;
  senderName: string;
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: string;
};

type TeacherOption = {
  teacherId: string;
  teacherName: string;
  circleName: string | null;
};

type StudentOption = {
  studentId: string;
  studentName: string;
  circleName: string | null;
};

type Props = {
  mode: "PARENT" | "TEACHER" | "ADMIN";
  title: string;
  subtitle: string;
  backHref?: string;
};

export default function EducationChatClient({ mode, title, subtitle, backHref }: Props) {
  const [countryCode, setCountryCode] = useState("+90");
  const [localPhone, setLocalPhone] = useState("");
  const [code, setCode] = useState("");
  const [authStep, setAuthStep] = useState<"PHONE" | "CODE" | "READY">(mode === "PARENT" ? "PHONE" : "READY");
  const [loading, setLoading] = useState(true);
  const [sendingCode, setSendingCode] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingCancelledRef = useRef(false);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phone = `${countryCode.trim()}${localPhone.replace(/[^\d]/g, "")}`;

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const getConversationTitle = (conversation: Conversation) => {
    if (mode === "TEACHER") return `ولي أمر ${conversation.student.fullName}`;
    if (conversation.type === "SUPERVISION") return "الإشراف";
    return conversation.teacher?.fullName || "المعلم";
  };

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const getAudioMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    return "";
  };

  const getAudioExtension = (mimeType: string) => {
    if (mimeType.includes("mp4")) return "m4a";
    return "webm";
  };

  const getDisplayUrl = (url: string) => url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

  const renderMessageBody = (body: string) => {
    const linkPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    return body.split(linkPattern).map((part, index) => {
      if (!/^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(part)) return <span key={`${part}-${index}`}>{part}</span>;
      const href = part.startsWith("http") ? part : `https://${part}`;
      const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(href);
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-black text-[#12695d] underline decoration-[#12695d]/30 underline-offset-4"
          dir="ltr"
        >
          {isYouTube ? "رابط يوتيوب" : getDisplayUrl(part)}
        </a>
      );
    });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/education-conversations", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        if (mode === "PARENT") setAuthStep("PHONE");
        else setFeedback(data.error || "تعذر تحميل المحادثات");
        return;
      }

      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      setTeacherOptions(Array.isArray(data.teacherOptions) ? data.teacherOptions : []);
      setStudentOptions(Array.isArray(data.studentOptions) ? data.studentOptions : []);
      if (mode === "PARENT") setAuthStep("READY");
      if (!selectedConversationId && data.conversations?.[0]?.id) {
        setSelectedConversationId(data.conversations[0].id);
      }
    } catch (error) {
      console.error("LOAD EDUCATION CHAT ERROR =>", error);
      setFeedback("تعذر تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return;
    const response = await fetch(`/api/education-conversations/${conversationId}/messages`, { cache: "no-store" });
    const data = await response.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  useEffect(() => {
    if (mode === "PARENT") {
      const savedCountryCode = localStorage.getItem("parentChatCountryCode");
      const savedLocalPhone = localStorage.getItem("parentChatLocalPhone");
      if (savedCountryCode) setCountryCode(savedCountryCode);
      if (savedLocalPhone) setLocalPhone(savedLocalPhone);
    }
    loadConversations();
  }, []);

  useEffect(() => {
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const requestCode = async () => {
    try {
      setSendingCode(true);
      setFeedback("");
      if (!localPhone.trim()) {
        setFeedback("يرجى كتابة رقم واتساب ولي الأمر.");
        return;
      }
      const response = await fetch("/api/parent-chat/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback(data.error || "تعذر إرسال الرمز");
        return;
      }
      localStorage.setItem("parentChatCountryCode", countryCode);
      localStorage.setItem("parentChatLocalPhone", localPhone);
      setAuthStep("CODE");
      setFeedback("تم إرسال الرمز إلى واتساب.");
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    const response = await fetch("/api/parent-chat/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error || "تعذر التحقق");
      return;
    }
    localStorage.setItem("parentChatCountryCode", countryCode);
    localStorage.setItem("parentChatLocalPhone", localPhone);
    setAuthStep("READY");
    await loadConversations();
  };

  const createConversation = async (payload: Record<string, string>) => {
    const response = await fetch("/api/education-conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error || "تعذر فتح المحادثة");
      return;
    }
    await loadConversations();
    setSelectedConversationId(data.conversationId);
  };

  const sendMessage = async (voiceAttachment?: File) => {
    const fileToSend = voiceAttachment || attachment;
    if (!selectedConversationId || (!draft.trim() && !fileToSend)) return;
    try {
      setSending(true);
      const formData = new FormData();
      formData.append("body", voiceAttachment ? "" : draft);
      if (fileToSend) formData.append("attachment", fileToSend);

      const response = await fetch(`/api/education-conversations/${selectedConversationId}/messages`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback(data.error || "تعذر إرسال الرسالة");
        return;
      }
      if (!voiceAttachment) {
        setDraft("");
        setAttachment(null);
      }
      await loadMessages(selectedConversationId);
      await loadConversations();
    } finally {
      setSending(false);
    }
  };

  const startVoiceRecording = async () => {
    if (isRecording || sending) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setFeedback("تسجيل الصوت غير مدعوم في هذا المتصفح.");
      return;
    }

    try {
      setFeedback("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingChunksRef.current = [];
      recordingCancelledRef.current = false;
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const chunks = recordingChunksRef.current;
        const type = recorder.mimeType || mimeType || "audio/webm";
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        setIsRecording(false);
        setRecordingSeconds(0);

        if (recordingCancelledRef.current || !chunks.length) return;
        const audioBlob = new Blob(chunks, { type });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${getAudioExtension(type)}`, { type });
        await sendMessage(audioFile);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    } catch (error) {
      console.error("VOICE RECORDING ERROR =>", error);
      setFeedback("تعذر تشغيل الميكروفون. تأكد من السماح للتطبيق باستخدام الميكروفون.");
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = (cancelled = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recordingCancelledRef.current = cancelled;
    recorder.stop();
  };

  if (mode === "PARENT" && authStep !== "READY") {
    return (
      <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center">
          <section className="w-full rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-black text-[#9b7039]">مراسلات التعليم</p>
            <h1 className="mt-2 text-3xl font-black text-[#173d42]">دخول ولي الأمر</h1>
            <p className="mt-2 text-sm leading-7 text-[#173d42]/60">
              أدخل رقم واتساب المسجل لدينا، ثم اكتب الرمز المرسل لك.
            </p>
            {authStep === "PHONE" ? (
              <>
                <div className="mt-5 grid grid-cols-[92px_1fr] gap-2" dir="ltr">
                  <input
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value.startsWith("+") ? event.target.value : `+${event.target.value.replace(/[^\d]/g, "")}`)}
                    placeholder="+90"
                    type="tel"
                    inputMode="tel"
                    lang="en"
                    className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-left font-mono text-sm outline-none"
                  />
                  <input
                    value={localPhone}
                    onChange={(event) => setLocalPhone(event.target.value.replace(/[^\d]/g, ""))}
                    placeholder="5xxxxxxxxx"
                    type="tel"
                    inputMode="tel"
                    lang="en"
                    className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-left font-mono text-sm outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={sendingCode}
                  className="mt-3 w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  إرسال رمز الدخول
                </button>
              </>
            ) : (
              <>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="رمز الدخول"
                  className="mt-5 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={verifyCode}
                  className="mt-3 w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white"
                >
                  دخول المحادثات
                </button>
              </>
            )}
            {feedback ? <p className="mt-3 rounded-2xl bg-[#fffaf2] p-3 text-sm font-bold text-[#173d42]">{feedback}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 rounded-[2rem] bg-[#173d42] p-5 text-white shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#f1d39d]">مراسلات التعليم</p>
            <h1 className="mt-1 text-3xl font-black">{title}</h1>
            <p className="mt-2 text-sm leading-7 text-white/70">{subtitle}</p>
          </div>
          {backHref ? (
            <a href={backHref} className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#173d42]">
              رجوع
            </a>
          ) : null}
        </header>

        {feedback ? <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm font-bold text-[#173d42] ring-1 ring-[#d9c8ad]">{feedback}</div> : null}

        <section className="grid min-h-[620px] overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#d9c8ad] lg:grid-cols-[360px_1fr]">
          <aside className={`${selectedConversationId ? "hidden" : "block"} border-l border-[#eadcc6] bg-[#fffaf2] lg:block`}>
            <div className="space-y-3 border-b border-[#eadcc6] p-4">
              {mode === "PARENT" ? (
                <>
                  <p className="text-sm font-black text-[#173d42]">ابدأ محادثة</p>
                  <div className="flex flex-wrap gap-2">
                    {teacherOptions.map((teacher) => (
                      <button
                        key={teacher.teacherId}
                        type="button"
                        onClick={() => createConversation({ type: "TEACHER", teacherId: teacher.teacherId })}
                        className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#173d42] ring-1 ring-[#d9c8ad]"
                      >
                        {teacher.teacherName}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => createConversation({ type: "SUPERVISION" })}
                      className="rounded-full bg-[#173d42] px-3 py-2 text-xs font-black text-white"
                    >
                      الإشراف
                    </button>
                  </div>
                </>
              ) : mode === "TEACHER" ? (
                <>
                  <p className="text-sm font-black text-[#173d42]">فتح محادثة مع ولي أمر</p>
                  <select
                    onChange={(event) => event.target.value && createConversation({ studentId: event.target.value })}
                    className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="">اختر الطالب</option>
                    {studentOptions.map((student) => (
                      <option key={student.studentId} value={student.studentId}>
                        {student.studentName}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p className="text-sm font-black text-[#173d42]">مراقبة كل المحادثات</p>
              )}
            </div>
            <div className="max-h-[540px] overflow-auto p-3">
              {loading ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-[#173d42]/60">جاري التحميل...</p>
              ) : conversations.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-[#173d42]/60">لا توجد محادثات بعد.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`mb-2 w-full rounded-2xl p-4 text-right transition ${
                      selectedConversationId === conversation.id ? "bg-[#173d42] text-white" : "bg-white text-[#173d42]"
                    }`}
                  >
                    <p className="font-black">{getConversationTitle(conversation)}</p>
                    {mode === "ADMIN" ? <p className="mt-1 text-xs opacity-70">{conversation.student.fullName}</p> : null}
                    <p className="mt-2 line-clamp-1 text-xs opacity-70">
                      {conversation.lastMessage?.body || conversation.lastMessage?.attachmentName || "محادثة جديدة"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className={`${selectedConversationId ? "flex" : "hidden"} min-h-[620px] min-w-0 flex-col bg-[#efe7d8] lg:flex`}>
            {selectedConversation ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-[#d9c8ad] bg-white px-5 py-4">
                  <div>
                    <p className="text-lg font-black text-[#173d42]">{getConversationTitle(selectedConversation)}</p>
                    {mode === "ADMIN" ? (
                      <p className="text-xs font-bold text-[#173d42]/60">الطالب: {selectedConversation.student.fullName}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedConversationId("")}
                    className="rounded-full bg-[#fffaf2] px-4 py-2 text-xs font-black text-[#173d42] ring-1 ring-[#d9c8ad] lg:hidden"
                  >
                    المحادثات
                  </button>
                </div>
                <div className="flex-1 space-y-3 overflow-auto p-3 sm:p-4">
                  {messages.map((message) => {
                    const mine =
                      (mode === "PARENT" && message.senderRole === "PARENT") ||
                      (mode === "TEACHER" && message.senderRole === "TEACHER") ||
                      (mode === "ADMIN" && message.senderRole === "ADMIN");
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[92%] overflow-hidden rounded-2xl px-4 py-3 shadow-sm sm:max-w-[78%] ${mine ? "bg-[#dcf8c6]" : "bg-white"}`}>
                          {mode === "ADMIN" ? (
                            <p className="mb-1 text-[11px] font-black text-[#173d42]/50">{message.senderName}</p>
                          ) : null}
                          {message.body ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#173d42] [overflow-wrap:anywhere]">
                              {renderMessageBody(message.body)}
                            </p>
                          ) : null}
                          {message.attachmentUrl ? (
                            message.attachmentType?.startsWith("audio/") ? (
                              <div className="mt-2 rounded-xl bg-black/5 p-2">
                                <audio controls src={message.attachmentUrl} className="h-10 w-full max-w-[240px] sm:max-w-[260px]" />
                                <a
                                  href={message.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 block text-xs font-black text-[#173d42]/70"
                                >
                                  تحميل الصوت
                                </a>
                              </div>
                            ) : (
                              <a
                                href={message.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 block break-words rounded-xl bg-black/5 px-3 py-2 text-xs font-black text-[#173d42] [overflow-wrap:anywhere]"
                              >
                                فتح المرفق: {message.attachmentName}
                              </a>
                            )
                          ) : null}
                          <p className="mt-2 text-[10px] text-[#173d42]/45">
                            {new Date(message.createdAt).toLocaleString("en-US")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-[#d9c8ad] bg-white p-2 sm:p-3">
                  {attachment ? (
                    <div className="mb-2 flex items-center justify-between rounded-xl bg-[#fffaf2] px-3 py-2 text-xs font-bold text-[#173d42]">
                      <span>{attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} className="font-black text-red-700">إزالة</button>
                    </div>
                  ) : null}
                  {isRecording ? (
                    <div className="mb-2 flex flex-col gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-100 sm:flex-row sm:items-center sm:justify-between">
                      <span>جار تسجيل الصوت... {formatRecordingTime(recordingSeconds)}</span>
                      <span>اترك الزر للإرسال</span>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="order-2 shrink-0 cursor-pointer rounded-full bg-[#fffaf2] px-4 py-3 text-sm font-black leading-none text-[#173d42] ring-1 ring-[#d9c8ad]">
                      ملف
                      <input
                        type="file"
                        accept="image/*,application/pdf,audio/*,video/*"
                        className="hidden"
                        onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                      />
                    </label>
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        startVoiceRecording();
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        stopVoiceRecording();
                      }}
                      onPointerCancel={() => stopVoiceRecording(true)}
                      onPointerLeave={(event) => {
                        if (event.pointerType === "mouse") stopVoiceRecording();
                      }}
                      onContextMenu={(event) => event.preventDefault()}
                      disabled={sending}
                      className={`order-2 shrink-0 select-none rounded-full px-4 py-3 text-sm font-black leading-none shadow-sm ring-1 ${
                        isRecording
                          ? "bg-red-600 text-white ring-red-600"
                          : "bg-[#fffaf2] text-[#173d42] ring-[#d9c8ad]"
                      } disabled:opacity-60`}
                      title="اضغط مطولا لتسجيل الصوت، واتركه للإرسال"
                    >
                      صوت
                    </button>
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="اكتب رسالة..."
                      className="order-1 min-h-12 w-full min-w-0 basis-full resize-none rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm leading-7 outline-none sm:order-2 sm:w-auto sm:basis-auto sm:flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={sending}
                      className="order-2 shrink-0 rounded-full bg-[#1f6358] px-5 py-3 text-sm font-black leading-none text-white disabled:opacity-60"
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-[#173d42]/60">
                اختر محادثة أو ابدأ محادثة جديدة.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
