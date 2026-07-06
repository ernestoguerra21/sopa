import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { calculateCubaPayroll } from "./cuba-calculator";

@Injectable()
export class PayrollService {
  constructor(private readonly db: PrismaService) {}

  async calculate(employeeId: string, month: number, year: number) {
    const employee = await this.db.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException("Empleado no encontrado");

    if (month < 1 || month > 12) throw new BadRequestException("Mes inválido (1-12)");

    // Calcular salario bruto del mes (suma de TimeEntry para ese mes/año)
    const timeEntries = await this.db.timeEntry.findMany({
      where: {
        employeeId,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    let grossSalary = 0;
    if (employee.payRate && employee.payRateType === "MENSUAL_FIJO") {
      grossSalary = Number(employee.payRate);
    } else {
      // Sumar horas/días trabajados
      grossSalary = timeEntries.reduce((sum, entry) => {
        const hours = entry.hours || 0;
        const hourlyRate = Number(employee.payRate || 0);
        return sum + hours * hourlyRate;
      }, 0);
    }

    const calculation = calculateCubaPayroll(grossSalary);

    return {
      employeeId,
      month,
      year,
      grossSalary: calculation.grossSalary,
      socialSecurityDeduction: calculation.socialSecurityDeduction,
      incomeTaxDeduction: calculation.incomeTaxDeduction,
      totalDeductions: calculation.totalDeductions,
      netSalary: calculation.netSalary,
      calculationDetails: calculation.details,
    };
  }

  async generate(employeeId: string, month: number, year: number, tenantId: string) {
    const employee = await this.db.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException("Empleado no encontrado");

    const calculation = await this.calculate(employeeId, month, year);

    // Guardar en BD
    return this.db.payrollRecord.upsert({
      where: {
        employeeId_month_year: { employeeId, month, year },
      },
      create: {
        employeeId,
        tenantId,
        businessId: employee.businessId,
        month,
        year,
        grossSalary: calculation.grossSalary,
        socialSecurityDeduction: calculation.socialSecurityDeduction,
        incomeTaxDeduction: calculation.incomeTaxDeduction,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        calculationDetails: calculation.calculationDetails,
      },
      update: {
        grossSalary: calculation.grossSalary,
        socialSecurityDeduction: calculation.socialSecurityDeduction,
        incomeTaxDeduction: calculation.incomeTaxDeduction,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        calculationDetails: calculation.calculationDetails,
      },
    });
  }

  async list(tenantId: string, businessId: string, month?: number, year?: number) {
    const where: any = { tenantId, businessId };
    if (month) where.month = month;
    if (year) where.year = year;

    return this.db.payrollRecord.findMany({
      where,
      include: { employee: { select: { id: true, name: true, position: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }, { employee: { name: "asc" } }],
    });
  }

  async getForEmployee(employeeId: string, tenantId: string) {
    return this.db.payrollRecord.findMany({
      where: { employeeId, tenantId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  // Ajuste manual: si cambia el bruto se recalculan retenciones; otras deducciones son libres
  async update(
    id: string,
    tenantId: string,
    data: { grossSalary?: number; otherDeductions?: number; socialSecurityDeduction?: number; incomeTaxDeduction?: number }
  ) {
    const record = await this.db.payrollRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException("Nómina no encontrada");

    let gross = data.grossSalary ?? Number(record.grossSalary);
    let ss: number;
    let tax: number;
    let details: any = record.calculationDetails;

    if (data.grossSalary !== undefined) {
      // Bruto nuevo → recalcular retenciones legales
      const calc = calculateCubaPayroll(data.grossSalary);
      ss = data.socialSecurityDeduction ?? calc.socialSecurityDeduction;
      tax = data.incomeTaxDeduction ?? calc.incomeTaxDeduction;
      details = calc.details;
    } else {
      ss = data.socialSecurityDeduction ?? Number(record.socialSecurityDeduction);
      tax = data.incomeTaxDeduction ?? Number(record.incomeTaxDeduction);
    }

    const other = data.otherDeductions ?? Number(record.otherDeductions);
    if (gross < 0 || ss < 0 || tax < 0 || other < 0) {
      throw new BadRequestException("Los importes no pueden ser negativos");
    }

    const totalDeductions = Math.round((ss + tax + other) * 100) / 100;
    const netSalary = Math.round((gross - totalDeductions) * 100) / 100;

    return this.db.payrollRecord.update({
      where: { id },
      data: {
        grossSalary: gross,
        socialSecurityDeduction: ss,
        incomeTaxDeduction: tax,
        otherDeductions: other,
        totalDeductions,
        netSalary,
        calculationDetails: details,
      },
      include: { employee: { select: { id: true, name: true, position: true } } },
    });
  }

  async delete(id: string, tenantId: string) {
    const record = await this.db.payrollRecord.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException("Nómina no encontrada");

    return this.db.payrollRecord.delete({ where: { id } });
  }
}
