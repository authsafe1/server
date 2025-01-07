import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
    private readonly healthService: HealthCheckService,
    private readonly httpService: HttpHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly memoryService: MemoryHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get("ping")
  @HealthCheck()
  pingCheck() {
    return this.healthService.check([
      () =>
        this.httpService.pingCheck("ping", this.configService.get("APP_URL")),
    ]);
  }

  @Get("heap")
  @HealthCheck()
  heapCheck() {
    return this.healthService.check([
      () => this.memoryService.checkHeap("heap", 1024 * 1024 * 1024),
    ]);
  }

  @Get("db")
  @HealthCheck()
  databaseCheck() {
    return this.healthService.check([
      () => this.prisma.pingCheck("database", this.prismaService),
    ]);
  }
  @Get("rss")
  @HealthCheck()
  rssCheck() {
    return this.healthService.check([
      () => this.memoryService.checkRSS("rss", 200 * 1024 * 1024),
    ]);
  }
}
