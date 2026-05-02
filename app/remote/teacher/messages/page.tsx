import EducationChatClient from "@/components/education-chat/EducationChatClient";

export default function RemoteTeacherMessagesPage() {
  return (
    <EducationChatClient
      mode="TEACHER"
      title="مراسلات أولياء الأمور"
      subtitle="محادثات تعليمية محفوظة مع أولياء أمور طلابك، تحت متابعة الإدارة."
      backHref="/remote/teacher/dashboard"
    />
  );
}
