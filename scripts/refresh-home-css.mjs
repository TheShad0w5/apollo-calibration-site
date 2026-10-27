// Refresh homepage CSS after editing the shared source stylesheets.
// Run from repository root: node scripts/refresh-home-css.mjs
// Embeds only the homepage copies; preserves original cascade order and no-JS styling.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../retail/',import.meta.url);
const page=new URL('index.html',root);
let html=await readFile(page,'utf8');
for(const name of ['etuning.css','tbk-brand.css','see-work.css']){
 const css=await readFile(new URL(name,root),'utf8');
 const escaped=name.replaceAll('.', '\\.');
 const existing=new RegExp('<style data-home-css="'+escaped+'">[\\s\\S]*?<\\/style>');
 const link=new RegExp('<link rel="stylesheet" href="/'+escaped+'(?:\\?[^"]*)?">');
 const target=existing.test(html)?existing:link;
 if(!target.test(html))throw new Error('Missing homepage stylesheet slot: '+name);
 html=html.replace(target,()=>'<style data-home-css="'+name+'">\n'+css+'\n</style>');
}
await writeFile(page,html);
console.log('Refreshed homepage styles from shared sources.');
