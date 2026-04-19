import type { Metadata } from "next";
import { AuthProvider } from "@raiseready/auth";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { Toaster } from "sonner";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Financial Model Pro | Raise Ready",
  description: "Build your investor-ready financial model in minutes",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-cream text-navy font-sans">
        <AuthProvider>
          <QueryClientProvider>
            {children}
            <Toaster position="top-right" />
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
