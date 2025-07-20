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
  constructor() {
    // Jalankan migrasi saat development
    if (process.env.NODE_ENV !== 'production') {
      runMigrations().catch(console.error);
    }
  }
}
