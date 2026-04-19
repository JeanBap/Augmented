/**
 * Sensitivity analysis engine
 * Generates matrices for what-if analysis
 */

import { generateProjection, Scenario } from "./model";

export interface SensitivityMatrix {
  parameterA: string;
  parameterB: string;
  values: number[][];
  minValue: number;
  maxValue: number;
}

/**
 * Generate a sensitivity matrix for two parameters
 * @param baseScenario - The base scenario to vary
 * @param paramA - First parameter name to vary
 * @param paramB - Second parameter name to vary
 * @param steps - Number of steps for each dimension
 * @param metric - Which metric to return (e.g., "ebitda", "cumulativeCashFlow")
 * @returns A 2D matrix of sensitivity values
 */
export function generateSensitivityMatrix(
  baseScenario: Scenario,
  paramA: keyof Scenario["assumptions"],
  paramB: keyof Scenario["assumptions"],
  steps: number = 5,
  metric: string = "ebitda"
): SensitivityMatrix {
  const matrix: number[][] = [];
  let minValue = Infinity;
  let maxValue = -Infinity;

  // Range for each parameter: -50% to +50% in steps
  const range = 0.5;
  const stepSize = range / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const row: number[] = [];
    const factorB = 1 - range + i * stepSize * 2;

    for (let j = 0; j < steps; j++) {
      const factorA = 1 - range + j * stepSize * 2;

      // Create a modified scenario
      const testScenario = {
        ...baseScenario,
        assumptions: {
          ...baseScenario.assumptions,
          [paramA]: baseScenario.assumptions[paramA] * factorA,
          [paramB]: baseScenario.assumptions[paramB] * factorB,
        },
      };

      // Generate projection and extract metric
      const projection = generateProjection(testScenario);
      const value = extractMetricFromProjection(projection, metric);

      row.push(value);
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    }

    matrix.push(row);
  }

  return {
    parameterA: paramA as string,
    parameterB: paramB as string,
    values: matrix,
    minValue,
    maxValue,
  };
}

/**
 * Extract a metric value from a projection
 * @param projection - Array of monthly data
 * @param metric - Metric name to extract
 * @returns The aggregated metric value (e.g., sum of ebitda, final cumulative cash)
 */
function extractMetricFromProjection(projection: any[], metric: string): number {
  if (metric === "cumulativeCashFlow" && projection.length > 0) {
    return projection[projection.length - 1].cumulativeCashFlow;
  }

  if (metric === "ebitda") {
    return projection.reduce((sum, m) => sum + m.ebitda, 0);
  }

  if (metric === "revenue") {
    return projection.reduce((sum, m) => sum + m.revenue, 0);
  }

  if (metric === "breakevenMonth") {
    const breakeven = projection.find((m) => m.ebitda > 0);
    return breakeven ? breakeven.month : projection.length;
  }

  return 0;
}

/**
 * Generate tornado chart data (one-at-a-time sensitivity)
 * @param baseScenario - The base scenario
 * @param parameters - Parameters to vary
 * @param metric - Metric to measure impact on
 * @returns Array of {parameter, baseValue, lowValue, highValue}
 */
export function generateTornadoData(
  baseScenario: Scenario,
  parameters: (keyof Scenario["assumptions"])[],
  metric: string = "ebitda"
): Array<{
  parameter: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  impact: number;
}> {
  const baseProjection = generateProjection(baseScenario);
  const baseValue = extractMetricFromProjection(baseProjection, metric);

  const data = parameters.map((param) => {
    // Low scenario: -30%
    const lowScenario = {
      ...baseScenario,
      assumptions: {
        ...baseScenario.assumptions,
        [param]: baseScenario.assumptions[param] * 0.7,
      },
    };
    const lowValue = extractMetricFromProjection(
      generateProjection(lowScenario),
      metric
    );

    // High scenario: +30%
    const highScenario = {
      ...baseScenario,
      assumptions: {
        ...baseScenario.assumptions,
        [param]: baseScenario.assumptions[param] * 1.3,
      },
    };
    const highValue = extractMetricFromProjection(
      generateProjection(highScenario),
      metric
    );

    return {
      parameter: param as string,
      baseValue,
      lowValue,
      highValue,
      impact: Math.abs(highValue - lowValue),
    };
  });

  return data.sort((a, b) => b.impact - a.impact);
}
