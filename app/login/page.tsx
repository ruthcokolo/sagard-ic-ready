/** Route: `/login` — email/password sign-in view. */
import { Suspense } from "react";
import { LoginView } from "@/components/auth/LoginView";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f2ef] text-sm text-stone-500">
      Loading…
    </div>
  );
}

/** Renders the login form inside a Suspense boundary. */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  );
}
