import EducationChatClient from "@/components/education-chat/EducationChatClient";

export default function RemoteSupervisionConversationsPage() {
  return (
    <EducationChatClient
      mode="ADMIN"
      title="مراسلات التعليم اليومية"
      subtitle="متابعة محادثات ولي الأمر مع المعلم أو الإشراف، والرد من مكان واحد داخل اللوحة الإشرافية."
      backHref="/remote/supervision/dashboard"
    />
  );
}
