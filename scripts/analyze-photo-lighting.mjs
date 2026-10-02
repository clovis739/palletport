// Measure existing assets; display corrections never modify the source photographs.
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const library=JSON.parse(await readFile('src/content/source-photos.json','utf8'));
const overrides=JSON.parse(await readFile('src/content/product-photo-overrides.json','utf8'));
const urls=[...new Set([...library.map(p=>p.src),...Object.values(overrides).filter(Boolean)])];
const corrections={},measurements=[];
for(let offset=0;offset<urls.length;offset+=12){
 await Promise.all(urls.slice(offset,offset+12).map(async src=>{
  const {data,info}=await sharp('public'+src).resize(96,96,{fit:'inside',withoutEnlargement:true}).flatten({background:'white'}).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
  const bins=new Array(256).fill(0);let total=0,count=info.width*info.height;
  for(let i=0;i<data.length;i+=info.channels){const value=Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);bins[value]++;total+=value;}
  function percentile(q){let sum=0;for(let i=0;i<256;i++){sum+=bins[i];if(sum>=count*q)return i;}return 255;}
  const mean=total/count,median=percentile(.5),highlights=percentile(.9);
  // White backgrounds and bright highlights usually indicate dark merchandise, not underexposure.
  if(mean<105&&median<110&&highlights<210&&mean>20){
   const brightness=mean<70?1.10:1.07;
   corrections[src]={brightness,contrast:1.025};
   measurements.push({src,mean:Math.round(mean),median,highlights,brightness,contrast:1.025});
  }
 }));
}
await writeFile('src/content/photo-lighting.json',JSON.stringify(corrections,null,2)+'\n');
await writeFile('docs/PHOTO-LIGHTING-REPORT.json',JSON.stringify({analyzedImages:urls.length,adjustedImages:measurements.length,mode:'CSS display correction; original files and feed image URLs preserved',measurements:measurements.sort((a,b)=>a.mean-b.mean)},null,2)+'\n');
console.log({analyzedImages:urls.length,adjustedImages:measurements.length});
