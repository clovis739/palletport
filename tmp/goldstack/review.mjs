import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const products = JSON.parse(await readFile('prisma/goldstack-products.json', 'utf8')).products;
const imgs = await Promise.all(products.filter((_, i) => i % 5 === 0).map(async (p, i) => ({ input: await sharp('public' + p.images[0]).resize(180,150,{fit:'contain',background:'white'}).png().toBuffer(), left:i%5*180, top:Math.floor(i/5)*150 })));
await sharp({create:{width:900,height:600,channels:3,background:'white'}}).composite(imgs).png().toFile('tmp/goldstack/gallery-review.png');
