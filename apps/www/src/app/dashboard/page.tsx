"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ExternalLink, Download, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      fetchPurchases();
    }
  }, [user, loading]);

  async function fetchPurchases() {
    try {
      // This would connect to your actual API
      // const response = await fetch('/api/purchases', {
      //   headers: { 'Authorization': `Bearer ${user.id}` }
      // });
      // const data = await response.json();
      // setPurchases(data);
      setLoadingPurchases(false);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setLoadingPurchases(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="section-padding bg-brand-cream">
          <div className="container-wide text-center">
            <p>Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="section-padding bg-brand-cream">
          <div className="container-wide text-center">
            <h1 className="text-4xl font-serif font-bold mb-4">
              Sign in to access your dashboard
            </h1>
            <p className="text-gray-600 mb-8">
              Please log in to view your purchases and access your resources.
            </p>
            <Link href="/auth/login" className="btn-primary">
              Sign In <ArrowRight className="inline ml-2 w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const mockPurchases = [
    {
      id: 1,
      title: "Model Ready Book",
      type: "book",
      price: 9.99,
      purchaseDate: "2024-03-10",
      status: "completed",
      accessUrl: "#",
    },
    {
      id: 2,
      title: "Fundraising Readiness Audit",
      type: "service",
      price: 990,
      purchaseDate: "2024-02-28",
      status: "in-progress",
      accessUrl: "#",
    },
  ];

  return (
    <>
      <Navigation />

      <main>
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-brand-navy to-brand-navy text-brand-cream">
          <div className="container-wide">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-2">
              Your Dashboard
            </h1>
            <p className="text-lg text-brand-cream/90">
              Welcome back, {user.email}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Card */}
                <div className="card p-6">
                  <h2 className="text-lg font-serif font-bold mb-4">
                    Account
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-brand-navy">{user.email}</p>
                    </div>
                    <button className="w-full btn-secondary text-sm py-2">
                      Update Profile
                    </button>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="card p-6">
                  <h2 className="text-lg font-serif font-bold mb-4">
                    Quick Links
                  </h2>
                  <div className="space-y-2">
                    <Link
                      href={process.env.NEXT_PUBLIC_APP_URL || "#"}
                      className="flex items-center text-gold hover:text-gold/80 text-sm font-semibold"
                    >
                      Financial Model Builder
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                    <Link
                      href={process.env.NEXT_PUBLIC_FINANCE_URL || "#"}
                      className="flex items-center text-gold hover:text-gold/80 text-sm font-semibold"
                    >
                      Finance Tools
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                    <Link
                      href="/services"
                      className="flex items-center text-gold hover:text-gold/80 text-sm font-semibold"
                    >
                      Services
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Purchases */}
                <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold mb-6">
                    Your Purchases
                  </h2>

                  {loadingPurchases ? (
                    <div className="card p-6 text-center">
                      <p>Loading purchases...</p>
                    </div>
                  ) : mockPurchases.length > 0 ? (
                    <div className="space-y-4">
                      {mockPurchases.map((purchase) => (
                        <div key={purchase.id} className="card p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-brand-navy mb-1">
                                {purchase.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Purchased on{" "}
                                {new Date(
                                  purchase.purchaseDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gold">
                                ${purchase.price}
                              </p>
                              <span
                                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mt-2 ${
                                  purchase.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {purchase.status === "completed"
                                  ? "Available"
                                  : "In Progress"}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-4 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              {purchase.type === "book"
                                ? "Book - Instant Download"
                                : "Service - Access Your Resources"}
                            </p>
                            <div className="flex gap-2">
                              {purchase.status === "completed" && (
                                <button className="btn-ghost flex items-center text-sm">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </button>
                              )}
                              <Link
                                href={purchase.accessUrl}
                                className="btn-primary flex items-center text-sm py-2 px-4"
                              >
                                Access
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-12 text-center">
                      <h3 className="text-xl font-serif font-bold mb-4">
                        No purchases yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start by exploring our books and services
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/books" className="btn-primary">
                          Browse Books
                        </Link>
                        <Link href="/services" className="btn-secondary">
                          View Services
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    Recommendations
                  </h2>
                  <div className="grid gap-4">
                    {[
                      {
                        title: "Start Ready",
                        description: "Perfect foundation for new founders",
                        price: "$4.99",
                      },
                      {
                        title: "Fractional Fundraise Advisory",
                        description: "Get ongoing expert guidance",
                        price: "$2,000/mo",
                      },
                    ].map((rec, idx) => (
                      <div key={idx} className="card p-6 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-brand-navy mb-1">
                            {rec.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {rec.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gold mb-2">
                            {rec.price}
                          </p>
                          <button className="btn-secondary text-sm py-2 px-4">
                            Learn More
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-brand-navy text-brand-cream">
          <div className="container-narrow text-center">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Ready to take the next step?
            </h2>
            <p className="text-lg text-brand-cream/90 mb-8">
              Explore our complete suite of tools and services to accelerate
              your fundraising journey.
            </p>
            <Link
              href={process.env.NEXT_PUBLIC_APP_URL || "#"}
              className="btn-primary"
            >
              Open Model Builder
              <ExternalLink className="inline ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
