import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "BhartX Academy — Mastery Learning OS",
  description: "AI-Powered Cognitive Learning Platform for NIELIT A-Level complete preparation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-dark text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
