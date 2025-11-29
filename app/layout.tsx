import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://apiq.app"),
  title: "APIQ: The Ultimate Interactive Quiz Platform",
  description: "Transform learning and assessment with real-time, interactive quizzes. A comprehensive platform for educators, trainers, and event organizers.",
  keywords: ["quiz", "interactive quiz", "real-time quiz", "quiz platform", "education", "assessment", "trivia", "live quiz"],
  authors: [{ name: "Tain Yan Tun", url: "https://github.com/TainYanTun/quiz-app" }],
  openGraph: {
    title: "APIQ: The Ultimate Interactive Quiz Platform",
    description: "Transform learning and assessment with real-time, interactive quizzes.",
    type: "website",
    url: "https://apiq.app", // Replace with your actual domain
    images: [
      {
        url: "/icon.svg", 
        alt: "APIQ: The Ultimate Interactive Quiz Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APIQ: The Ultimate Interactive Quiz Platform",
    description: "Transform learning and assessment with real-time, interactive quizzes.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
