import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get("ping")
  @HealthCheck()
  pingCheck() {
    return this.health.check([
      () => this.http.pingCheck("Ping", process.env.APP_URL),
    ]);
  }

  @Get("heap")
  @HealthCheck()
  heapCheck() {
    return this.health.check([
      () => this.memory.checkHeap("heap", 1024 * 1024 * 1024),
    ]);
  }

  @Get("db")
  @HealthCheck()
  databaseCheck() {
    return this.health.check([
      () => this.prisma.pingCheck("database", this.prismaService),
    ]);
  }
  @Get("rss")
  @HealthCheck()
  rssCheck() {
    return this.health.check([
      () => this.memory.checkRSS("rss", 200 * 1024 * 1024),
    ]);
  }
}
