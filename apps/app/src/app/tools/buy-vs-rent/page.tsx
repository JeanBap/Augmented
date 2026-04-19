"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalculatorLayout } from "@/components/calculator-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

const buyVsRentSchema = z.object({
  homePrice: z.coerce.number().positive("Home price must be positive"),
  downPayment: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).max(100),
  loanTerm: z.coerce.number().int().positive(),
  propertyTaxRate: z.coerce.number().min(0).default(1.2),
  homeInsurance: z.coerce.number().min(0).default(1200),
  homeAppreciation: z.coerce.number().min(-10).max(10).default(3),
  rentPrice: z.coerce.number().positive("Monthly rent must be positive"),
  rentInflation: z.coerce.number().min(0).max(20).default(3),
  years: z.coerce.number().int().positive().default(30),
});

type BuyVsRentInputs = z.infer<typeof buyVsRentSchema>;

export default function BuyVsRentPage() {
  const [result, setResult] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyVsRentInputs>({
    resolver: zodResolver(buyVsRentSchema),
    defaultValues: {
      homePrice: 300000,
      downPayment: 60000,
      interestRate: 6.5,
      loanTerm: 360,
      propertyTaxRate: 1.2,
      homeInsurance: 1200,
      homeAppreciation: 3,
      rentPrice: 1500,
      rentInflation: 3,
      years: 30,
    },
  });

  const onSubmit = (data: BuyVsRentInputs) => {
    const loanAmount = data.homePrice - data.downPayment;
    const monthlyRate = data.interestRate / 100 / 12;
    const numberOfPayments = data.loanTerm;

    const monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const monthlyPropertyTax = (data.homePrice * (data.propertyTaxRate / 100)) / 12;
    const monthlyInsurance = data.homeInsurance / 12;
    const monthlyMaintenance = data.homePrice * 0.01 / 12; // 1% annual maintenance

    const totalMonths = data.years * 12;
    const buyData: any[] = [];
    const rentData: any[] = [];

    let homeValue = data.homePrice;
    let mortgageBalance = loanAmount;
    let totalBuyCost = data.downPayment;
    let totalRentCost = 0;
    let currentRent = data.rentPrice;

    for (let month = 1; month <= totalMonths; month++) {
      // Buying calculations
      const interestPayment = mortgageBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      mortgageBalance = Math.max(0, mortgageBalance - principalPayment);

      const totalMortgagePayment = month <= numberOfPayments ? monthlyPayment : 0;
      const monthlyBuyCost = totalMortgagePayment + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance;

      totalBuyCost += monthlyBuyCost;
      homeValue = data.homePrice * Math.pow(1 + data.homeAppreciation / 100, month / 12);

      // Renting calculations
      const monthlyRentCost = currentRent;
      totalRentCost += monthlyRentCost;
      currentRent = data.rentPrice * Math.pow(1 + data.rentInflation / 100, month / 12);

      if (month % 12 === 0) {
        buyData.push({
          year: month / 12,
          totalCost: totalBuyCost,
          homeValue: homeValue,
          netWorth: homeValue - (mortgageBalance || 0),
        });

        rentData.push({
          year: month / 12,
          totalCost: totalRentCost,
          homeValue: 0,
          netWorth: -totalRentCost,
        });
      }
    }

    const finalNetWorth = homeValue - mortgageBalance;

    setResult({
      homeValue,
      mortgageBalance,
      totalBuyCost,
      totalRentCost,
      buyNetWorth: finalNetWorth,
      rentNetWorth: -totalRentCost,
      difference: finalNetWorth - (-totalRentCost),
      chartData: buyData.map((item, i) => ({
        year: item.year,
        buyNetWorth: item.netWorth,
        rentNetWorth: rentData[i]?.netWorth || 0,
      })),
    });
  };

  return (
    <CalculatorLayout
      title="Buy vs Rent Analysis"
      description="Compare the long-term financial impact of buying a home versus renting"
      slug="buy-vs-rent"
    >
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Input Form */}
        <div>
          <Card className="calculator-card">
            <CardHeader>
              <CardTitle className="text-navy">Home & Market Details</CardTitle>
              <CardDescription>Enter your local market and personal preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3 pb-4 border-b border-navy/10">
                  <h4 className="font-semibold text-navy">Buying</h4>

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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-2">
                      Loan Term (months)
                    </label>
                    <Input
                      type="number"
                      placeholder="360"
                      {...register("loanTerm")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-2">
                      Property Tax (% annually)
                    </label>
                    <Input
                      type="number"
                      placeholder="1.2"
                      step="0.01"
                      {...register("propertyTaxRate")}
                    />
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-2">
                      Annual Home Appreciation (%)
                    </label>
                    <Input
                      type="number"
                      placeholder="3"
                      step="0.1"
                      {...register("homeAppreciation")}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-navy">Renting</h4>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-2">
                      Monthly Rent
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-navy/50">$</span>
                      <Input
                        type="number"
                        placeholder="1,500"
                        {...register("rentPrice")}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-2">
                      Annual Rent Inflation (%)
                    </label>
                    <Input
                      type="number"
                      placeholder="3"
                      step="0.1"
                      {...register("rentInflation")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-2">
                      Analysis Period (years)
                    </label>
                    <Input
                      type="number"
                      placeholder="30"
                      {...register("years")}
                    />
                  </div>
                </div>

                <Button type="submit" className="btn-primary w-full">
                  Compare
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
                  <CardTitle className="text-lg text-navy">Financial Winner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gold mb-2">
                    {result.difference > 0 ? "Buy" : "Rent"}
                  </div>
                  <p className="text-navy/60">
                    Difference: {formatCurrency(Math.abs(result.difference))}
                  </p>
                </CardContent>
              </Card>

              <Card className="calculator-card">
                <CardHeader>
                  <CardTitle>Net Worth Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-navy/70 mb-1">Buying</p>
                    <p className="text-2xl font-bold text-gold">
                      {formatCurrency(result.buyNetWorth)}
                    </p>
                    <p className="text-sm text-navy/60">
                      Home: {formatCurrency(result.homeValue)} | Mortgage: {formatCurrency(result.mortgageBalance)}
                    </p>
                  </div>

                  <div className="border-t border-navy/10 pt-4">
                    <p className="text-navy/70 mb-1">Renting</p>
                    <p className="text-2xl font-bold text-navy">
                      {formatCurrency(result.rentNetWorth)}
                    </p>
                    <p className="text-sm text-navy/60">
                      Total rent paid: {formatCurrency(result.totalRentCost)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="calculator-card h-full flex items-center justify-center min-h-96">
              <CardContent className="text-center">
                <p className="text-navy/60">
                  Enter your details to compare buying vs renting
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Chart */}
      {result && result.chartData.length > 0 && (
        <div className="mt-12 max-w-6xl mx-auto">
          <Card className="calculator-card">
            <CardHeader>
              <CardTitle>Net Worth Over Time</CardTitle>
              <CardDescription>
                Projected net worth trajectory over your chosen time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" label={{ value: "Year", position: "insideBottomRight", offset: -5 }} />
                    <YAxis label={{ value: "Net Worth ($)", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="buyNetWorth"
                      stroke="#d97706"
                      name="Buy Net Worth"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="rentNetWorth"
                      stroke="#1e3a8a"
                      name="Rent Net Worth"
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
