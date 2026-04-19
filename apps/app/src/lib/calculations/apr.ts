/**
 * APR (Annual Percentage Rate) Calculation Engine
 * Uses Newton's method to calculate the true APR given principal, interest rate, term, and fees
 */

interface APRInput {
  principal: number;
  annualRate: number;
  loanTermMonths: number;
  upfrontFees: number;
}

interface APRResult {
  apr: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalCost: number;
}

interface AmortizationInput {
  principal: number;
  monthlyRate: number;
  loanTermMonths: number;
}

interface AmortizationRow {
  month: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  principalRemaining: number;
  interestPaid: number;
}

/**
 * Calculates the APR (Annual Percentage Rate) including all fees
 * Uses Newton's method for iteration to find the monthly rate that satisfies:
 * netLoanAmount = sum of (monthlyPayment / (1 + monthlyRate)^month)
 */
export function calculateAPR({
  principal,
  annualRate,
  loanTermMonths,
  upfrontFees,
}: APRInput): APRResult {
  // Calculate monthly payment using standard amortization formula
  const monthlyRate = annualRate / 100 / 12;
  const numerator =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths));
  const denominator =
    Math.pow(1 + monthlyRate, loanTermMonths) - 1;
  const monthlyPayment = numerator / denominator;

  // Net loan amount (principal minus upfront fees)
  const netLoanAmount = principal - upfrontFees;
  const totalPayment = monthlyPayment * loanTermMonths;
  const totalInterest = totalPayment - principal;

  // Calculate APR using Newton's method
  // We solve for the monthly rate where:
  // netLoanAmount = sum of (monthlyPayment / (1 + rate)^month)
  let aprMonthlyRate = monthlyRate;
  let iteration = 0;
  const maxIterations = 100;
  const tolerance = 1e-6;

  while (iteration < maxIterations) {
    // Calculate present value with current rate
    const pv = calculatePresentValue(
      monthlyPayment,
      aprMonthlyRate,
      loanTermMonths
    );
    const pvDifference = pv - netLoanAmount;

    // If converged, break
    if (Math.abs(pvDifference) < tolerance) {
      break;
    }

    // Calculate derivative for Newton's method
    const derivative = calculatePVDerivative(
      monthlyPayment,
      aprMonthlyRate,
      loanTermMonths
    );

    // Avoid division by zero
    if (Math.abs(derivative) < 1e-10) {
      break;
    }

    // Newton's method update
    aprMonthlyRate = aprMonthlyRate - pvDifference / derivative;

    // Prevent rate from going negative
    if (aprMonthlyRate < 0) {
      aprMonthlyRate = 0.0001;
    }

    iteration++;
  }

  const apr = aprMonthlyRate * 12 * 100; // Convert to annual percentage

  return {
    apr: Math.max(0, apr),
    monthlyPayment,
    totalPayment,
    totalInterest,
    totalCost: totalPayment + upfrontFees,
  };
}

/**
 * Calculates the present value of an annuity
 * PV = sum of (payment / (1 + rate)^month) for month 1 to n
 */
function calculatePresentValue(
  payment: number,
  monthlyRate: number,
  months: number
): number {
  if (Math.abs(monthlyRate) < 1e-10) {
    return payment * months;
  }

  const factor = 1 + monthlyRate;
  return payment * ((1 - Math.pow(factor, -months)) / monthlyRate);
}

/**
 * Calculates the derivative of PV with respect to monthly rate
 * Used in Newton's method for finding the APR
 */
function calculatePVDerivative(
  payment: number,
  monthlyRate: number,
  months: number
): number {
  if (Math.abs(monthlyRate) < 1e-10) {
    return -payment * (months * (months + 1)) / 2;
  }

  const factor = 1 + monthlyRate;
  const numerator =
    -payment *
    (months * Math.pow(factor, -months - 1) * monthlyRate -
      (Math.pow(factor, -months) - 1)) /
    Math.pow(monthlyRate, 2);

  return numerator;
}

/**
 * Generates amortization schedule data for visualization
 */
export function generateAmortizationData({
  principal,
  monthlyRate,
  loanTermMonths,
}: AmortizationInput): AmortizationRow[] {
  // Calculate monthly payment
  const factor = 1 + monthlyRate;
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(factor, loanTermMonths))) /
    (Math.pow(factor, loanTermMonths) - 1);

  const data: AmortizationRow[] = [];
  let remainingPrincipal = principal;
  let cumulativeInterest = 0;

  for (let month = 1; month <= loanTermMonths; month++) {
    const interestPayment = remainingPrincipal * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;

    remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
    cumulativeInterest += interestPayment;

    // Only push every N months to avoid too much data for visualization
    const sampleInterval = Math.max(1, Math.floor(loanTermMonths / 60));

    if (month % sampleInterval === 0 || month === loanTermMonths) {
      data.push({
        month,
        payment: monthlyPayment,
        principalPayment,
        interestPayment,
        principalRemaining: remainingPrincipal,
        interestPaid: cumulativeInterest,
      });
    }
  }

  return data;
}
