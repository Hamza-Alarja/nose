import { type FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/_core/hooks/useCustomerAuth";

export default function CustomerLoginPage() {
  const { t, isRTL } = useI18n();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { refetch } = useCustomerAuth();

  const loginMutation = trpc.customerAuth.login.useMutation({
    async onSuccess() {
      setError("");
      await refetch();
      navigate("/account");
    },
    onError(error) {
      setError(t.auth_invalid_credentials);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await loginMutation.mutateAsync({ email, password });
    } catch {
      // handled in onError
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-sm border border-[#EAE4DC] bg-white p-8 shadow-sm">
        <h1
          className={`font-heading text-3xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
        >
          {t.auth_sign_in}
        </h1>
        <p
          className={`mt-2 text-sm text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}
        >
          {t.auth_sign_in_prompt}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className={`mb-2 block text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.account_email}
            </label>
            <Input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label
              className={`mb-2 block text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.auth_password}
            </label>
            <Input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">{t.auth_invalid_credentials}</p>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
            disabled={loginMutation.isPending}
          >
            {t.auth_sign_in}
          </Button>
        </form>

        <div
          className={`mt-6 text-sm ${isRTL ? "font-arabic text-right" : "text-left"}`}
        >
          <span>{t.auth_already_have_account}</span>{" "}
          <Link href="/account/register" className="text-[#2E2A25] font-medium">
            {t.auth_create_account}
          </Link>
        </div>
      </div>
    </div>
  );
}
