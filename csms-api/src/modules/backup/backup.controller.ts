import { Controller, Post, Get, Body } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createBackup(@Body('filename') filename?: string) {
    return this.backupService.createBackup(filename);
  }

  @Get()
  async getBackups() {
    return this.backupService.getBackups();
  }
}
