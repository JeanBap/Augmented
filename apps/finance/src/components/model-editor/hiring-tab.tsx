"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface HiringRole {
  id: string;
  title: string;
  startMonth: number;
  salary: number;
  count: number;
}

interface HiringTabProps {
  modelId: string;
}

export function HiringTab({ modelId: _modelId }: HiringTabProps) {
  const [roles, setRoles] = useState<HiringRole[]>([
    { id: "1", title: "Engineer", startMonth: 1, salary: 120000, count: 1 },
    { id: "2", title: "Sales", startMonth: 2, salary: 100000, count: 1 },
  ]);

  const addRole = () => {
    setRoles([
      ...roles,
      {
        id: Date.now().toString(),
        title: "",
        startMonth: 1,
        salary: 0,
        count: 1,
      },
    ]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, updates: Partial<HiringRole>) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const totalAnnualCost = roles.reduce((sum, role) => sum + role.salary * role.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-navy">Hiring Plan</h3>
        <button
          onClick={addRole}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      <div className="card p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10">
              <th className="text-left py-2 px-4 font-medium text-navy/60">Role</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">Start Month</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">Count</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">Annual Salary</th>
              <th className="text-right py-2 px-4 font-medium text-navy/60">Total Cost</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-navy/5 hover:bg-navy/2">
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={role.title}
                    onChange={(e) => updateRole(role.id, { title: e.target.value })}
                    placeholder="e.g., Engineer"
                    className="w-full px-2 py-1 border border-navy/20 rounded"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={role.startMonth}
                    onChange={(e) => updateRole(role.id, { startMonth: Number(e.target.value) })}
                    min="1"
                    max="60"
                    className="w-full px-2 py-1 border border-navy/20 rounded text-right"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={role.count}
                    onChange={(e) => updateRole(role.id, { count: Number(e.target.value) })}
                    min="1"
                    className="w-full px-2 py-1 border border-navy/20 rounded text-right"
                  />
                </td>
                <td className="py-3 px-4 text-right">
                  <input
                    type="number"
                    value={role.salary}
                    onChange={(e) => updateRole(role.id, { salary: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-navy/20 rounded text-right"
                  />
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  ${(role.salary * role.count).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => removeRole(role.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6 bg-gold/5 border-gold/20">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-navy">Total Annual Headcount Cost</span>
          <span className="text-2xl font-bold text-gold">${totalAnnualCost.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
