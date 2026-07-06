import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  assigneeId?: string;
  employeeAssigneeId?: string;
}

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true } },
  employeeAssignee: { select: { id: true, name: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(private readonly db: PrismaService) {}

  findAll(businessId: string) {
    return this.db.task.findMany({
      where: { businessId },
      include: TASK_INCLUDE,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  }

  findMine(businessId: string, employeeId: string) {
    return this.db.task.findMany({
      where: { businessId, employeeAssigneeId: employeeId },
      include: TASK_INCLUDE,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  }

  create(tenantId: string, businessId: string, data: CreateTaskDto) {
    return this.db.task.create({
      data: {
        tenantId,
        businessId,
        title: data.title,
        description: data.description,
        priority: data.priority ?? "MEDIUM",
        status: "PENDING",
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assigneeId: data.assigneeId,
        employeeAssigneeId: data.employeeAssigneeId,
      },
      include: TASK_INCLUDE,
    });
  }

  updateStatus(id: string, businessId: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
    return this.db.task.updateMany({
      where: { id, businessId },
      data: { status },
    });
  }

  remove(id: string, businessId: string) {
    return this.db.task.deleteMany({ where: { id, businessId } });
  }
}
