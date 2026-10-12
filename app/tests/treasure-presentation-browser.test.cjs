const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/tsuzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../dist'),shots=path.resolve(__dirname,'../reports/treasure-screenshots');
fs.mkdirSync(shots,{recursive:true});
// Expose the real scene only in the test server response, never in the shipped app.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('window.SansuPilot={','window.SansuPilot={playTreasure,');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURI(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}try{res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.webp')?'image/webp':'image/png');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
let browser;const results=[];
async function scenario(name,{before=0,won=false,guaranteed=false,roll=.5,skip=false,width=1280,height=900,reduced=false}={}){
 const ctx=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  const url=`http://127.0.0.1:${server.address().port}/`;await p.goto(url);await p.waitForFunction(()=>window.SansuPilot);
  await p.evaluate(async won=>{const s=SansuCore.initialState();s.equipmentBoxes=won?1:0;const db=SansuCore.createStorage();await db.save(s);await db.close();},won);
  await p.reload();await p.waitForFunction(()=>window.SansuPilot);await p.locator('#begin-adventure').click();
  await p.evaluate(roll=>Math.random=()=>roll,roll);
  await p.evaluate(({before,won,guaranteed})=>{window.treasureFinished=false;SansuPilot.playTreasure({won,guaranteed,missesBefore:before,missesAfter:won?0:before+1}).then(x=>{window.treasureOutcome=x;window.treasureFinished=true;});},{before,won,guaranteed});
  const initial=await p.evaluate(()=>SansuPilot.snapshot());
  if(name==='desktop-new'){await p.waitForTimeout(1250);await p.screenshot({path:path.join(shots,'01-chest.png')});}
  if(skip){await p.locator('#treasure-skip').click();}else{
   await p.locator('#treasure-open').click();await p.locator('#treasure-close').waitFor({timeout:15000});await p.waitForTimeout(reduced?50:1600);
   assert.equal(await p.locator('.gem-slot.filled').count(),won?0:before+1);
   assert.equal(await p.locator('.gem-row').getAttribute('aria-label'),`宝石 ${won?0:before+1}/9`);
   const visible=await p.evaluate(()=>{const q=document.querySelector('.treasure-item .weapon-art')||document.querySelector('.found-gem');return q&&Number(getComputedStyle(q.closest('.treasure-item,.found-gem')).opacity)>.9;});assert(visible,'result art must remain visible, including reduced motion');
   if(width>=height||height>=667){const box=await p.locator('#treasure-close').boundingBox();assert(box.y>=0&&box.y+box.height<=height,'continue must fit the viewport');}
   assert.equal(await p.evaluate(()=>document.querySelector('.treasure-dialog').scrollWidth>innerWidth),false);
   const art=p.locator('.treasure-item .weapon-art');if(await art.count()){const a=await art.boundingBox(),subtitle=await p.locator('.treasure-subtitle').boundingBox();assert(a.y>=subtitle.y+subtitle.height,'equipment must not overlap the subtitle');}
   await p.screenshot({path:path.join(shots,name+'.png')});
   await p.locator('#treasure-close').click();
  }
  await p.waitForFunction(()=>window.treasureFinished);assert.equal(await p.locator('.treasure-dialog').count(),0);await p.evaluate(()=>SansuPilot.whenSaved());
  const s=await p.evaluate(()=>SansuPilot.snapshot());assert.equal(s.equipmentDiscoveries,won?1:0);assert.equal(s.equipmentBoxes,0);assert.equal(s.materials,won&&roll===0?3:0);assert.equal(s.xp,initial.xp);assert.equal(s.souls,initial.souls);
  await p.reload();await p.waitForFunction(()=>window.SansuPilot);assert.equal(await p.evaluate(()=>SansuPilot.snapshot().equipmentDiscoveries),won?1:0);
  assert.deepEqual(errors,[]);results.push({name,ok:true});console.log('PASS '+name);
 }catch(e){results.push({name,ok:false,error:e.stack});console.error('FAIL '+name,e.message);}finally{await ctx.close();}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 await scenario('desktop-new',{won:true});await scenario('desktop-gem',{before:3});await scenario('desktop-nine',{before:8});await scenario('desktop-offering',{before:9,won:true,guaranteed:true});await scenario('desktop-duplicate',{before:3,won:true,roll:0});await scenario('skip-win',{won:true,skip:true});await scenario('skip-gem',{skip:true});await scenario('mobile-new',{won:true,width:390,height:844});await scenario('mobile-gem',{before:8,width:375,height:667});await scenario('reduced-new',{won:true,width:390,height:844,reduced:true});await scenario('reduced-gem',{before:8,width:390,height:844,reduced:true});
 // Exercise the real daily reward trigger by answering five calculations.
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await c.newPage();
 await p.goto(`http://127.0.0.1:${server.address().port}/`);await p.waitForFunction(()=>window.SansuPilot);await p.locator('#begin-adventure').click();await p.locator('[data-category="calc"]').click();await p.evaluate(()=>Math.random=()=>.5);await p.locator('#start').click();
 for(let i=0;i<5;i++){const text=await p.locator('#question-text').innerText(),a=await p.evaluate(text=>SansuPilot.data.problems.find(x=>x.text===text).answer,text);await p.locator('#answer').fill(a.n+'/'+a.d);await p.locator('#submit-answer').click();await p.evaluate(()=>SansuPilot.whenSaved());if(i<4)await p.locator('#next-calculation').click();}
 await p.locator('.treasure-dialog').waitFor();await p.locator('#treasure-open').click();await p.locator('#treasure-close').waitFor();assert.equal(await p.locator('.gem-slot.filled').count(),1);await p.locator('#treasure-close').click();assert.equal(await p.evaluate(()=>SansuPilot.snapshot().gearPity),1);assert.equal(await p.evaluate(()=>SansuPilot.snapshot().equipmentDiscoveries),0);await c.close();results.push({name:'five-calculations-daily-trigger',ok:true});console.log('PASS five-calculations-daily-trigger');
 fs.writeFileSync(path.join(shots,'results.json'),JSON.stringify(results,null,2));assert(results.every(r=>r.ok),JSON.stringify(results.filter(r=>!r.ok)));console.log('All '+results.length+' presentation scenarios passed.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
