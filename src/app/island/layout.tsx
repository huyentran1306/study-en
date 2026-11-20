import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./island.css";
import { IslandAudio } from "@/components/island/audio-controls";
import { FloatingControls, IslandTopBar, StaleAssetGuard } from "@/components/island/island-chrome";

const baloo = Baloo_2({ subsets: ["latin", "vietnamese"], weight: ["600", "700", "800"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin", "vietnamese"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Chit Chat Island · Đảo Tám Chuyện — Luyện tiếng Anh giao tiếp 3 tháng",
  description: "Game luyện tiếng Anh giao tiếp qua 13 tuần chủ đề A1–B1, với nhập vai, cụm từ theo tình huống, ôn ngắt quãng và tám chuyện cùng cư dân đảo.",
  // Icon riêng của Đảo: chú shiba Bơ trên hòn đảo nhỏ có cây dừa.
  icons: {
    icon: [
      { url: "/island-icon.svg", type: "image/svg+xml" },
      { url: "/island-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/island-apple-icon.png", sizes: "180x180", type: "image/png" }],
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
