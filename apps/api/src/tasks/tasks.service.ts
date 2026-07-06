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

  findAll(tenantId: string) {
    return this.db.task.findMany({
      where: { tenantId },
      include: TASK_INCLUDE,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  }

  findMine(tenantId: string, employeeId: string) {
    return this.db.task.findMany({
      where: { tenantId, employeeAssigneeId: employeeId },
      include: TASK_INCLUDE,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  }

  create(tenantId: string, data: CreateTaskDto) {
    return this.db.task.create({
      data: {
        tenantId,
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

  updateStatus(id: string, tenantId: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
    return this.db.task.updateMany({
      where: { id, tenantId },
      data: { status },
    });
  }

  remove(id: string, tenantId: string) {
    return this.db.task.deleteMany({ where: { id, tenantId } });
  }
}
