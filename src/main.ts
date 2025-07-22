import fastifyMultipart from '@fastify/multipart';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import fastifyHelmet from '@fastify/helmet';
declare const module: any;

dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
  );


  await app.register(fastifyHelmet, {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: [`'self'`],
            styleSrc: [`'self'`, `'unsafe-inline'`],
            imgSrc: [`'self'`, 'data:'],
            scriptSrc: [`'self'`, `'https: 'unsafe-inline'`],
          },
        },
      })
  // Register plugin fastify multipart
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('API Social Media')
    .setDescription('The API description for Social Media')
    .setVersion('1.0')
    .addTag('social')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    customfavIcon: '/public/logo.png',
    customCssUrl: ['/public/global.css', '/public/dark.css', '/public/light.css'],
    customJs: '/public/swagger.js',
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  });
  await app.listen(3000, '0.0.0.0');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
