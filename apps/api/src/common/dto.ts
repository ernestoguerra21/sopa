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

export class CreateInventoryItemDto {
  @IsString() name: string;
  @IsString() unit: string;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) minQuantity?: number;
}

export class UpdateInventoryItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) minQuantity?: number;
}

export class CreateStockMovementDto {
  @IsIn(["ENTRADA", "SALIDA", "MERMA", "AJUSTE", "COMPRA"]) type: "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE" | "COMPRA";
  @IsNumber() @Min(0.01) quantity: number;
  @IsOptional() @IsString() note?: string;
}

export class CreateTimeOffDto {
  @IsString() employeeId: string;
  @IsIn(["VACATION", "SICK_LEAVE", "PERSONAL", "UNPAID"]) type: "VACATION" | "SICK_LEAVE" | "PERSONAL" | "UNPAID";
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() reason?: string;
}
