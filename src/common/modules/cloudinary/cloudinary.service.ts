import { Injectable, Logger } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

@Injectable()
export class CloudinaryService {
  private logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config();
  }

  async uploadImage(
    file: Express.Multer.File,
    width: number,
    height: number,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            transformation: [
              { width, height, crop: "fit", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) {
              this.logger.error(error.message);
              reject(error);
            } else {
              this.logger.log("Upload complete");
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });
  }
}
