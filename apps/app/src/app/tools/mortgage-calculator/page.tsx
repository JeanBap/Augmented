"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalculatorLayout } from "@/components/calculator-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";

const mortgageCalculatorSchema = z.object({
  homePrice: z.coerce.number().positive("Home price must be positive"),
  downPayment: z.coerce.number().min(0, "Down payment must be non-negative"),
  interestRate: z.coerce.number().min(0).max(100, "Interest rate must be between 0 and 100"),
  loanTerm: z.coerce.number().int().positive("Loan term must be positive"),
  propertyTaxRate: z.coerce.number().min(0).default(1.2),
  homeInsurance: z.coerce.number().min(0).default(1200),
});

type MortgageCalculatorInputs = z.infer<typeof mortgageCalculatorSchema>;

export default function MortgageCalculatorPage() {
  const [result, setResult] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MortgageCalculatorInputs>({
    resolver: zodResolver(mortgageCalculatorSchema),
    defaultValues: {
      homePrice: 300000,
      downPayment: 60000,
      interestRate: 6.5,
      loanTerm: 360,
      propertyTaxRate: 1.2,
      homeInsurance: 1200,
    },
  });

  const onSubmit = (data: MortgageCalculatorInputs) => {
    const loanAmount = data.homePrice - data.downPayment;
    const monthlyRate = data.interestRate / 100 / 12;
    const numberOfPayments = data.loanTerm;

    // Calculate monthly payment using amortization formula
    const monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const monthlyPropertyTax = (data.homePrice * (data.propertyTaxRate / 100)) / 12;
    const monthlyInsurance = data.homeInsurance / 12;
    const totalMonthlyPayment = monthlyPayment + monthlyPropertyTax + monthlyInsurance;

    const totalPaid = monthlyPayment * numberOfPayments;
    const totalInterest = totalPaid - loanAmount;

    setResult({
      loanAmount,
      monthlyPayment,
      monthlyPropertyTax,
      monthlyInsurance,
      totalMonthlyPayment,
      totalInterest,
      totalPaid,
      totalDownPayment: data.downPayment,
      downPaymentPercent: (data.downPayment / data.homePrice) * 100,
    });
  };

  const watchedValues = watch();

  return (
    <CalculatorLayout
      title="Mortgage Calculator"
      description="Estimate your monthly mortgage payment, total interest, and complete amortization schedule"
      slug="mortgage-calculator"
    >
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Input Form */}
        <div>
          <Card className="calculator-card">
            <CardHeader>
              <CardTitle className="text-navy">Mortgage Details</CardTitle>
              <CardDescription>Enter your property and loan information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Home Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-navy/50">$</span>
                    <Input
                      type="number"
                      placeholder="300,000"
                      {...register("homePrice")}
                      className="pl-7"
                    />
                  </div>
                  {errors.homePrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.homePrice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Down Payment
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-navy/50">$</span>
                    <Input
                      type="number"
                      placeholder="60,000"
                      {...register("downPayment")}
                      className="pl-7"
                    />
                  </div>
                  {errors.downPayment && (
                    <p className="text-red-500 text-sm mt-1">{errors.downPayment.message}</p>
                  )}
                  {watchedValues.homePrice && watchedValues.downPayment && (
                    <p className="text-sm text-navy/60 mt-1">
                      {formatPercentage((watchedValues.downPayment / watchedValues.homePrice) * 100)} of home price
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Interest Rate (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="6.5"
                    step="0.01"
                    {...register("interestRate")}
                  />
                  {errors.interestRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.interestRate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Loan Term (months)
                  </label>
                  <Input
                    type="number"
                    placeholder="360"
                    step="1"
                    {...register("loanTerm")}
                  />
                  {errors.loanTerm && (
                    <p className="text-red-500 text-sm mt-1">{errors.loanTerm.message}</p>
                  )}
                  <p className="text-sm text-navy/60 mt-1">
                    {watchedValues.loanTerm ? (watchedValues.loanTerm / 12).toFixed(1) : "30"} years
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Property Tax Rate (% annually)
                  </label>
                  <Input
                    type="number"
                    placeholder="1.2"
                    step="0.01"
                    {...register("propertyTaxRate")}
                  />
                  {errors.propertyTaxRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.propertyTaxRate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Home Insurance ($ annually)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-navy/50">$</span>
                    <Input
                      type="number"
                      placeholder="1,200"
                      {...register("homeInsurance")}
                      className="pl-7"
                    />
                  </div>
                  {errors.homeInsurance && (
                    <p className="text-red-500 text-sm mt-1">{errors.homeInsurance.message}</p>
                  )}
                </div>

                <Button type="submit" className="btn-primary w-full">
                  Calculate Payment
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
                  <CardTitle className="text-2xl text-navy">Monthly Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-gold mb-2">
                    {formatCurrency(result.totalMonthlyPayment)}
                  </div>
                  <p className="text-navy/60">Including taxes, insurance & HOA</p>
                </CardContent>
              </Card>

              <Card className="calculator-card">
                <CardHeader>
                  <CardTitle>Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Principal & Interest</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Property Tax</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.monthlyPropertyTax)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Home Insurance</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.monthlyInsurance)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="calculator-card">
                <CardHeader>
                  <CardTitle>Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Loan Amount</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.loanAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-navy/10">
                    <span className="text-navy/70">Total Interest</span>
                    <span className="font-semibold text-navy">
                      {formatCurrency(result.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-navy/5 px-3 rounded-lg">
                    <span className="font-semibold text-navy">Total Cost</span>
                    <span className="font-bold text-lg text-navy">
                      {formatCurrency(result.totalPaid + (result.totalMonthlyPayment - result.monthlyPayment) * 360)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="calculator-card h-full flex items-center justify-center min-h-96">
              <CardContent className="text-center">
                <p className="text-navy/60">
                  Enter your mortgage details to see your estimated payment
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CalculatorLayout>
  );
}
