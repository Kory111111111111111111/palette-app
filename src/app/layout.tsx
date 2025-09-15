import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserJourneyProvider } from "@/contexts/UserJourneyContext";
import { ModalQueueProvider } from "@/contexts/ModalQueueContext";

export const metadata: Metadata = {
  title: "Palette Generator - AI-Powered Color Palette Creator",
  description: "Create beautiful, accessible color palettes for your UI designs using AI. Generate palettes from prompts, presets, or screenshots.",
  keywords: ["color palette", "UI design", "AI", "accessibility", "design tools"],
  authors: [{ name: "Palette Generator" }],
  openGraph: {
    title: "Palette Generator - AI-Powered Color Palette Creator",
    description: "Create beautiful, accessible color palettes for your UI designs using AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ThemeProvider>
          <UserJourneyProvider>
            <ModalQueueProvider>
              {children}
            </ModalQueueProvider>
          </UserJourneyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
