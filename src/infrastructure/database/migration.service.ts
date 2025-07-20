import { Injectable, Logger } from '@nestjs/common';
import { runMigrations } from './index';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  async migrate() {
    try {
      this.logger.log('Running migrations...');
      await runMigrations();
      this.logger.log('✅ Migrations completed');
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      throw error;
    }
  }
}
