"use client";

import { ReactNode } from "react";
import { GameProvider, useGame } from "@/contexts/game-context";
import { OnboardingFlow } from "@/components/onboarding";
import { Navbar } from "@/components/navbar";
import { FloatingDecorations } from "@/components/floating-decorations";

function AppContent({ children }: { children: ReactNode }) {
  const { onboardingComplete } = useGame();

  if (!onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <>
      <FloatingDecorations />
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] relative z-10">{children}</main>
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
