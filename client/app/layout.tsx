import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "InterviewX | Technical Interview Platform",
  description:
    "Professional mock interview practice with real-time speech delivery analytics, computer vision gaze tracking, and Gemini evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
