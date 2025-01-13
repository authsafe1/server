import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Severity } from "@prisma/client";
import { Request, Response } from "express";
import { SecurityAlertService } from "../modules/log/security-log.service";

@Catch(HttpException)
export class ErrorFilter implements ExceptionFilter {
  constructor(private readonly securityAlertService: SecurityAlertService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status >= HttpStatus.BAD_REQUEST) {
      const severity = this.determineSeverity(status);
      if (request.session.profile) {
        await this.securityAlertService.createAlert(
          exception.message,
          severity,
          request.session.profile.id,
          request.ip ||
            (request.headers["x-forwarded-for"] as string) ||
            (request.socket.remoteAddress as string),
          request.url,
        );
      }
    }

    return response.status(status).json({
      statusCode: status,
      message: exception.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private determineSeverity(status: HttpStatus) {
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return Severity.CRITICAL;
    } else if (
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN ||
      status === HttpStatus.TOO_MANY_REQUESTS
    ) {
      return Severity.HIGH;
    } else if (status === HttpStatus.NOT_FOUND) {
      return Severity.MEDIUM;
    } else {
      return Severity.LOW;
    }
  }
}
