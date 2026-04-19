"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@raiseready/auth";
import { NavHeader } from "@/components/nav-header";
import { ModelEditorTabs } from "@/components/model-editor/tabs";
import { Save, Download } from "lucide-react";
import { toast } from "sonner";

export default function ModelEditorPage() {
  const params = useParams();
  const { user: _user } = useAuth();
  const [activeTab, setActiveTab] = useState("pl");
  const [isSaving, setIsSaving] = useState(false);

  const modelId = params.id as string;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save model to Supabase
      toast.success("Model saved successfully");
    } catch (error) {
      toast.error("Failed to save model");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      // Check if user has paid for export
      const response = await fetch(`/api/models/${modelId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 402) {
        // Payment required
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
        return;
      }

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-model-${modelId}.xlsx`;
      a.click();
      toast.success("Model exported successfully");
    } catch (error) {
      toast.error("Failed to export model");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <NavHeader />
      <div className="border-b border-navy/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Financial Model Editor</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 border border-navy/20 text-navy font-medium rounded-lg hover:bg-navy/5 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-navy font-medium rounded-lg hover:bg-gold/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-130px)]">
        <div className="w-1/4 bg-white border-r border-navy/10 overflow-auto">
          <div className="p-4">
            <ModelEditorTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-cream">
          {activeTab === "pl" && <PLTabContent />}
          {activeTab === "hiring" && <HiringTabContent />}
          {activeTab === "unit-economics" && <UnitEconomicsTabContent />}
          {activeTab === "sensitivity" && <SensitivityTabContent />}
          {activeTab === "report" && <ReportTabContent />}
          {activeTab === "summary" && <SummaryTabContent />}
        </div>
      </div>
    </div>
  );
}

function PLTabContent() {
  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Profit & Loss</h2>
      <p className="text-navy/60">P&L tab content coming soon...</p>
    </div>
  );
}

function HiringTabContent() {
  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Hiring Plan</h2>
      <p className="text-navy/60">Hiring tab content coming soon...</p>
    </div>
  );
}

function UnitEconomicsTabContent() {
  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Unit Economics</h2>
      <p className="text-navy/60">Unit economics tab content coming soon...</p>
    </div>
  );
}

function SensitivityTabContent() {
  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Sensitivity Analysis</h2>
      <p className="text-navy/60">Sensitivity tab content coming soon...</p>
    </div>
  );
}

function ReportTabContent() {
  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Board Report</h2>
      <p className="text-navy/60">Report tab content coming soon...</p>
    </div>
  );
}

function SummaryTabContent() {
  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Summary</h2>
      <p className="text-navy/60">Summary tab content coming soon...</p>
    </div>
  );
}
