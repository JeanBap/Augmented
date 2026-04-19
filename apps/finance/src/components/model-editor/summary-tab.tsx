"use client";

import { TrendingUp, DollarSign, Users, Clock } from "lucide-react";

interface SummaryTabProps {
  modelId: string;
}

export function SummaryTab({ modelId: _modelId }: SummaryTabProps) {
  const metrics = [
    {
      icon: DollarSign,
      label: "Year 5 Revenue",
      value: "$5.2M",
      change: "+45% YoY",
    },
    {
      icon: TrendingUp,
      label: "EBITDA Margin (Y5)",
      value: "35%",
      change: "+8pp YoY",
    },
    {
      icon: Users,
      label: "Team Size (Y5)",
      value: "28 people",
      change: "+200%",
    },
    {
      icon: Clock,
      label: "Breakeven",
      value: "Month 24",
      change: "-6 months",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <p className="text-sm text-navy/60 mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-navy mb-2">{metric.value}</p>
              <p className="text-xs text-green-600 font-medium">{metric.change}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold text-navy mb-6">Model Overview</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-navy mb-4">Revenue Drivers</h3>
            <ul className="space-y-2 text-sm text-navy/80">
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>Starting ARR: $120K (10% MoM growth)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>Market expansion year 2</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>Enterprise segment focus Y3+</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-navy mb-4">Cost Structure</h3>
            <ul className="space-y-2 text-sm text-navy/80">
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>70% Gross Margin target</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>OpEx scales to 40% of revenue</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>Path to 35% EBITDA margin</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold text-navy mb-6">5-Year Snapshot</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10">
                <th className="text-left py-3 px-4 font-semibold text-navy/60">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-navy/60">Year 1</th>
                <th className="text-right py-3 px-4 font-semibold text-navy/60">Year 2</th>
                <th className="text-right py-3 px-4 font-semibold text-navy/60">Year 3</th>
                <th className="text-right py-3 px-4 font-semibold text-navy/60">Year 4</th>
                <th className="text-right py-3 px-4 font-semibold text-navy/60">Year 5</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-navy/5 hover:bg-navy/2">
                <td className="py-3 px-4 font-medium">Revenue</td>
                <td className="text-right py-3 px-4">$1.2M</td>
                <td className="text-right py-3 px-4">$2.1M</td>
                <td className="text-right py-3 px-4">$3.5M</td>
                <td className="text-right py-3 px-4">$4.5M</td>
                <td className="text-right py-3 px-4">$5.2M</td>
              </tr>
              <tr className="border-b border-navy/5 hover:bg-navy/2">
                <td className="py-3 px-4 font-medium">Gross Profit</td>
                <td className="text-right py-3 px-4">$840K</td>
                <td className="text-right py-3 px-4">$1.47M</td>
                <td className="text-right py-3 px-4">$2.45M</td>
                <td className="text-right py-3 px-4">$3.15M</td>
                <td className="text-right py-3 px-4">$3.64M</td>
              </tr>
              <tr className="border-b border-navy/5 hover:bg-navy/2">
                <td className="py-3 px-4 font-medium">Operating Expenses</td>
                <td className="text-right py-3 px-4">$1.1M</td>
                <td className="text-right py-3 px-4">$1.4M</td>
                <td className="text-right py-3 px-4">$1.75M</td>
                <td className="text-right py-3 px-4">$2.0M</td>
                <td className="text-right py-3 px-4">$2.08M</td>
              </tr>
              <tr className="bg-gold/5 border border-gold/20">
                <td className="py-3 px-4 font-bold text-navy">EBITDA</td>
                <td className="text-right py-3 px-4 font-bold text-navy">-$260K</td>
                <td className="text-right py-3 px-4 font-bold text-navy">$70K</td>
                <td className="text-right py-3 px-4 font-bold text-navy">$700K</td>
                <td className="text-right py-3 px-4 font-bold text-navy">$1.15M</td>
                <td className="text-right py-3 px-4 font-bold text-gold">$1.56M</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-sm text-navy/60 py-6">
        <p>This summary displays key metrics. Drill into individual tabs for detailed analysis.</p>
      </div>
    </div>
  );
}
