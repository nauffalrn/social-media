import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { db } from './index';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
  ],
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useValue: db,
    },
  ],
  exports: [ClsModule, 'DATABASE_CONNECTION'],
})
export class DbModule {}
