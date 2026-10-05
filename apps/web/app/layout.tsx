import type { Metadata } from "next";
import "./globals.css";
import UtmCapture from "../src/components/UtmCapture";

export const metadata: Metadata = {
  title: "TekRovia | Learning to Placement",
  description: "Your journey from learning to career success.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UtmCapture />
        {children}
      </body>
    </html>
  );
}
