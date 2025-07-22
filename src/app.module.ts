import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as fs from 'fs';
import { join } from 'path';
import z from 'zod';
import { FollowsModule } from './core/follows/follows.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { CommentsModule } from './core/posts/comments/comments.module';
import { LikesModule } from './core/posts/likes/likes.module';
import { PostsModule } from './core/posts/posts.module';
import { UsersModule } from './core/users/users.module';
import { DbModule } from './infrastructure/database/db.module';
import { EnvModule } from './infrastructure/env/envModule';
import { UploadsModule } from './infrastructure/storage/uploads.module';

export const appSchema = z.object({
  DATABASE_URL: z.string({ error: 'DATABASE_URL is required' }),
  CLOUDINARY_CLOUD_NAME: z.string({
    error: 'CLOUDINARY_CLOUD_NAME is required',
  }),
  CLOUDINARY_API_KEY: z.string({ error: 'CLOUDINARY_API_KEY is required' }),
  CLOUDINARY_API_SECRET: z.string({
    error: 'CLOUDINARY_API_SECRET is required',
  }),
  RESEND_API_KEY: z.string({ error: 'RESEND_API_KEY is required' }),
});

@Module({
  imports: [
    EnvModule.forRoot({
      global: true,
      schema: appSchema,
      name: 'App',
    }),
    UsersModule,
    PostsModule,
    FollowsModule,
    CommentsModule,
    UploadsModule,
    NotificationsModule,
    EnvModule,
    LikesModule,
    DbModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
    JwtModule.registerAsync({
      inject: [],
      useFactory: async () => ({
        privateKey: fs.readFileSync('private.key'),
        publicKey: fs.readFileSync('public.key'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '24h',
        },
      }),
      global: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
