import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./island.css";
import { IslandAudio } from "@/components/island/audio-controls";
import { FloatingControls, IslandTopBar, StaleAssetGuard } from "@/components/island/island-chrome";

const baloo = Baloo_2({ subsets: ["latin", "vietnamese"], weight: ["600", "700", "800"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin", "vietnamese"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Chit Chat Island · Đảo Tám Chuyện — Luyện tiếng Anh giao tiếp 3 tháng",
  description: "Game học tiếng Anh giao tiếp A1 → B1 trong 13 tuần: nhập vai với cư dân đảo, câu cứu nguy, sổ từ ôn ngắt quãng và tám chuyện với AI.",
  icons: {
    icon: [
      { url: "/mascot-logo.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

export default function IslandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cci ${baloo.variable} ${nunito.variable} min-h-screen w-full overflow-x-hidden`}>
      <StaleAssetGuard />
      <IslandTopBar />
      {children}
      <IslandAudio />
      <FloatingControls />
    </div>
  );
}
