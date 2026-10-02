import { db } from '../src/lib/db';
const pattern = /jax/i;
async function main() {
  const [lots, entries, settings, sellers, media] = await Promise.all([
    db.lot.findMany({select:{slug:true,title:true,description:true,source:true,sourceCondition:true,sourceDelivery:true,brand:true,shipsFrom:true,images:true,externalUrl:true}}),
    db.contentEntry.findMany({select:{slug:true,status:true,title:true,excerpt:true,category:true,tags:true,author:true,blocks:true,meta:true}}),
    db.siteSetting.findMany({select:{key:true,value:true}}),
    db.seller.findMany({select:{slug:true,name:true,bio:true,location:true}}),
    db.media.findMany({select:{id:true,url:true,alt:true,filename:true}}),
  ]);
  const fields = (row: object, exclude: string[] = []) => Object.entries(row).filter(([key,value])=>!exclude.includes(key)&&typeof value==='string'&&pattern.test(value)).map(([key])=>key);
  const productMatches = lots.map(p=>({slug:p.slug,fields:fields(p,['slug','externalUrl'])})).filter(p=>p.fields.length);
  const contentMatches = entries.map(p=>({slug:p.slug,status:p.status,fields:fields(p)})).filter(p=>p.fields.length);
  for (const p of lots.filter(p=>pattern.test(p.description))) {
    const index = p.description.search(pattern);
    console.log(JSON.stringify({slug:p.slug,excerpt:p.description.slice(Math.max(0,index-50),index+110)}));
  }
  console.log(JSON.stringify({productsChecked:lots.length,productTextMatches:productMatches.filter(p=>p.fields.some(f=>f!=='images')),productsWithJaxImagePaths:productMatches.filter(p=>p.fields.includes('images')).length,imagePathSamples:lots.filter(p=>pattern.test(p.images)).slice(0,2).map(p=>p.images.split('\n')[0]),publicProductSlugs:lots.filter(p=>pattern.test(p.slug)).length,contentMatches,settingMatches:settings.filter(s=>pattern.test(s.value)).map(s=>s.key),sellerMatches:sellers.map(p=>({slug:p.slug,fields:fields(p)})).filter(p=>p.fields.length),mediaMatches:media.map(p=>({id:p.id,fields:fields(p)})).filter(p=>p.fields.length),internalSupplierUrls:lots.filter(p=>pattern.test(p.externalUrl??'')).length},null,2));
}
main().catch(error=>{console.error(error?.code??error.message);process.exitCode=1}).finally(()=>db.$disconnect());
