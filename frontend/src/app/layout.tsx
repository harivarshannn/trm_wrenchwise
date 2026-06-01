import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wrenchwise TRMS | Recruiter Portal",
  description: "Enterprise-grade Trainer Recruitment Management System. OCR automated resume parsing, recruitment tracking, and status operations.",
  themeColor: "#00BFA5",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-50 text-slate-900 font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
