"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalculatorLayout } from "@/components/calculator-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculateAPR, generateAmortizationData } from "@/lib/calculations/apr";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { AlertCircle } from "lucide-react";

const aprCalculatorSchema = z.object({
  principalAmount: z.coerce.number().positive("Loan amount must be positive"),
  annualRate: z.coerce.number().min(0).max(100, "Interest rate must be between 0 and 100"),
  loanTerm: z.coerce.number().int().positive("Loan term must be positive"),
  upfrontFees: z.coerce.number().min(0, "Fees must be non-negative").default(0),
});

type APRCalculatorInputs = z.infer<typeof aprCalculatorSchema>;

export default function APRCalculatorPage() {
  const [result, setResult] = useState<{
    apr: number;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    totalCost: number;
    amortizationData: any[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<APRCalculatorInputs>({
    resolver: zodResolver(aprCalculatorSchema),
    defaultValues: {
      principalAmount: 10000,
      annualRate: 5,
      loanTerm: 60,
      upfrontFees: 0,
    },
  });

  const onSubmit = (data: APRCalculatorInputs) => {
    const {
      apr,
      monthlyPayment,
      totalPayment,
      totalInterest,
      totalCost,
    } = calculateAPR({
      principal: data.principalAmount,
      annualRate: data.annualRate,
      loanTermMonths: data.loanTerm,
      upfrontFees: data.upfrontFees,
    });

    const amortizationData = generateAmortizationData({
      principal: data.principalAmount,
      monthlyRate: data.annualRate / 100 / 12,
      loanTermMonths: data.loanTerm,
    });

    setResult({
      apr,
      monthlyPayment,
      totalPayment,
      totalInterest,
      totalCost,
      amortizationData,
    });
  };

  const watchedValues = watch();

  return (
    <CalculatorLayout
      title="APR Calculator"
      description="Calculate the true Annual Percentage Rate of your loan, including all fees and interest charges"
      slug="apr-calculator"
    >
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Input Form */}
        <div>
          <Card className="calculator-card">
            <CardHeader>
              <CardTitle className="text-navy">Loan Details</CardTitle>
              <CardDescription>Enter your loan information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Loan Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-navy/50">$</span>
                    <Input
                      type="number"
                      placeholder="10,000"
                      {...register("principalAmount")}
                      className="pl-7"
                    />
                  </div>
                  {errors.principalAmount && (
                    <p className="text-red-500 text-sm mt-1">{errors.principalAmount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Annual Interest Rate (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="5"
                    step="0.01"
                    {...register("annualRate")}
                  />
                  {errors.annualRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.annualRate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Loan Term (months)
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    step="1"
                    {...register("loanTerm")}
                  />
                  {errors.loanTerm && (
                    <p className="text-red-500 text-sm mt-1">{errors.loanTerm.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Upfront Fees (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-navy/50">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      {...register("upfrontFees")}
                      className="pl-7"
                    />
                  </div>
                  {errors.upfrontFees && (
                    <p className="text-red-500 text-sm mt-1">{errors.upfrontFees.message}</p>
                  )}
                </div>

                <Button type="submit" className="btn-primary w-full">
                  Calculate APR
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div className="space-y-6">
              <Card className="calculator-card bg-gradient-to-br from-gold/5 to-transparent border-gold/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-navy">Your APR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-gold mb-2">
                    {formatPercentage(result.apr)}
                  </div>
                  <p className="text-navy/60">Annual Percentage Rate</p>
                </CardContent>
              </Card>

              <Card className="calculator-card">
                <CardHeader>
                  <CardTitle>Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Monthly Payment</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Total Interest</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Upfront Fees</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(watchedValues.upfrontFees || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-navy/5 px-3 rounded-lg">
                    <span className="font-semibold text-navy">Total Cost</span>
                    <span className="font-bold text-lg text-navy">
                      {formatCurrency(result.totalCost)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  APR includes your interest rate and all upfront fees amortized over the loan term
                </p>
              </div>
            </div>
          ) : (
            <Card className="calculator-card h-full flex items-center justify-center min-h-96">
              <CardContent className="text-center">
                <p className="text-navy/60">
                  Enter your loan details and click "Calculate APR" to see your results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Amortization Chart */}
      {result && result.amortizationData.length > 0 && (
        <div className="mt-12 max-w-6xl mx-auto">
          <Card className="calculator-card">
            <CardHeader>
              <CardTitle>Amortization Schedule</CardTitle>
              <CardDescription>
                Principal and interest breakdown over the life of your loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.amortizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="month"
                      label={{ value: "Month", position: "insideBottomRight", offset: -5 }}
                    />
                    <YAxis label={{ value: "Amount ($)", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="principalRemaining"
                      stroke="#1e3a8a"
                      name="Principal Remaining"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="interestPaid"
                      stroke="#d97706"
                      name="Interest Paid"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
