import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AntiInspect } from "./components/AntiInspect";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Bookmark – Web3-Styled AI Tools Dashboard",
  description: "Curated AI tools with a glossy Web3 UI: search, filter, and manage bookmarks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased`}>
        <AntiInspect />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="preconnect" href="https://www.google.com" />
        {children}
      </body>
    </html>
  );
}
