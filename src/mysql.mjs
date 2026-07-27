import mysql from 'mysql2/promise';
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export function db(c) {
  return mysql.createConnection({ host: c.host, port: c.port, user: c.user, password: c.password, multipleStatements: true, infileStreamFactory: file => createReadStream(file) });
}

export function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, opts); let out = '', err = '';
    p.stdout?.on('data', x => out += x);
    p.stderr?.on('data', x => err += x);
    p.on('error', rej);
    p.on('close', n => n ? rej(new Error(err || `command failed: ${n}`)) : res(out));
  });
}

export async function dumpTable(c, dbName, table, file) {
  const p = spawn('mysqldump', ['--single-transaction', '--skip-comments', '--host', c.host, '--port', String(c.port), '--user', c.user, `--password=${c.password}`, dbName, table], { stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  p.stderr.on('data', x => err += x);
  const exited = new Promise((resolve, reject) => {
    p.on('error', reject);
    p.on('close', code => code ? reject(new Error(err || `mysqldump failed: ${code}`)) : resolve());
  });
  await Promise.all([exited, pipeline(p.stdout, createWriteStream(file))]);
}
