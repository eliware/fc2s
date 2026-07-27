import mysql from 'mysql2/promise';
import { spawn as defaultSpawn } from 'node:child_process';
import { createReadStream as defaultCreateReadStream, createWriteStream as defaultCreateWriteStream } from 'node:fs';
import { pipeline as defaultPipeline } from 'node:stream/promises';

export function db(config, deps = {}) {
  const client = deps.mysql ?? mysql;
  const createReadStream = deps.createReadStream ?? defaultCreateReadStream;
  return client.createConnection({
    host: config.host, port: config.port, user: config.user, password: config.password,
    multipleStatements: true,
    infileStreamFactory: (file) => createReadStream(file),
  });
}

export function run(command, args, options = {}, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let output = '';
    let errorOutput = '';
    child.stdout?.on('data', (chunk) => { output += chunk; });
    child.stderr?.on('data', (chunk) => { errorOutput += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code) reject(new Error(errorOutput || `command failed: ${code}`));
      else resolve(output);
    });
  });
}

export async function dumpTable(config, database, table, file, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  const pipeline = deps.pipeline ?? defaultPipeline;
  const createWriteStream = deps.createWriteStream ?? defaultCreateWriteStream;
  const child = spawn('mysqldump', [
    '--single-transaction', '--skip-comments', '--host', config.host,
    '--port', String(config.port), '--user', config.user,
    `--password=${config.password}`, database, table,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let errorOutput = '';
  child.stderr.on('data', (chunk) => { errorOutput += chunk; });
  const exited = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      if (code) reject(new Error(errorOutput || `mysqldump failed: ${code}`));
      else resolve();
    });
  });
  await Promise.all([exited, pipeline(child.stdout, createWriteStream(file))]);
}
