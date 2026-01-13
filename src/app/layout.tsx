import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAYGSite - Pay Monthly Websites",
  description: "Professional websites for UK small businesses. No WordPress, no hassle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
