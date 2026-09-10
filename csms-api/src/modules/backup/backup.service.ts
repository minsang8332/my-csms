import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  private getDbConfig() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const parsed = new URL(dbUrl);
        return {
          host: parsed.hostname || 'csms-db',
          port: parsed.port || '3306',
          user: parsed.username || 'csms_user',
          password: parsed.password || 'csms_secure_password',
          database: parsed.pathname.replace(/^\//, '') || 'csms',
        };
      } catch (e) {
        // Ignore parse error and fallback
      }
    }

    return {
      host: process.env.DB_HOST || 'csms-db',
      port: process.env.DB_PORT || '3306',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'csms_user',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'csms_secure_password',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'csms',
    };
  }

  private getBackupDir(): string {
    const candidates = [
      '/csms-db/backup',
      path.resolve(process.cwd(), 'csms-db/backup'),
      path.resolve(process.cwd(), '../csms-db/backup'),
      path.resolve(process.cwd(), 'backup'),
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    const defaultDir = fs.existsSync('/csms-db')
      ? '/csms-db/backup'
      : path.resolve(process.cwd(), '../csms-db/backup');

    if (!fs.existsSync(defaultDir)) {
      try {
        fs.mkdirSync(defaultDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    return defaultDir;
  }

  async createBackup(customFilename?: string) {
    const config = this.getDbConfig();
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const filename = customFilename || `csms_backup_${dateStr}.sql`;

    const tempDir = fs.existsSync('/tmp') ? '/tmp' : process.cwd();
    const tempPath = path.join(tempDir, filename);
    const targetDir = this.getBackupDir();
    const targetPath = path.join(targetDir, filename);

    this.logger.log(`Starting DB backup: ${config.database} -> temp: ${tempPath}, target: ${targetPath}`);

    let dumpSuccess = false;

    const dumpCmds = [
      `mariadb-dump -h ${config.host} -P ${config.port} -u ${config.user} -p"${config.password}" ${config.database}`,
      `mysqldump -h ${config.host} -P ${config.port} -u ${config.user} -p"${config.password}" ${config.database}`,
      `mariadb-dump -h 127.0.0.1 -P 3306 -u ${config.user} -p"${config.password}" ${config.database}`,
      `mysqldump -h 127.0.0.1 -P 3306 -u ${config.user} -p"${config.password}" ${config.database}`,
    ];

    for (const cmd of dumpCmds) {
      try {
        this.logger.log(`Attempting dump: ${cmd.split('-p')[0]}...`);
        await execAsync(`${cmd} > "${tempPath}"`);
        if (fs.existsSync(tempPath) && fs.statSync(tempPath).size > 0) {
          dumpSuccess = true;
          break;
        }
      } catch (err) {
        // try next
      }
    }

    if (!dumpSuccess) {
      const dockerCmds = [
        `docker exec csms-db mariadb-dump -u ${config.user} -p"${config.password}" ${config.database}`,
        `docker exec csms-db mysqldump -u ${config.user} -p"${config.password}" ${config.database}`,
      ];

      for (const dCmd of dockerCmds) {
        try {
          this.logger.log(`Attempting docker dump: ${dCmd.split('-p')[0]}...`);
          await execAsync(`${dCmd} > "${tempPath}"`);
          if (fs.existsSync(tempPath) && fs.statSync(tempPath).size > 0) {
            dumpSuccess = true;
            break;
          }
        } catch (err) {
          // try next
        }
      }
    }

    if (!dumpSuccess) {
      throw new InternalServerErrorException('Database dump failed via all available dump methods.');
    }

    // 2. Move file using container/OS cp command as requested
    const cpCmd = process.platform === 'win32'
      ? `copy /Y "${tempPath}" "${targetPath}"`
      : `cp "${tempPath}" "${targetPath}"`;

    this.logger.log(`Executing cp command: ${cpCmd}`);
    await execAsync(cpCmd);

    // Clean up temp file if different from target
    if (tempPath !== targetPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        // Ignore cleanup error
      }
    }

    const stats = fs.statSync(targetPath);

    return {
      success: true,
      message: 'Database backup created successfully',
      filename,
      targetPath,
      sizeBytes: stats.size,
      createdAt: new Date().toISOString(),
    };
  }

  async getBackups() {
    const targetDir = this.getBackupDir();
    if (!fs.existsSync(targetDir)) {
      return [];
    }

    const files = fs.readdirSync(targetDir);
    return files
      .filter((file) => file.endsWith('.sql'))
      .map((file) => {
        const filePath = path.join(targetDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          sizeBytes: stats.size,
          mtime: stats.mtime,
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  }
}
