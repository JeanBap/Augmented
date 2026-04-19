"use client";

import { useState } from "react";

interface SensitivityTabProps {
  modelId: string;
}

export function SensitivityTab({ modelId: _modelId }: SensitivityTabProps) {
  const [paramA, setParamA] = useState("revenue-growth");
  const [paramB, setParamB] = useState("cogs-rate");
  const [steps, setSteps] = useState(5);

  const parameters = [
    { value: "revenue-growth", label: "Revenue Growth Rate" },
    { value: "cogs-rate", label: "COGS Rate" },
    { value: "opex-personnel", label: "Personnel Costs" },
    { value: "opex-marketing", label: "Marketing Spend" },
  ];

  // Mock sensitivity matrix
  const matrix = Array(steps)
    .fill(0)
    .map(() =>
      Array(steps)
        .fill(0)
        .map(() => Math.random() * 1000000 - 500000)
    );

  const minValue = Math.min(...matrix.map((row) => Math.min(...row)));
  const maxValue = Math.max(...matrix.map((row) => Math.max(...row)));

  const getColor = (value: number) => {
    const ratio = (value - minValue) / (maxValue - minValue);
    if (ratio > 0.66) return "bg-green-500";
    if (ratio > 0.33) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Parameter A
          </label>
          <select
            value={paramA}
            onChange={(e) => setParamA(e.target.value)}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          >
            {parameters.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Parameter B
          </label>
          <select
            value={paramB}
            onChange={(e) => setParamB(e.target.value)}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          >
            {parameters.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-navy/60 mb-2">
            Matrix Steps
          </label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(Math.max(2, Number(e.target.value)))}
            min="2"
            max="10"
            className="w-full px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>
      </div>

      <div className="card p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-navy mb-4">5-Year P&L Sensitivity</h3>
        <div className="inline-block">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-semibold text-navy/60 bg-navy/5 border border-navy/10">
                  {paramA.replace("-", " ")}
                </th>
                {Array(steps)
                  .fill(0)
                  .map((_, i) => (
                    <th
                      key={i}
                      className="p-2 text-xs font-semibold text-navy/60 bg-navy/5 border border-navy/10 text-center"
                    >
                      {(80 + i * 5)}%
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {Array(steps)
                .fill(0)
                .map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    <th className="p-2 text-xs font-semibold text-navy/60 bg-navy/5 border border-navy/10 text-right">
                      {(80 + rowIdx * 5)}%
                    </th>
                    {matrix[rowIdx].map((value, colIdx) => (
                      <td
                        key={`${rowIdx}-${colIdx}`}
                        className={`p-2 border border-navy/10 text-xs font-semibold text-white ${getColor(
                          value
                        )} text-center`}
                      >
                        {(value / 1000000).toFixed(1)}M
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Break-even</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Profitable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
