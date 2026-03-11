"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithMicrosoft } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const isMicrosoftAuthEnabled = process.env.NEXT_PUBLIC_AUTH_MODE === "microsoft";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const microsoftError = params.get("ms_error");
    if (!microsoftError) return;

    if (microsoftError === "auth_failed") {
      setError("Sign-in failed. Please try again or contact your administrator.");
      return;
    }

    if (microsoftError === "no_code") {
      setError("Sign-in was cancelled or did not complete. Please try again.");
      return;
    }

    setError("Sign-in failed. Please try again.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("Login form submitted with email:", email);
    const success = await login(email, password);

    if (success) {
      console.log("Login successful, redirecting to dashboard...");
      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push("/");
      }, 100);
    } else {
      console.log("Login failed");
      setError("Invalid email or password");
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError("");
    setIsMicrosoftLoading(true);
    try {
      await loginWithMicrosoft();
    } catch (err) {
      setError("Failed to sign in with Microsoft");
      setIsMicrosoftLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--bg)] to-[var(--sidebar-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-[var(--line)] bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="bg-black rounded p-4">
              <Image
                src="/valescape-logo.png"
                alt="Valescape"
                width={200}
                height={33}
                className="h-auto w-full max-w-[200px]"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-[var(--body-muted)]">
              Sign in to access KBM Construct
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Microsoft Sign In Button */}
            {isMicrosoftAuthEnabled && (
              <>
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={isMicrosoftLoading}
                  className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
                    <path fill="#F35325" d="M1 1h10v10H1z" />
                    <path fill="#81BC06" d="M12 1h10v10H12z" />
                    <path fill="#05A6F0" d="M1 12h10v10H1z" />
                    <path fill="#FFBA08" d="M12 12h10v10H12z" />
                  </svg>
                  {isMicrosoftLoading ? "Redirecting..." : "Sign in with Microsoft"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or sign in with email</span>
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-900"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="your.email@kbm.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-900"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Credentials - Only show when not using Microsoft auth */}
          {!isMicrosoftAuthEnabled && (
          <div className="mt-6 rounded border border-gray-300 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-gray-900">
              <p>
                <strong>Admin:</strong> admin@kbm.com / admin123
              </p>
              <p>
                <strong>Manager:</strong> john@kbm.com / password
              </p>
              <p>
                <strong>Commercial:</strong> sarah@kbm.com / password
              </p>
            </div>
          </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} KBM Construct. All rights reserved.
        </p>
      </div>
    </div>
  );
}
