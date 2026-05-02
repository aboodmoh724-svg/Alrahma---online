import EducationChatClient from "@/components/education-chat/EducationChatClient";

export default function ParentMessagesPage() {
  return (
    <EducationChatClient
      mode="PARENT"
      title="مراسلات التعليم"
      subtitle="تواصل محدود ومتابع مع المعلم أو الإشراف بخصوص العملية التعليمية."
    />
  );
}
