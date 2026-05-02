import EducationChatClient from "@/components/education-chat/EducationChatClient";

export default function RemoteAdminConversationsPage() {
  return (
    <EducationChatClient
      mode="ADMIN"
      title="مراقبة مراسلات التعليم"
      subtitle="متابعة كل المحادثات التعليمية بين أولياء الأمور والمعلمين والإشراف."
      backHref="/remote/admin/dashboard"
    />
  );
}
