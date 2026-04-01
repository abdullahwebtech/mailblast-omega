import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "MailBlast Pro | Scale Your Cold Outreach",
  description: "The ultimate intelligent engine for executing heavy-duty email campaigns.",
};

import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} bg-[#FAFAFA] text-[#0C0D10] antialiased min-h-screen`}>
        <AuthProvider>
          <ModalProvider>
            <SmoothScroll>
              <AppLayoutWrapper>
                {children}
              </AppLayoutWrapper>
            </SmoothScroll>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
