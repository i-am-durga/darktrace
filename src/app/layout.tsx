import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DarkTrace | Threat Intelligence",
    template: "%s | DarkTrace",
  },
  description: "Defensive threat-intelligence research and analyst-reviewed investigations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
