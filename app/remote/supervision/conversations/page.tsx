import EducationChatClient from "@/components/education-chat/EducationChatClient";

export default function RemoteSupervisionConversationsPage() {
  return (
    <EducationChatClient
      mode="SUPERVISION"
      title="مراسلات التعليم اليومية"
      subtitle="تواصل مباشر من الإشراف مع المعلمين وأولياء الأمور في صفحة واحدة، مع حفظ المحادثات والرجوع إليها عند الحاجة."
      backHref="/remote/supervision/dashboard"
    />
  );
}
