import { Module } from '@nestjs/common';
import { db } from './index';
import { DRIZZLE } from 'src/infrastructure/database/drizzle.constants';

@Module({
  providers: [
    {
      provide: DRIZZLE,
      useValue: db,
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {
}
