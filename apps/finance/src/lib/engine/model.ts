/**
 * Core financial model engine
 * Handles all financial calculations for the 5-year projection
 */

export interface MonthlyData {
  month: number;
  date: Date;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  opex: number;
  ebitda: number;
  cashFlow: number;
  cumulativeCashFlow: number;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  assumptions: {
    startingRevenue: number;
    monthlyGrowthRate: number;
    cogsPercentage: number;
    opexFixed: number;
    opexVariable: number;
  };
}

export interface FinancialModel {
  id: string;
  companyName: string;
  industry: string;
  stage: string;
  startDate: Date;
  scenarios: Scenario[];
  monthlyData: MonthlyData[];
}

/**
 * Calculate monthly revenue with growth
 */
export function calculateRevenue(
  startingRevenue: number,
  growthRate: number,
  months: number
): number[] {
  const revenues: number[] = [];
  for (let i = 0; i < months; i++) {
    revenues.push(startingRevenue * Math.pow(1 + growthRate, i));
  }
  return revenues;
}

/**
 * Calculate COGS (Cost of Goods Sold)
 */
export function calculateCOGS(
  revenues: number[],
  cogsPercentage: number
): number[] {
  return revenues.map((r) => r * cogsPercentage);
}

/**
 * Calculate Operating Expenses
 */
export function calculateOpEx(
  opexFixed: number,
  opexVariable: number,
  revenues: number[]
): number[] {
  return revenues.map((r) => opexFixed + r * opexVariable);
}

/**
 * Calculate P&L metrics for each month
 */
export function calculatePL(
  revenues: number[],
  cogs: number[],
  opex: number[]
): MonthlyData[] {
  const monthlyData: MonthlyData[] = [];
  let cumulativeCashFlow = 0;

  const months = Math.min(revenues.length, cogs.length, opex.length);

  for (let i = 0; i < months; i++) {
    const revenue = revenues[i];
    const cogsValue = cogs[i];
    const opexValue = opex[i];

    const grossProfit = revenue - cogsValue;
    const grossMargin = revenue > 0 ? grossProfit / revenue : 0;
    const ebitda = grossProfit - opexValue;
    const cashFlow = ebitda; // Simplified: no taxes, depreciation, etc.

    cumulativeCashFlow += cashFlow;

    monthlyData.push({
      month: i + 1,
      date: new Date(),
      revenue,
      cogs: cogsValue,
      grossProfit,
      grossMargin,
      opex: opexValue,
      ebitda,
      cashFlow,
      cumulativeCashFlow,
    });
  }

  return monthlyData;
}

/**
 * Calculate cash flow metrics
 */
export function calculateCashFlow(monthlyData: MonthlyData[]): {
  runwayMonths: number;
  breakevenMonth: number;
  cumulativeCashAtEnd: number;
} {
  let runwayMonths = 0;
  let breakevenMonth = 0;

  for (let i = 0; i < monthlyData.length; i++) {
    const data = monthlyData[i];
    if (data.cumulativeCashFlow <= 0 && runwayMonths === 0) {
      runwayMonths = i;
    }
    if (data.ebitda > 0 && breakevenMonth === 0) {
      breakevenMonth = i + 1;
    }
  }

  const cumulativeCashAtEnd =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].cumulativeCashFlow : 0;

  return {
    runwayMonths,
    breakevenMonth,
    cumulativeCashAtEnd,
  };
}

/**
 * Calculate runway in months given starting cash
 */
export function calculateRunway(
  monthlyBurn: number,
  startingCash: number
): number {
  if (monthlyBurn <= 0) return Infinity;
  return Math.floor(startingCash / monthlyBurn);
}

/**
 * Generate a full 60-month financial projection
 */
export function generateProjection(scenario: Scenario): MonthlyData[] {
  const { startingRevenue, monthlyGrowthRate, cogsPercentage, opexFixed, opexVariable } =
    scenario.assumptions;

  const months = 60; // 5 years

  const revenues = calculateRevenue(startingRevenue, monthlyGrowthRate, months);
  const cogs = calculateCOGS(revenues, cogsPercentage);
  const opex = calculateOpEx(opexFixed, opexVariable, revenues);

  return calculatePL(revenues, cogs, opex);
}
