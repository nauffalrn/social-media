import { MultipartFile } from '@fastify/multipart';
import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinaryType } from 'cloudinary';

@Injectable()
export class UploadsService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof cloudinaryType) {}

  async uploadToCloudinary(file: MultipartFile): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Konversi file ke buffer
        const buffer = await file.toBuffer();

        this.cloudinary.uploader
          .upload_stream({ folder: 'simple-instagram' }, (error: any, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          })
          .end(buffer);
      } catch (error) {
        reject(error);
      }
    });
  }

  async uploadToCloudinaryFromBuffer(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.cloudinary.uploader
          .upload_stream({ folder: 'simple-instagram' }, (error: any, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          })
          .end(buffer);
      } catch (error) {
        reject(error);
      }
    });
  }
}
