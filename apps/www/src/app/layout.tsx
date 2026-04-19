import type { Metadata } from "next";
import { AuthProvider } from "@raiseready/auth";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raise Ready | Build Your Investor-Ready Financial Model",
  description:
    "Build your investor-ready financial model in 60 minutes. Learn how with our comprehensive books, services, and tools.",
  openGraph: {
    title: "Raise Ready | Build Your Investor-Ready Financial Model",
    description:
      "Build your investor-ready financial model in 60 minutes. Learn how with our comprehensive books, services, and tools.",
    url: "https://raisereadybook.com",
    type: "website",
    images: [
      {
        url: "https://raisereadybook.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Raise Ready",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Raise Ready | Build Your Investor-Ready Financial Model",
    description:
      "Build your investor-ready financial model in 60 minutes. Learn how with our comprehensive books, services, and tools.",
    images: ["https://raisereadybook.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased bg-brand-cream text-brand-navy" style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
