// Resolución 41/2023: cálculo de retenciones Cuba (Impuesto Ingresos Personales + Seguridad Social)

export interface PayrollCalculation {
  grossSalary: number;
  socialSecurityDeduction: number;
  incomeTaxDeduction: number;
  totalDeductions: number;
  netSalary: number;
  details: {
    socialSecurityBreakdown: Array<{ bracket: string; amount: number }>;
    incomeTaxBreakdown: Array<{ bracket: string; amount: number }>;
  };
}

export function calculateCubaPayroll(grossSalary: number): PayrollCalculation {
  // Seguridad Social: 5% hasta 15,000 + 10% por encima
  const socialSecurityDeduction = calculateSocialSecurity(grossSalary);

  // Impuesto Ingresos Personales: escalonado con exención inicial
  const incomeTaxDeduction = calculateIncomeTax(grossSalary);

  const totalDeductions = socialSecurityDeduction + incomeTaxDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    grossSalary,
    socialSecurityDeduction,
    incomeTaxDeduction,
    totalDeductions,
    netSalary,
    details: {
      socialSecurityBreakdown: getSocialSecurityBreakdown(grossSalary),
      incomeTaxBreakdown: getIncomeTaxBreakdown(grossSalary),
    },
  };
}

function calculateSocialSecurity(grossSalary: number): number {
  let deduction = 0;

  // Tramo 1: 5% hasta 15,000
  const tramo1 = Math.min(grossSalary, 15000);
  deduction += tramo1 * 0.05;

  // Tramo 2: 10% por encima de 15,000
  if (grossSalary > 15000) {
    const tramo2 = grossSalary - 15000;
    deduction += tramo2 * 0.1;
  }

  return Math.round(deduction * 100) / 100;
}

function calculateIncomeTax(grossSalary: number): number {
  let tax = 0;

  // Exención: hasta 3,260 (0%)
  if (grossSalary <= 3260) return 0;

  const taxableIncome = grossSalary - 3260;

  // Tramo 1: 3,260 a 9,510 → 3%
  if (grossSalary > 3260) {
    const tramo1Amount = Math.min(grossSalary, 9510) - 3260;
    tax += tramo1Amount * 0.03;
  }

  // Tramo 2: 9,510 a 15,000 → 5%
  if (grossSalary > 9510) {
    const tramo2Amount = Math.min(grossSalary, 15000) - 9510;
    tax += tramo2Amount * 0.05;
  }

  // Tramo 3: 15,000 a 20,000 → 7.5%
  if (grossSalary > 15000) {
    const tramo3Amount = Math.min(grossSalary, 20000) - 15000;
    tax += tramo3Amount * 0.075;
  }

  // Tramo 4: 20,000 a 25,000 → 10%
  if (grossSalary > 20000) {
    const tramo4Amount = Math.min(grossSalary, 25000) - 20000;
    tax += tramo4Amount * 0.1;
  }

  // Tramo 5: 25,000 a 30,000 → 15%
  if (grossSalary > 25000) {
    const tramo5Amount = Math.min(grossSalary, 30000) - 25000;
    tax += tramo5Amount * 0.15;
  }

  // Tramo 6: 30,000+ → 20%
  if (grossSalary > 30000) {
    const tramo6Amount = grossSalary - 30000;
    tax += tramo6Amount * 0.2;
  }

  return Math.round(tax * 100) / 100;
}

function getSocialSecurityBreakdown(
  grossSalary: number
): Array<{ bracket: string; amount: number }> {
  const breakdown = [];

  const tramo1 = Math.min(grossSalary, 15000);
  breakdown.push({ bracket: "Hasta 15,000 @ 5%", amount: Math.round((tramo1 * 0.05) * 100) / 100 });

  if (grossSalary > 15000) {
    const tramo2 = grossSalary - 15000;
    breakdown.push({ bracket: "Exceso de 15,000 @ 10%", amount: Math.round((tramo2 * 0.1) * 100) / 100 });
  }

  return breakdown;
}

function getIncomeTaxBreakdown(
  grossSalary: number
): Array<{ bracket: string; amount: number }> {
  const breakdown = [];

  if (grossSalary <= 3260) {
    breakdown.push({ bracket: "Exento hasta 3,260", amount: 0 });
    return breakdown;
  }

  // Tramo 1
  if (grossSalary > 3260) {
    const tramo1Amount = Math.min(grossSalary, 9510) - 3260;
    breakdown.push({ bracket: "3,260 - 9,510 @ 3%", amount: Math.round((tramo1Amount * 0.03) * 100) / 100 });
  }

  // Tramo 2
  if (grossSalary > 9510) {
    const tramo2Amount = Math.min(grossSalary, 15000) - 9510;
    breakdown.push({ bracket: "9,510 - 15,000 @ 5%", amount: Math.round((tramo2Amount * 0.05) * 100) / 100 });
  }

  // Tramo 3
  if (grossSalary > 15000) {
    const tramo3Amount = Math.min(grossSalary, 20000) - 15000;
    breakdown.push({ bracket: "15,000 - 20,000 @ 7.5%", amount: Math.round((tramo3Amount * 0.075) * 100) / 100 });
  }

  // Tramo 4
  if (grossSalary > 20000) {
    const tramo4Amount = Math.min(grossSalary, 25000) - 20000;
    breakdown.push({ bracket: "20,000 - 25,000 @ 10%", amount: Math.round((tramo4Amount * 0.1) * 100) / 100 });
  }

  // Tramo 5
  if (grossSalary > 25000) {
    const tramo5Amount = Math.min(grossSalary, 30000) - 25000;
    breakdown.push({ bracket: "25,000 - 30,000 @ 15%", amount: Math.round((tramo5Amount * 0.15) * 100) / 100 });
  }

  // Tramo 6
  if (grossSalary > 30000) {
    const tramo6Amount = grossSalary - 30000;
    breakdown.push({ bracket: "30,000+ @ 20%", amount: Math.round((tramo6Amount * 0.2) * 100) / 100 });
  }

  return breakdown;
}
