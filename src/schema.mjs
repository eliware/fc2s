import {readFile,readdir} from 'node:fs/promises'; import path from 'node:path'; import {parse} from 'csv-parse/sync'; import {log} from './debug.mjs';
const id=/^[A-Za-z_][A-Za-z0-9_]*$/; export function identifier(x){if(!id.test(x)) throw new Error(`Unsafe identifier: ${x}`); return `\`${x}\``;}
function sqlColumn(x){x=x.trim().replace(/,+$/, '').trim(); if(!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(x)) throw new Error(`Unsafe column name: ${x}`); return `\`${x.replaceAll('\`','\`\`')}\``;}
export async function schema(dir){
  const entries=await readdir(dir); const files=entries.filter(x=>x.endsWith('_CSV_DATA_STRUCTURE.csv')); const dataFiles=entries.filter(x=>x.endsWith('.csv')&&!x.endsWith('_CSV_DATA_STRUCTURE.csv'));
  const csvFor=(table)=>{const exact=`${table}.csv`; if(dataFiles.includes(exact)) return exact; const matches=dataFiles.filter(x=>x.startsWith(`${table}_`)); if(matches.length===1) return matches[0]; return null;}; log('schema files', {dir, files});
  if(!files.length) throw new Error(`No schema files in ${dir}`); const result=[];
  for(const f of files){ const file=path.join(dir,f), raw=await readFile(file); log('parsing schema', {file, bytes:raw.length}); let rows;
    try { rows=parse(raw.toString().replace(/\r\n?/g, '\n'),{skip_empty_lines:true, info:true}); } catch(e) { log('schema parse error', {file, line:e.lines, record:e.record, code:e.code, message:e.message}); throw new Error(`Failed parsing ${file}: ${e.message}`,{cause:e}); }
    let table,cols=[]; const flush=()=>{if(table&&cols.length){const name=csvFor(table); if(!name){log('skipping schema table without CSV', {table}); return;} const csv=path.join(dir,name); result.push({table,sql:`CREATE TABLE ${identifier(table)} (${cols.join(', ')});\nLOAD DATA LOCAL INFILE ${JSON.stringify(csv)} INTO TABLE ${identifier(table)} FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\\r\\n' IGNORE 1 ROWS;`}); log('schema table', {table, columns:cols.length, csv});}};
    for(const item of rows){ const r=item.record.map(v=>typeof v==='string'?v.trim():v); log('schema row', {file, line:item.info.lines, fields:r.length, first:r[0]}); if(r.every(v=>v===''))continue; if(r[0]==='CSV File')continue; if(r[0]!==table){flush();table=r[0];cols=[];} const type=r[3]==='VARCHAR'?`VARCHAR(${Number(r[2])||255})`:r[3]==='NUMBER'?'DECIMAL(30,10)':'TEXT'; cols.push(`${sqlColumn(r[1])} ${type}${r[4]==='Yes'?'':' NOT NULL'}`); } flush();
  } return result;
}
