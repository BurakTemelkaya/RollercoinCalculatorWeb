// Extract the six 100ms idle poses from the supplied animated key art.
// Background colors were checked against the original frames; RGB colors remain unchanged.
// Usage: node scripts/extractCuscuzIdle.cjs C:/path/to/keyart_twitter.webp
const fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const sourcePath=process.argv[2];
if(!sourcePath)throw new Error('Provide the original keyart_twitter.webp path.');
const target=path.resolve(__dirname,'../public/assets/rollercoin/hamsters/pets/cuscuz/lvl50');
(async()=>{const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--disable-gpu']});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/');
const sourceData=fs.readFileSync(sourcePath).toString('base64');
const inputs=await page.evaluate(async data=>{
 const decoder=new ImageDecoder({data:Uint8Array.from(atob(data),c=>c.charCodeAt(0)),type:'image/webp'});
 await decoder.tracks.ready;
 if(decoder.tracks.selectedTrack.frameCount!==6)throw new Error('Expected six source frames.');
 const frames=[];
 for(let i=0;i<6;i++){
  const {image}=await decoder.decode({frameIndex:i});
  if(image.displayWidth!==1200||image.displayHeight!==740)throw new Error('Unexpected source dimensions.');
  if(image.duration!==100000)throw new Error('Expected 100ms source frames.');
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=740;
  canvas.getContext('2d').drawImage(image,0,0);
  frames.push(canvas.toDataURL('image/png').split(',')[1]);image.close();
 }
 decoder.close();return frames;
},sourceData);const result=await page.evaluate(async inputs=>{
 const rgb=(r,g,b)=>`${r},${g},${b}`;
 const foreground=new Set(['179,56,49','137,46,43','110,39,39','246,178,194','234,79,54','212,120,141','233,225,209','6,2,0','39,39,39','201,65,51','142,60,29','61,61,61','248,197,189','255,255,255','215,169,156','185,147,131']);
 const weapon=new Set(['249,194,43','247,150,23','251,107,29','255,255,255']);
 const cells=[];
 for(let frame=0;frame<inputs.length;frame++){
 const img=new Image();img.src='data:image/png;base64,'+inputs[frame];await img.decode();const source=document.createElement('canvas');source.width=1200;source.height=740;const ctx=source.getContext('2d');ctx.drawImage(img,0,0);const sourcePixels=ctx.getImageData(0,0,1200,740).data;
 const colors=[],mask=new Uint8Array(40*30);
 for(let y=0;y<30;y++)for(let x=0;x<40;x++){const p=((270+y*6+3)*1200+480+x*6+3)*4;const color=[...sourcePixels.slice(p,p+3)];colors.push(color);const key=rgb(...color);if(foreground.has(key)||(x>=28&&x<=35&&weapon.has(key)))mask[y*40+x]=1;}
 // Include the original dark silhouette, without the throne's dark upholstery.
 for(let y=1;y<28;y++)for(let x=1;x<39;x++)if(rgb(...colors[y*40+x])==='28,18,28'){
  if([[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>mask[(y+dy)*40+x+dx]&&rgb(...colors[(y+dy)*40+x+dx])!=='28,18,28'))mask[y*40+x]=1;
 }
 // Dark pixels within the two horns are part of the hamster, not the background.
 for(let y=0;y<7;y++)for(let x=12;x<28;x++)if(rgb(...colors[y*40+x])==='46,22,33'){
  if([[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>dy+y>=0&&dy+y<7&&rgb(...colors[(y+dy)*40+x+dx])==='179,56,49'))mask[y*40+x]=1;
 }
 const cell=document.createElement('canvas');cell.width=48;cell.height=48;const cc=cell.getContext('2d'),pixels=cc.createImageData(48,48);
 for(let y=0;y<30;y++)for(let x=0;x<40;x++)if(mask[y*40+x]){const p=((y+8)*48+x+4)*4;pixels.data.set([...colors[y*40+x],255],p);}
 cc.putImageData(pixels,0,0);cells.push(cell);
 }
 const strip=document.createElement('canvas');strip.width=288;strip.height=48;const sc=strip.getContext('2d');cells.forEach((cell,i)=>sc.drawImage(cell,i*48,0));
 return {idle:cells[0].toDataURL('image/png').split(',')[1],sprite:strip.toDataURL('image/png').split(',')[1]};},inputs);
fs.writeFileSync(target+'/idle.png',Buffer.from(result.idle,'base64'));fs.writeFileSync(target+'/sprite_idle.png',Buffer.from(result.sprite,'base64'));console.log('Saved source-color idle.png and 6-frame sprite_idle.png.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
