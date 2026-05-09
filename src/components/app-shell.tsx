"use client";

import { ReactNode, useEffect, useState } from "react";
import { GameProvider, useGame } from "@/contexts/game-context";
import { OnboardingFlow } from "@/components/onboarding";
import { Navbar } from "@/components/navbar";
import { FloatingDecorations } from "@/components/floating-decorations";
import { XPParticleLayer } from "@/components/fx/xp-particles";
import { AchievementToast, useAchievementToastManager } from "@/components/achievement-toast";
import { AuthLoginModal } from "@/components/auth-login-modal";
import { usePathname } from "next/navigation";

/** Animated gradient blobs that float in the background */
function KawaiiBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {/* Big blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-kawaii-lavender/30 blur-3xl animate-blob" />
      <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-kawaii-pink/25 blur-3xl animate-blob-2 animation-delay-2000" />
      <div className="absolute bottom-0 -left-20 w-[450px] h-[450px] rounded-full bg-kawaii-sky/20 blur-3xl animate-blob-3 animation-delay-4000" />
      <div className="absolute bottom-20 right-10 w-[350px] h-[350px] rounded-full bg-kawaii-mint/20 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-kawaii-yellow/15 blur-3xl animate-blob-2" />
      {/* Floating emoji sparkles */}
      {["✨","⭐","🌟","💫","🌈","🎀","💜","🌸","🦋","🍭"].map((e, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-float-up"
          style={{
            left: `${5 + i * 9}%`,
            top: `${8 + (i % 4) * 22}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 3)}s`,
            opacity: 0.18,
          }}
        >
          {e}
        </div>
      ))}
    </div>
  );
}

function AppContent({ children }: { children: ReactNode }) {
  const { onboardingComplete, isAuthenticated, authLoading, authLoginUser, authRegisterUser } = useGame();
  const { current: currentAchievement, dismiss } = useAchievementToastManager();
  const pathname = usePathname();
  const [guestMode, setGuestMode] = useState(false);

  // Load guest mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGuestMode(!!localStorage.getItem('studyen-guest-mode'));
    }
  }, []);

  // Allow auth-callback page to bypass auth
  if (pathname === "/auth-callback") {
    return <>{children}</>;
  }

  // Show auth modal unless authenticated or guest mode
  if (authLoading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-kawaii-lavender/20 to-kawaii-pink/20"><div className="text-4xl animate-bounce">✨</div></div>;
  }

  if (!isAuthenticated && !guestMode) {
    return (
      <AuthLoginModal
        onLogin={authLoginUser}
        onRegister={authRegisterUser}
        onContinueAsGuest={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('studyen-guest-mode', '1');
          }
          setGuestMode(true);
        }}
      />
    );
  }

  if (!onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <>
      <KawaiiBackground />
      <FloatingDecorations />
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] relative z-10">{children}</main>
      <XPParticleLayer />
      <AchievementToast achievement={currentAchievement} onDismiss={dismiss} />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <AppContent>{children}</AppContent>
    </GameProvider>
  );
}

