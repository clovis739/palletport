import {readFileSync,writeFileSync} from 'node:fs';
import {db} from '../src/lib/db';
import {cleanProductPhotos} from '../src/lib/product-photos';

async function main() {
  const lots=await db.lot.findMany({select:{id:true,slug:true,images:true}});
  writeFileSync('tmp/watermark-audit/database-backup.json',JSON.stringify(lots,null,2));
  const changes=lots.map(lot=>({...lot,cleanImages:cleanProductPhotos(lot.images).join('\n')})).filter(lot=>lot.images!==lot.cleanImages);
  if(changes.some(lot=>lot.images&&!lot.cleanImages))throw new Error('Cleanup would empty an assigned gallery');
  let updated=0;
  for(const lot of changes){
    const result=await db.lot.updateMany({where:{id:lot.id,images:lot.images},data:{images:lot.cleanImages}});
    if(result.count!==1)throw new Error(`Product changed during cleanup: ${lot.slug}`);
    if(++updated%40===0)console.log(`Updated ${updated}/${changes.length} galleries`);
  }
  const after=await db.lot.findMany({select:{id:true,slug:true,images:true}});
  if(after.some(lot=>lot.images!==cleanProductPhotos(lot.images).join('\n')))throw new Error('Unresolved photo overrides remain');
  const report=JSON.parse(readFileSync('docs/PRODUCT-IMAGE-CLEANUP.json','utf8'));
  report.updatedProducts=updated;
  report.verifiedProducts=after.length;
  report.remainingRemoteGalleryURLs=after.flatMap(lot=>lot.images.split('\n')).filter(url=>url.startsWith('http')).length;
  writeFileSync('docs/PRODUCT-IMAGE-CLEANUP.json',JSON.stringify(report,null,2)+'\n');
  console.log(report);
}
main().catch(error=>{console.error(error?.code??error.message);process.exitCode=1}).finally(()=>db.$disconnect());
