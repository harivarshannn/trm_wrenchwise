import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wrenchwise TRMS | Recruiter Portal",
  description: "Enterprise-grade Trainer Recruitment Management System. OCR automated resume parsing, recruitment tracking, and status operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-50 text-slate-900 font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
