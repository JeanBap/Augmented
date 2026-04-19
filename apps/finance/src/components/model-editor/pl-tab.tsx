"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PLTabProps {
  modelId: string;
}

export function PLTab({ modelId: _modelId }: PLTabProps) {
  const [revenue, setRevenue] = useState({
    startMonth: 10000,
    growthRate: 0.1,
  });

  const [cogs, setCOGS] = useState({
    percentage: 0.3,
  });

  const [opex, setOpEx] = useState({
    personnel: 50000,
    marketing: 20000,
    operations: 15000,
  });

  // Mock data - in real implementation, calculate based on inputs
  const mockData = [
    { month: "Jan", revenue: 10000, cogs: 3000, opex: 85000, pl: -78000 },
    { month: "Feb", revenue: 12000, cogs: 3600, opex: 87000, pl: -78600 },
    { month: "Mar", revenue: 14400, cogs: 4320, opex: 89000, pl: -78920 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Starting Monthly Revenue
          </label>
          <input
            type="number"
            value={revenue.startMonth}
            onChange={(e) =>
              setRevenue({ ...revenue, startMonth: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Monthly Growth Rate (%)
          </label>
          <input
            type="number"
            value={revenue.growthRate * 100}
            onChange={(e) =>
              setRevenue({ ...revenue, growthRate: Number(e.target.value) / 100 })
            }
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            COGS (% of Revenue)
          </label>
          <input
            type="number"
            value={cogs.percentage * 100}
            onChange={(e) =>
              setCOGS({ percentage: Number(e.target.value) / 100 })
            }
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Personnel Costs
          </label>
          <input
            type="number"
            value={opex.personnel}
            onChange={(e) => setOpEx({ ...opex, personnel: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Marketing & Sales
          </label>
          <input
            type="number"
            value={opex.marketing}
            onChange={(e) => setOpEx({ ...opex, marketing: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Operations & Other
          </label>
          <input
            type="number"
            value={opex.operations}
            onChange={(e) => setOpEx({ ...opex, operations: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Projected P&L</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#d4af37"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="opex"
              stroke="#1a2a4a"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="pl"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-navy mb-4">Monthly Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10">
              <th className="text-left py-2 px-4 font-medium text-navy/60">Month</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">Revenue</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">COGS</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">Gross Profit</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">OpEx</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">P&L</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, idx) => (
              <tr key={idx} className="border-b border-navy/5 hover:bg-navy/2">
                <td className="py-2 px-4">{row.month}</td>
                <td className="text-right py-2 px-4">${row.revenue.toLocaleString()}</td>
                <td className="text-right py-2 px-4">${row.cogs.toLocaleString()}</td>
                <td className="text-right py-2 px-4">
                  ${(row.revenue - row.cogs).toLocaleString()}
                </td>
                <td className="text-right py-2 px-4">${row.opex.toLocaleString()}</td>
                <td className={`text-right py-2 px-4 font-medium ${row.pl < 0 ? "text-red-600" : "text-green-600"}`}>
                  ${row.pl.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
