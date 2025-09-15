import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserJourneyProvider } from "@/contexts/UserJourneyContext";
import { ModalQueueProvider } from "@/contexts/ModalQueueContext";
import { registerServiceWorker } from "@/utils/serviceWorker";

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
  // Performance optimizations
  other: {
    'font-display': 'swap',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Core Web Vitals monitoring
              if ('web-vital' in window) {
                import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                  getCLS(console.log);
                  getFID(console.log);
                  getFCP(console.log);
                  getLCP(console.log);
                  getTTFB(console.log);
                });
              }
              
              // Register Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('Service Worker: Registration successful', registration.scope);
                    })
                    .catch((error) => {
                      console.error('Service Worker: Registration failed', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
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
