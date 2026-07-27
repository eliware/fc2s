import path from 'node:path';
import {spawn} from 'node:child_process';

// Archive dir as a top-level folder instead of placing its contents at root.
export function tarGz(output, dir, root=path.basename(path.resolve(dir))) {
  return new Promise((res, rej) => {
    const parent=path.dirname(path.resolve(dir));
    const p=spawn('tar',['-czf',output,'-C',parent,root],{stdio:'inherit'});
    p.on('close',n=>n?rej(new Error(`tar failed: ${n}`)):res());
  });
}
