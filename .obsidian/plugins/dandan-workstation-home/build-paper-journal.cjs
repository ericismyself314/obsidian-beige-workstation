const fs = require('fs');
const path = require('path');
const dir = __dirname;
const base = fs.readFileSync(path.join(dir, 'runtime-base.js'), 'utf8');
const ext = fs.readFileSync(path.join(dir, 'journal-extension.js'), 'utf8');
const paging = fs.readFileSync(path.join(dir, 'home-paging.js'), 'utf8');
fs.writeFileSync(path.join(dir, 'main.js'), base + '\n\n' + ext + '\n\n' + paging, 'utf8');
console.log('Built main.js from runtime-base.js and journal-extension.js');

fs.writeFileSync(path.join(dir,'styles.css'),fs.readFileSync(path.join(dir,'runtime-base.css'),'utf8')+'\n\n'+fs.readFileSync(path.join(dir,'paper-journal.css'),'utf8'));
const snippet=path.resolve(dir,'../../snippets/beige-workstation.css');
fs.mkdirSync(path.dirname(snippet),{recursive:true});
fs.writeFileSync(snippet,['home-base.css','home-paper.css','home-paging.css'].map(n=>fs.readFileSync(path.join(dir,n),'utf8')).join('\n\n'));
