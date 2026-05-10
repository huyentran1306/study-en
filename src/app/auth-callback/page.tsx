"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

const AUTH_USER_KEY = "studyen-auth-user";
const UID_KEY = "studyen-uid";

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const error = searchParams.get("error");
    const googleDisplayName = searchParams.get("display_name"); // passed from worker

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      setStatus("error");
      return;
    }
    if (!uid) {
      setErrorMsg("No user ID received");
      setStatus("error");
      return;
    }

    fetch(`${API_BASE}/users/${uid}`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: Record<string, unknown> }) => {
        if (!res.success) throw new Error("Failed to fetch user");
        const user = res.data;
        // Prefer display_name from Google (passed via URL) > DB display_name > username
        const displayName = googleDisplayName
          ? decodeURIComponent(googleDisplayName)
          : ((user.display_name as string) || (user.username as string));
        const authUser = {
          id: user.id,
          username: user.username,
          display_name: displayName,
          email: (user.email as string) || null,
          xp: (user.xp as number) || 0,
          level: (user.level as number) || 1,
          streak: (user.streak as number) || 0,
          coins: (user.coins as number) || 0,
          language: (user.language as string) || "en",
          app_mode: (user.app_mode as string) || "kid",
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
        localStorage.setItem(UID_KEY, uid);
        window.location.href = "/";
      })
      .catch((e: Error) => {
        setErrorMsg(e.message || "Failed to authenticate");
        setStatus("error");
      });
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-red-500 font-semibold mb-4">Đăng nhập thất bại: {errorMsg}</p>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="px-6 py-2 bg-kawaii-pink text-white rounded-xl font-semibold hover:opacity-90"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">✨</div>
        <p className="text-kawaii-pink font-semibold animate-pulse">Đang đăng nhập...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-5xl animate-bounce">✨</div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
