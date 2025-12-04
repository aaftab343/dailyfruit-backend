import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(backupDir, `mongo-backup-${timestamp}`);

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set in environment');
  process.exit(1);
}

// This assumes `mongodump` is installed on the server PATH.
const cmd = `mongodump --uri="${uri}" --out="${outDir}"`;

console.log('Running backup:', cmd);
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error('Backup error:', error.message);
    console.error(stderr);
    process.exit(1);
  }
  console.log(stdout);
  console.log('Backup complete at', outDir);
  process.exit(0);
});
