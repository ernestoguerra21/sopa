import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCubaPayroll } from "./cuba-calculator.ts";

// Caso verificado contra el Excel oficial "Hoja de trabajo para cálculo de retenciones"
test("salario 70.436,56 → SS 6.293,66 e impuesto 10.174,31 (Excel oficial)", () => {
  const r = calculateCubaPayroll(70436.56);
  assert.equal(r.socialSecurityDeduction, 6293.66);
  assert.equal(r.incomeTaxDeduction, 10174.31);
  assert.equal(r.netSalary, Math.round((70436.56 - 6293.66 - 10174.31) * 100) / 100);
});

test("por debajo de la exención (3.260) no paga impuesto, solo SS 5%", () => {
  const r = calculateCubaPayroll(3000);
  assert.equal(r.incomeTaxDeduction, 0);
  assert.equal(r.socialSecurityDeduction, 150); // 5% de 3000
});

test("justo en el límite de exención paga 0 de impuesto", () => {
  assert.equal(calculateCubaPayroll(3260).incomeTaxDeduction, 0);
});

test("SS cambia de tramo en 15.000: 5% abajo, 10% del exceso", () => {
  assert.equal(calculateCubaPayroll(15000).socialSecurityDeduction, 750);
  assert.equal(calculateCubaPayroll(16000).socialSecurityDeduction, 750 + 100);
});

test("salario 0 → todo 0, sin NaN", () => {
  const r = calculateCubaPayroll(0);
  assert.equal(r.socialSecurityDeduction, 0);
  assert.equal(r.incomeTaxDeduction, 0);
  assert.equal(r.netSalary, 0);
});

test("el neto nunca es negativo", () => {
  assert.ok(calculateCubaPayroll(1).netSalary >= 0);
});

test("el desglose por tramos suma igual que la deducción total", () => {
  const r = calculateCubaPayroll(70436.56);
  const sumSS = r.details.socialSecurityBreakdown.reduce((s, b) => s + b.amount, 0);
  const sumTax = r.details.incomeTaxBreakdown.reduce((s, b) => s + b.amount, 0);
  assert.ok(Math.abs(sumSS - r.socialSecurityDeduction) < 0.02);
  assert.ok(Math.abs(sumTax - r.incomeTaxDeduction) < 0.02);
});
