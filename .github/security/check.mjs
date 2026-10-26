import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const option = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name)+1] : undefined;
const root = path.resolve(option('--root') || '.');
const allowed = new Set(['.nojekyll','README.md','SECURITY.md','index.html','mobile.html','app.js','app.css','manifest.webmanifest','sw.js','privacy.html','icon.svg','favicon.ico','favicon-16.png','favicon-32.png','favicon-48.png','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-512.png','spell-worker.js','spell-engine.js','hunspell.wasm','spell-ko.aff.gz','spell-ko.dic.gz','spell-en.aff.gz','spell-en.dic.gz','spell-notices.txt','spell-ko-source.tar.gz','spell-hunspell-source.tar.gz','.github/workflows/security.yml','.github/security/check.mjs','.github/security/dependencies.json']);
async function walk(dir, prefix='') {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    if(!prefix && entry.name==='.git') continue;
    const rel=prefix+entry.name, absolute=path.join(dir,entry.name);
    if((await lstat(absolute)).isSymbolicLink())throw Error('Symbolic links are not allowed: '+rel);
    if(entry.isDirectory())await walk(absolute,rel+'/');
    else {
      if(!allowed.has(rel))throw Error('Unexpected public file: '+rel);
      if(!/\.(?:js|mjs|json|html|md|yml|txt|webmanifest)$/.test(rel))continue;
      const source=await readFile(absolute,'utf8');
      const patterns=[['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],['google-access-token',/\bya29\.[A-Za-z0-9_-]{30,}/],['api-secret',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}/],['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/]];
      for(const [kind,pattern] of patterns)if(pattern.test(source))throw Error('Possible '+kind+' in '+rel+'; value intentionally hidden.');
    }
  }
}
await walk(root);
for(const name of ['index.html','mobile.html']) {
  const html=await readFile(path.join(root,name),'utf8');
  for(const directive of ["object-src 'none'","base-uri 'none'","form-action 'none'"])if(!html.includes(directive))throw Error(name+' missing '+directive);
  if(html.includes("'unsafe-eval'"))throw Error('General unsafe-eval is not allowed');
  if(!html.includes('strict-origin-when-cross-origin'))throw Error('Referrer policy missing');
  for(const asset of ['app.js','app.css']) {
    const tag=html.match(new RegExp('<(?:script|link)\\b[^>]*(?:src|href)="\\./'+asset.replace('.','\\.')+'[^\"]*"[^>]*>'))?.[0];
    const expected='sha384-'+createHash('sha384').update(await readFile(path.join(root,asset))).digest('base64');
    if(!tag?.includes('integrity="'+expected+'"'))throw Error(name+' asset integrity mismatch: '+asset);
  }
}
const metadata=JSON.parse(await readFile(path.resolve(option('--metadata') || path.join(root,'.github/security/dependencies.json')),'utf8'));
if(!metadata.packages?.length || metadata.packages.some(p=>!/^(@[\w.-]+\/)?[\w.-]+$/.test(p.name)||!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(p.version)))throw Error('Dependency inventory invalid');
if(process.argv.includes('--online')) {
  const payload=Object.fromEntries(metadata.packages.map(p=>[p.name,[p.version]]));
  const response=await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Dependency advisory check unavailable: '+response.status);
  const advisories=await response.json();
  for(const [name,list] of Object.entries(advisories))for(const issue of list)console.log(JSON.stringify({name,severity:issue.severity,url:issue.url}));
  if(Object.values(advisories).flat().some(issue=>['high','critical'].includes(issue.severity)))throw Error('High/critical dependency advisory requires a rebuilt app');
}
console.log(JSON.stringify({publicFilesOnly:true,credentialPatternsClear:true,integrityVerified:true,dependencies:metadata.packages.length,online:process.argv.includes('--online')}));
