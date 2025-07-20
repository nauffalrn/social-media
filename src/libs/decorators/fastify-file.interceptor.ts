import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Type, mixin } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

export function FastifyFileInterceptor(fieldName: string): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest<FastifyRequest>();

      try {
        if (!req.isMultipart()) {
          return next.handle();
        }

        const data = await req.file();

        if (data && data.fieldname === fieldName) {
          // Tambahkan file ke request untuk diakses oleh handler
          req['uploadedFile'] = data;
        }
      } catch (err) {
        console.error('Error processing file:', err);
      }

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
