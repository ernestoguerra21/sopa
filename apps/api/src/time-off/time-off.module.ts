import { Module } from "@nestjs/common";
import { TimeOffService } from "./time-off.service";
import { TimeOffController } from "./time-off.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  providers: [TimeOffService, PrismaService],
  controllers: [TimeOffController],
  exports: [TimeOffService],
})
export class TimeOffModule {}
