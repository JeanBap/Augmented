"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Trash2, Copy } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";

interface SavedCalculation {
  id: string;
  type: string;
  title: string;
  data: Record<string, any>;
  result: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for loading saved calculations from the database
    setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-white">
        <NavHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="calculator-card text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-navy">Sign In to View Your Calculations</CardTitle>
              <CardDescription>
                Create an account to save and track your calculations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login">
                <Button className="btn-primary">
                  Sign In to Your Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      <NavHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-navy mb-2">
            Welcome back, {user.email || "User"}
          </h1>
          <p className="text-lg text-navy/60">
            Track and manage your saved financial calculations
          </p>
        </div>

        {/* Saved Calculations */}
        <div>
          <h2 className="text-2xl font-bold text-navy mb-6">Saved Calculations</h2>

          {loading ? (
            <Card className="calculator-card">
              <CardContent className="py-8">
                <p className="text-center text-navy/60">Loading your calculations...</p>
              </CardContent>
            </Card>
          ) : calculations.length === 0 ? (
            <Card className="calculator-card">
              <CardHeader>
                <CardTitle className="text-navy">No Saved Calculations Yet</CardTitle>
                <CardDescription>
                  Start calculating to save your results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button className="btn-primary inline-flex items-center gap-2">
                    Browse Calculators
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {calculations.map((calc) => (
                <Card key={calc.id} className="calculator-card group hover:border-gold/30">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="text-navy">{calc.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(calc.updatedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Display key results based on calculation type */}
                    {calc.type === "apr" && (
                      <div className="space-y-2">
                        <p className="text-sm text-navy/70">
                          APR: <span className="font-semibold text-navy">{formatPercentage(calc.result.apr)}</span>
                        </p>
                        <p className="text-sm text-navy/70">
                          Monthly Payment: <span className="font-semibold text-navy">{formatCurrency(calc.result.monthlyPayment)}</span>
                        </p>
                      </div>
                    )}

                    {calc.type === "mortgage" && (
                      <div className="space-y-2">
                        <p className="text-sm text-navy/70">
                          Monthly Payment: <span className="font-semibold text-navy">{formatCurrency(calc.result.totalMonthlyPayment)}</span>
                        </p>
                        <p className="text-sm text-navy/70">
                          Total Interest: <span className="font-semibold text-navy">{formatCurrency(calc.result.totalInterest)}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-navy/10">
                      <Link href={`/tools/${calc.type}`} className="flex-1">
                        <Button variant="outline" className="w-full text-sm" size="sm">
                          Recalculate
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-sm text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
