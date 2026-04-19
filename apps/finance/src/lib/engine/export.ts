/**
 * Export utilities for generating Excel and PDF reports
 */

import { FinancialModel, MonthlyData } from "./model";
import * as XLSX from "xlsx";

/**
 * Convert a financial model to an Excel workbook
 */
export function modelToXLSX(model: FinancialModel): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ["Company Name", model.companyName],
    ["Industry", model.industry],
    ["Stage", model.stage],
    ["Start Date", model.startDate.toISOString()],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Sheet 2: Projection
  if (model.monthlyData.length > 0) {
    const projectionData = [
      [
        "Month",
        "Revenue",
        "COGS",
        "Gross Profit",
        "Gross Margin %",
        "OpEx",
        "EBITDA",
        "Cash Flow",
        "Cumulative Cash Flow",
      ],
      ...model.monthlyData.map((m: MonthlyData) => [
        m.month,
        m.revenue,
        m.cogs,
        m.grossProfit,
        (m.grossMargin * 100).toFixed(2),
        m.opex,
        m.ebitda,
        m.cashFlow,
        m.cumulativeCashFlow,
      ]),
    ];
    const projectionSheet = XLSX.utils.aoa_to_sheet(projectionData);
    XLSX.utils.book_append_sheet(workbook, projectionSheet, "Projection");
  }

  // Sheet 3: Assumptions
  if (model.scenarios.length > 0) {
    const assumptionsData = [["Parameter", "Value"]];
    const scenario = model.scenarios[0];
    Object.entries(scenario.assumptions).forEach(([key, value]) => {
      assumptionsData.push([
        key.replace(/([A-Z])/g, " $1").trim(),
        String(value),
      ]);
    });
    const assumptionsSheet = XLSX.utils.aoa_to_sheet(assumptionsData);
    XLSX.utils.book_append_sheet(workbook, assumptionsSheet, "Assumptions");
  }

  return workbook;
}

/**
 * Generate Excel file as binary
 */
export function generateExcelBinary(model: FinancialModel): Buffer {
  const workbook = modelToXLSX(model);
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  return excelBuffer as Buffer;
}

/**
 * Convert a financial model to a PDF (placeholder)
 * In production, use a library like pdfkit or jsPDF
 */
export function modelToPDF(_model: FinancialModel): Buffer {
  // TODO: Implement PDF generation using pdfkit or similar
  // For now, return a placeholder buffer
  return Buffer.from("PDF generation not yet implemented");
}

/**
 * Format currency values for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
