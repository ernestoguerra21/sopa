import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  assigneeId?: string;
}

@Injectable()
export class TasksService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.task.findMany({
      where: { tenantId },
      include: { assignee: { select: { id: true, name: true } } },
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
      },
      include: { assignee: { select: { id: true, name: true } } },
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
