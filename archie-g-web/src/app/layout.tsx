import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archie-G | Local Architecture Agent",
  description: "Offline AI agent for code architecture analysis and visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body>{children}</body>
    </html>
  );
}
