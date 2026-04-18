import LoginForm from "@/components/login/LoginForm";

export default function Page() {
  return (
    <main className="rahma-shell flex min-h-screen items-center justify-center p-5">
      <div className="rahma-card w-full max-w-md rounded-[2rem] p-8">
        <LoginForm title="دخول المعلم" subtitle="دخول المعلم للتعليم الحضوري." />
      </div>
    </main>
  );
}
