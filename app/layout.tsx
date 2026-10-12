import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RuangTuntas | Asesmen yang Berlanjut",
  description: "Platform kuis real-time untuk asesmen, remedial, dan pengayaan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
