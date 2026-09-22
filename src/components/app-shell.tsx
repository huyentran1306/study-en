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
import { Loader2 } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

/** Ambient mesh background with subtle glow, zero visual distractions */
function ProBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Subtle background tech grid */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Soft atmospheric gradient highlights */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px]" />
      <div className="absolute top-1/2 -right-20 w-[550px] h-[450px] rounded-full bg-sky-500/10 dark:bg-sky-500/10 blur-[130px]" />
      <div className="absolute -bottom-32 left-1/3 w-[600px] h-[400px] rounded-full bg-violet-500/5 dark:bg-violet-600/10 blur-[140px]" />
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

  // Show modern sleek auth loading spinner
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-medium text-muted-foreground tracking-wide">Loading workspace...</span>
      </div>
    );
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
      <ProBackground />
      <FloatingDecorations />
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] relative z-10 pb-24 md:pb-8">{children}</main>
      <MobileBottomNav />
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
