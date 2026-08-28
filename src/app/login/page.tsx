"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  FileText,
  History,
  LibraryBig,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useLogin } from "@/features/authentication";
import { ShaderBackground } from "@/features/authentication/components/ShaderBackground";
import { SHOW_NOTIFICATION_TOAST_AFTER_LOGIN } from "@/features/notifications";
import { SmoothLoadingScreen } from "@/components/orbit/SmoothNavigationProvider";

const heroFeatures = [
  {
    title: "Automate EES From Service Bulletin",
    description: "Extract critical information from SB documents and generate EES faster and more consistently.",
    icon: FileText,
  },
  {
    title: "Control & Compliance",
    description: "Monitor SB compliance status, due dates, and actions with full visibility and control.",
    icon: BadgeCheck,
  },
  {
    title: "ORBIT Library",
    description: "A centralized repository for SB, EES, and shop-visit data with structured access.",
    icon: LibraryBig,
  },
  {
    title: "Audit & Traceability",
    description: "Every action is recorded in the audit log for full accountability and traceability.",
    icon: History,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { submitLogin, isLoading, error } = useLogin();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    const result = await submitLogin({ email: email.trim(), password, rememberMe });
    if (!result) return;

    setIsRedirecting(true);
    window.localStorage.removeItem("orbit_user");
    window.sessionStorage.removeItem("orbit_user");
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem("orbit_user", JSON.stringify(result.user));
    window.sessionStorage.setItem(SHOW_NOTIFICATION_TOAST_AFTER_LOGIN, "1");
    router.replace(result.user.role.toUpperCase() === "ADMIN" ? "/administration" : "/dashboard");
    router.refresh();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061341] lg:h-screen">
      <link
        rel="preload"
        href="/images/loading.gif"
        as="image"
        type="image/gif"
      />
      <SmoothLoadingScreen visible={isLoading || isRedirecting} />

      <ShaderBackground className="absolute inset-0 h-full w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(3,15,62,0.68)_0%,rgba(4,70,220,0.24)_48%,rgba(2,12,48,0.72)_100%)]"
      />

      <div className="relative z-10 grid min-h-screen w-full max-w-full lg:h-full lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        <section className=" relative z-10 flex min-h-screen items-center justify-center bg-white px-[clamp(24px,4vw,64px)] py-[clamp(32px,5vh,48px)] text-[#07143F] lg:min-h-0 lg:min-w-0 lg:rounded-r-[24px]">
          <div className="mx-auto w-full max-w-[420px] mt-10">
            <div className="mb-3 text-center">
              <Image
                src="/logos/Logo_Orbit_Biru.png"
                alt="ORBIT"
                width={245}
                height={70}
                priority
                className="mx-auto h-auto w-[245px]"
              />
              <p className="mt-1 text-[14px] font-medium tracking-[-0.01em] text-[#0646DC]">
                Connecting Engineering Intelligence
              </p>
            </div>

            <div className="mb-10 text-center sm:mb-14">
              <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[#0646DC]">
                Welcome Back
              </h1>
              <p className="mt-1 text-sm text-[#0646DC]">Sign in to continue to ORBIT</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#081B72]">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={20}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    autoComplete="username"
                    required
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-xs placeholder:italic placeholder:text-slate-400 focus:border-[#0646DC] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="password" className="text-xs font-semibold text-[#081B72]">
                    Password
                  </label>
                  <button type="button" className="text-xs font-medium text-[#0646DC] hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole
                    size={20}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-xs placeholder:italic placeholder:text-slate-400 focus:border-[#0646DC] focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0646DC]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={event => setRememberMe(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-[#0646DC]"
                />
                Remember Me
              </label>

              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0646DC] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(6,70,220,0.18)] transition hover:bg-[#0438B7] focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="mt-10 text-center text-[10px] text-slate-400 lg:hidden">
              © 2026 ORBIT · GMF AeroAsia Engineering
            </p>
          </div>
        </section>

        <section className="relative hidden min-h-0 min-w-0 overflow-hidden text-white lg:block">
          <div className="relative z-10 flex h-full flex-col px-12 py-12 xl:px-16 2xl:px-24 2xl:py-16">
            <div className="ml-auto w-full max-w-[510px] text-right">
              <Image
                src="/logos/gmf-aeroasia.png"
                alt="GMF AeroAsia"
                width={241}
                height={51}
                priority
                className=" ml-auto h-auto w-[180px] brightness-0 invert xl:w-[150px]"
              />
              <div className="ml-auto mt-5 h-1 w-[210px] rounded-full bg-gradient-to-r from-white/70 to-[#0B8BFF]" />
              <h2 className="mt-5 text-[28px] font-bold leading-[1.35] tracking-[0.01em] text-white xl:text-[34px] 2xl:text-[39px]">
                Operational Review of
                <br />
                Bulletins, Intelligence &
                <br />
                Traceability
              </h2>
            </div>

            <div className="mt-auto ml-auto w-full max-w-[530px] space-y-4 pb-2 xl:space-y-5 2xl:pb-6">
              {heroFeatures.map(feature => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-center justify-end gap-5 text-right">
                    <div className="max-w-[410px]">
                      <h3 className="text-sm font-semibold text-white xl:text-base">{feature.title}</h3>
                      <p className="mt-0.5 text-[11px] leading-snug text-blue-50/85 xl:text-xs">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#132EBD]/90 ring-1 ring-white/5 xl:h-14 xl:w-14">
                      <Icon size={23} strokeWidth={1.8} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
