import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class AxiosService {
  private readonly logger = new Logger(AxiosService.name);
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 5000,
    });

    this.setupRetryLogic();
  }

  private setupRetryLogic() {
    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        const { config } = error;

        if (!config || !config.retryCount) {
          config.retryCount = 0;
        }

        if (config.retryCount >= 5) {
          this.logger.error(`Max retries reached for ${config.url}`);
          return Promise.reject(error);
        }

        config.retryCount++;
        const delay = Math.pow(2, config.retryCount) * 100;

        this.logger.warn(
          `Retrying request to ${config.url}, attempt ${config.retryCount} after ${delay}ms`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.axiosInstance(config);
      },
    );
  }

  get instance(): AxiosInstance {
    return this.axiosInstance;
  }
}
