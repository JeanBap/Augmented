// Brand Colors
export const colors = {
  gold: "#C9A85A",
  navy: "#1A2B4A",
  cream: "#F5F3EF",
};

// Product IDs
export const productIds = {
  books: {
    startReady: "start-ready",
    raiseReady: "raise-ready",
    modelReady: "model-ready",
    exitReady: "exit-ready",
  },
  services: {
    fundraisingAudit: "fundraising-audit",
    fractionalAdvisory: "fractional-advisory",
    modelBuild: "model-build",
  },
};

// URLs
export const urls = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.raisereadybook.com",
  financeUrl:
    process.env.NEXT_PUBLIC_FINANCE_URL ||
    "https://finance.raisereadybook.com",
  mainUrl: "https://raisereadybook.com",
};

// Company Info
export const company = {
  name: "Raise Ready",
  email: "hello@raisereadybook.com",
  description:
    "Build your investor-ready financial model in 60 minutes. Learn how with our comprehensive books, services, and tools.",
};

// Navigation Items
export const navItems = [
  { label: "Home", href: "/" },
  { label: "Books", href: "/books" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
];
