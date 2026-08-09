import { type FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function CustomerRegisterPage() {
  const { t, isRTL } = useI18n();
  const [, navigate] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = trpc.customerAuth.register.useMutation({
    onSuccess() {
      navigate("/account/login");
      window.alert(t.auth_registration_success);
    },
    onError(error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError(
        isRTL
          ? "يرجى ملء جميع الحقول المطلوبة."
          : "Please fill in all required fields."
      );
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(
        isRTL
          ? "يرجى إدخال بريد إلكتروني صالح."
          : "Please provide a valid email."
      );
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        isRTL
          ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف ورقم."
          : "Password must be at least 8 characters and include at least one letter and one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(isRTL ? "يجب أن تتطابق كلمات المرور." : "Passwords must match.");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
    } catch {
      // error handled in onError
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-sm border border-[#EAE4DC] bg-white p-8 shadow-sm">
        <h1
          className={`font-heading text-3xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
        >
          {t.auth_register_title}
        </h1>
        <p
          className={`mt-2 text-sm text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}
        >
          {t.auth_register_subtitle}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className={`mb-2 block text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.auth_first_name}
            </label>
            <Input
              type="text"
              value={firstName}
              onChange={event => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div>
            <label
              className={`mb-2 block text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.auth_last_name}
            </label>
            <Input
              type="text"
              value={lastName}
              onChange={event => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />
          </div>

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
              {t.auth_phone}
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={event => setPhone(event.target.value)}
              autoComplete="tel"
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
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label
              className={`mb-2 block text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.auth_confirm_password}
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            className="w-full bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
            disabled={registerMutation.isPending}
          >
            {t.auth_create_account}
          </Button>
        </form>

        <div
          className={`mt-6 text-sm ${isRTL ? "font-arabic text-right" : "text-left"}`}
        >
          <span>{t.auth_already_have_account}</span>{" "}
          <Link href="/account/login" className="text-[#2E2A25] font-medium">
            {t.auth_sign_in}
          </Link>
        </div>
      </div>
    </div>
  );
}
