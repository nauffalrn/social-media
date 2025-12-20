import { MultipartFile } from '@fastify/multipart';
import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinaryType } from 'cloudinary';

@Injectable()
export class UploadsService {
  constructor(
    @Inject('CLOUDINARY') private cloudinary: typeof cloudinaryType,
  ) {}

  async uploadToCloudinary(file: MultipartFile): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Konversi file ke buffer
        const buffer = await file.toBuffer();

        this.cloudinary.uploader
          .upload_stream(
            { folder: 'simple-instagram' },
            (error: any, result: UploadApiResponse) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            },
          )
          .end(buffer);
      } catch (error) {
        reject(error);
      }
    });
  }

  async uploadToCloudinaryFromBuffer(
    buffer: Buffer,
    filename: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.cloudinary.uploader
          .upload_stream(
            { folder: 'simple-instagram' },
            (error: any, result: UploadApiResponse) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            },
          )
          .end(buffer);
      } catch (error) {
        reject(error);
      }
    });
  }

  async upload(file: any): Promise<{ secure_url: string }> {
    try {
      if (file && file.toBuffer) {
        // Jika file adalah MultipartFile
        const url = await this.uploadToCloudinary(file);
        return { secure_url: url };
      } else if (file && Buffer.isBuffer(file.buffer)) {
        // Jika file adalah buffer
        const url = await this.uploadToCloudinaryFromBuffer(
          file.buffer,
          file.filename || 'file',
        );
        return { secure_url: url };
      } else {
        // Fallback untuk testing atau development
        return { secure_url: 'https://example.com/placeholder.jpg' };
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload file');
    }
  }
}
