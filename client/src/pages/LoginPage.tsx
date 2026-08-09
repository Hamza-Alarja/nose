import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const { t } = useI18n();
  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess() {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") ?? "/admin";
      window.location.href = next;
    },
    onError(error) {
      setError(error instanceof Error ? error.message : "Login failed");
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch {
      // Error is handled in onError.
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-sm border border-[#EAE4DC] bg-white p-8 shadow-sm">
        <div className="mb-5 flex justify-center">
          {storeSettings?.adminLoginLogoUrl ? (
            <img
              src={storeSettings.adminLoginLogoUrl}
              alt="Admin login logo"
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="font-heading text-2xl tracking-[0.24em] text-[#2E2A25]">
              NOSE
            </div>
          )}
        </div>
        <h1 className="font-heading text-2xl font-light text-[#2E2A25]">
          {t.page_login_title}
        </h1>
        <p className="mt-2 text-sm text-[#8A8078]">{t.page_login_subtitle}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            className="w-full bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in…" : t.auth_sign_in_admin}
          </Button>
        </form>
      </div>
    </div>
  );
}
