import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { FloatingChatProvider } from "@/lib/floating-chat-context";
import RegisterServiceWorker from "./register-sw";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KBM Construct | Construction Management",
  description:
    "Complete construction management platform - Timesheets, Projects, Site Diary, Fleet, and more for field teams.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KBM Construct",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ff8b2c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${sora.variable} antialiased h-full`}>
        <AuthProvider>
          <FloatingChatProvider>
            <RegisterServiceWorker />
            <PushNotificationPrompt />
            {children}
          </FloatingChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
