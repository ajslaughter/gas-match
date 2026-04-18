import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gas Match — cheapest gas near you",
  description: "Live gas price comparison using OpenStreetMap + free data sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
