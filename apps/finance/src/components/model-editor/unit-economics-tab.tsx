"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface UnitEconomicsTabProps {
  modelId: string;
}

export function UnitEconomicsTab({ modelId: _modelId }: UnitEconomicsTabProps) {
  const [metrics, setMetrics] = useState({
    acq: 500, // Customer Acquisition Cost
    ltv: 5000, // Lifetime Value
    churn: 0.05, // Monthly churn rate
    arpu: 100, // Average Revenue Per User
  });

  const paybackPeriod = metrics.acq > 0 ? Math.ceil(metrics.acq / (metrics.arpu * (1 - metrics.churn))) : 0;
  const ltvToCac = metrics.acq > 0 ? (metrics.ltv / metrics.acq).toFixed(2) : "0";

  const mockData = [
    { month: 1, cumulativeLTV: 100, cumulativeCAC: 500, netValue: -400 },
    { month: 2, cumulativeLTV: 200, cumulativeCAC: 500, netValue: -300 },
    { month: 3, cumulativeLTV: 300, cumulativeCAC: 500, netValue: -200 },
    { month: 4, cumulativeLTV: 400, cumulativeCAC: 500, netValue: -100 },
    { month: 5, cumulativeLTV: 500, cumulativeCAC: 500, netValue: 0 },
    { month: 6, cumulativeLTV: 600, cumulativeCAC: 500, netValue: 100 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Customer Acquisition Cost ($)
          </label>
          <input
            type="number"
            value={metrics.acq}
            onChange={(e) => setMetrics({ ...metrics, acq: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Average Revenue Per User ($)
          </label>
          <input
            type="number"
            value={metrics.arpu}
            onChange={(e) => setMetrics({ ...metrics, arpu: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Monthly Churn Rate (%)
          </label>
          <input
            type="number"
            value={metrics.churn * 100}
            onChange={(e) => setMetrics({ ...metrics, churn: Number(e.target.value) / 100 })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Lifetime Value ($)
          </label>
          <input
            type="number"
            value={metrics.ltv}
            onChange={(e) => setMetrics({ ...metrics, ltv: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-gold">
          <p className="text-sm text-navy/60 mb-1">Payback Period</p>
          <p className="text-3xl font-bold text-navy">{paybackPeriod} months</p>
        </div>

        <div className="card p-6 border-l-4 border-l-gold">
          <p className="text-sm text-navy/60 mb-1">LTV / CAC Ratio</p>
          <p className="text-3xl font-bold text-navy">{ltvToCac}x</p>
        </div>

        <div className="card p-6 border-l-4 border-l-gold">
          <p className="text-sm text-navy/60 mb-1">Monthly Retention</p>
          <p className="text-3xl font-bold text-navy">{((1 - metrics.churn) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Payback Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cumulativeCAC" fill="#1a2a4a" />
            <Bar dataKey="cumulativeLTV" fill="#d4af37" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
