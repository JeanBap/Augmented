"use client";

import { BarChart3, Users, TrendingUp, Grid3x3, FileText, LayoutDashboard } from "lucide-react";

interface ModelEditorTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const TABS = [
  { id: "pl", label: "P&L", icon: BarChart3 },
  { id: "hiring", label: "Hiring", icon: Users },
  { id: "unit-economics", label: "Unit Economics", icon: TrendingUp },
  { id: "sensitivity", label: "Sensitivity", icon: Grid3x3 },
  { id: "report", label: "Report", icon: FileText },
  { id: "summary", label: "Summary", icon: LayoutDashboard },
];

export function ModelEditorTabs({ activeTab, onChange }: ModelEditorTabsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-navy/60 uppercase tracking-wider px-2">
        Sections
      </h3>
      <div className="space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-navy/60 hover:text-navy hover:bg-navy/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
