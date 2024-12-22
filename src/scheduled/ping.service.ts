import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";

@Injectable()
export class PingService {
  constructor(private readonly httpService: HttpService) {}
  @Interval(30 * 1000)
  pingHealth() {
    this.httpService.get(`${process.env.APP_URL}/api/health`);
  }
}
