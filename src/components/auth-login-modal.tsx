"use client";

import { useState } from "react";
import { GOOGLE_OAUTH_URL } from "@/lib/api";

interface AuthLoginModalProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, displayName?: string) => Promise<void>;
  onContinueAsGuest?: () => void;
}

export function AuthLoginModal({ onLogin, onRegister, onContinueAsGuest }: AuthLoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password, displayName.trim() || username.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const callbackUrl = `${window.location.origin}/auth-callback`;
    window.location.href = `${GOOGLE_OAUTH_URL}?state=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-kawaii-lavender/20 to-kawaii-pink/20 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-kawaii-pink/20 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">✨</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">StudyEN</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login" ? "Đăng nhập để tiếp tục học!" : "Tạo tài khoản mới 🎉"}
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex mb-5 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === "login" ? "bg-kawaii-pink text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === "register" ? "bg-kawaii-lavender text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tên hiển thị</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-kawaii-pink transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              required
              autoComplete="username"
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-kawaii-pink transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-kawaii-pink transition-colors"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-kawaii-pink transition-colors"
              />
            </div>
          )}
          {error && (
            <p className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              ⚠ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-kawaii-pink to-kawaii-lavender text-white font-bold rounded-xl text-sm transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "⏳ Đang xử lý..." : mode === "login" ? "🚀 Đăng nhập" : "🎉 Tạo tài khoản"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">hoặc</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Tiếp tục với Google
        </button>

        {/* Guest option */}
        {onContinueAsGuest && (
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Tiếp tục không đăng nhập →
          </button>
        )}
      </div>
    </div>
  );
}
