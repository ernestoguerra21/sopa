import { IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

/* DTOs de las rutas que mueven dinero o fechas — validación en la frontera de confianza */

export class UpdatePayrollDto {
  @IsOptional() @IsNumber() @Min(0) grossSalary?: number;
  @IsOptional() @IsNumber() @Min(0) otherDeductions?: number;
  @IsOptional() @IsNumber() @Min(0) socialSecurityDeduction?: number;
  @IsOptional() @IsNumber() @Min(0) incomeTaxDeduction?: number;
}

export class CreateSalesEntryDto {
  @IsNumber() @Min(0) sales: number;
  @IsNumber() @Min(0) expenses: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateTimeEntryDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsDateString() date: string;
  @IsOptional() @IsNumber() @Min(0) hours?: number;
}

export class UpdateTimeEntryDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsNumber() @Min(0) hours?: number;
}

export class CreateTimeOffDto {
  @IsString() employeeId: string;
  @IsIn(["VACATION", "SICK_LEAVE", "PERSONAL", "UNPAID"]) type: "VACATION" | "SICK_LEAVE" | "PERSONAL" | "UNPAID";
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() reason?: string;
}
