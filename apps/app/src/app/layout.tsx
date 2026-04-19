import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Finance Tools | Raise Ready",
  description: "Powerful personal finance calculators to help you make informed financial decisions",
  metadataBase: new URL("https://app.raisereadybook.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-navy">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
