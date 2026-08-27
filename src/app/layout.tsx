import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aviation Careers",
  description: "Find your next job in aviation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
