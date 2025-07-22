import { Module } from '@nestjs/common';
import { db, runMigrations } from './index';

@Module({
  providers: [
    {
      provide: 'DB',
      useValue: db,
    },
  ],
  exports: ['DB'],
})
export class DbModule {
}
