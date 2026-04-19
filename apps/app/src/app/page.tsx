"use client";

import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calculator, Home as HomeIcon, DollarSign, TrendingUp, Heart, PieChart } from "lucide-react";

const categories = {
  "APR & Loans": [
    {
      slug: "apr-calculator",
      title: "APR Calculator",
      description: "Calculate the true Annual Percentage Rate of any loan including fees and interest",
      icon: Calculator,
    },
  ],
  "Mortgage": [
    {
      slug: "mortgage-calculator",
      title: "Mortgage Calculator",
      description: "Estimate your monthly mortgage payment, total interest, and amortization",
      icon: HomeIcon,
    },
    {
      slug: "buy-vs-rent",
      title: "Buy vs Rent Analysis",
      description: "Compare the financial impact of buying versus renting",
      icon: DollarSign,
    },
  ],
  "Budgeting": [
    {
      slug: "budget-planner",
      title: "Budget Planner",
      description: "Create and manage a comprehensive monthly budget",
      icon: PieChart,
    },
  ],
  "Retirement": [
    {
      slug: "retirement-calculator",
      title: "Retirement Calculator",
      description: "Plan your retirement with our comprehensive savings calculator",
      icon: TrendingUp,
    },
  ],
  "Investment": [
    {
      slug: "compound-interest",
      title: "Compound Interest Calculator",
      description: "See how your investments grow with compound interest",
      icon: TrendingUp,
    },
  ],
  "Health": [
    {
      slug: "healthcare-cost",
      title: "Healthcare Cost Estimator",
      description: "Estimate your healthcare expenses and coverage options",
      icon: Heart,
    },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      <NavHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
            Personal Finance Tools
          </h1>
          <p className="text-lg md:text-xl text-navy/70 max-w-2xl mx-auto">
            Empower your financial decisions with our collection of powerful calculators and analysis tools
          </p>
        </div>

        {/* Calculator Categories */}
        <div className="space-y-16">
          {Object.entries(categories).map(([category, calculators]) => (
            <section key={category}>
              <h2 className="text-2xl md:text-3xl font-bold text-navy mb-8">
                {category}
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {calculators.map((calc) => {
                  const IconComponent = calc.icon;
                  return (
                    <Link key={calc.slug} href={`/tools/${calc.slug}`}>
                      <Card className="calculator-card h-full hover:border-gold/30 cursor-pointer group">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-gold/10 rounded-lg group-hover:bg-gold/20 transition-colors">
                              <IconComponent className="w-6 h-6 text-gold" />
                            </div>
                          </div>
                          <CardTitle className="text-navy">{calc.title}</CardTitle>
                          <CardDescription className="text-navy/60">
                            {calc.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                            Use Calculator
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-navy rounded-2xl p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-cream mb-4">
            Track Your Financial Progress
          </h3>
          <p className="text-cream/80 mb-8 max-w-2xl mx-auto">
            Sign in to save your calculations, track changes over time, and compare scenarios
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-navy font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Sign In to Save Calculations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
