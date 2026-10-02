import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { db } from '../src/lib/db';
async function main() {
  const lots = await db.lot.findMany({select:{id:true,slug:true,title:true,images:true}});
  const sources = JSON.parse(readFileSync('src/content/source-photos.json','utf8'));
  const cached = new Map<string,string>(sources.map((p:{sourceUrl:string;src:string})=>[p.sourceUrl,p.src]));
  const urls = [...new Set(lots.flatMap(p=>p.images.split('\n').map(s=>s.trim()).filter(Boolean)))];
  const images = urls.map((url,index)=>({index,url,local:url.startsWith('/')?url:cached.get(url)??null,products:lots.filter(p=>p.images.split('\n').includes(url)).map(p=>p.slug)}));
  mkdirSync('tmp/watermark-audit',{recursive:true});
  writeFileSync('tmp/watermark-audit/inventory.json',JSON.stringify({lots,images},null,2));
  console.log(JSON.stringify({products:lots.length,productsWithGalleries:lots.filter(p=>p.images).length,uniqueImages:images.length,cached:images.filter(p=>p.local&&existsSync('public'+p.local)).length,remote:images.filter(p=>!p.local).length,libraryImages:new Set(sources.map((p:{src:string})=>p.src)).size},null,2));
}
main().catch(e=>{console.error(e?.code??e.message);process.exitCode=1}).finally(()=>db.$disconnect());
