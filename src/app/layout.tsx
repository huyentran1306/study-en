import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TranTech Talk — Luyện Tiếng Anh & Call Solution Chuyên Nghiệp",
  description:
    "Nền tảng luyện tiếng Anh chuyên sâu cho dân Tech: AI Partner, Shadowing kịch bản Call Solution, Speech Lab và Spaced Repetition.",
  icons: {
    icon: [
      { url: "/mascot-logo.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/mascot-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontSans.variable, "font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-400")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
