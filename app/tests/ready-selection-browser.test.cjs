const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/tsuzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const C=require('../src/core.js'),ready=require('../content/expedition-ready.json');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);await page.waitForFunction(()=>window.SansuPilot);await page.locator('#begin-adventure').click();
  assert.equal(await page.locator('#selected-bank-open').count(),0);assert.equal(await page.locator('[data-mode="all"]').isDisabled(),true);
  const data=await page.evaluate(()=>window.SansuPilot.data),state=C.initialState();
  for(const p of data.problems.filter(p=>!p.id.startsWith('ready-')&&p.category!=='calc'))state.units[p.unitId]={stage:4,due:null,highestStageEver:4,awardedStages:[1,2,3,4]};
  await page.locator('#records-open').click();await page.locator('#import-records').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({application:'sansu-pilot',schemaVersion:1,state}))});await page.getByRole('button',{name:'確認して読み込む',exact:true}).click();
  await page.locator('[data-mode="all"]').click();await page.locator('[data-category="oneline"]').click();await page.locator('[data-tier="standard"]').click();await page.locator('#start').click();
  const text=await page.locator('#question-text').innerText(),selected=ready.problems.find(p=>p.text===text);assert(selected,'normal start must select an integrated question');
  await page.locator('#answer').fill(selected.answer.n);await page.locator('#submit-answer').click();await page.evaluate(()=>window.SansuPilot.whenSaved());
  const after=await page.evaluate(()=>window.SansuPilot.snapshot());assert.equal(after.souls,1);assert.equal(after.units[selected.unitId].stage,1);
  await page.locator('#finish-session').click();await page.locator('#return-home').click();
  for(const p of ready.problems){
   await page.locator(`[data-category="${p.category}"]`).click();await page.locator('#practice-open').click();await page.locator(`[data-practice="${p.id}"]`).click();
   assert.equal(await page.locator('#question-text').innerText(),p.text);
   await page.locator('#answer').fill(String(Number(p.answer.n)+1));await page.locator('#submit-answer').click();assert.equal(await page.evaluate(()=>window.SansuPilot.snapshot().attempts.at(-1).correct),false);
   await page.locator('#explanation-open').click();
   for(let i=0;i<4;i++){
    assert.equal(await page.locator('.explanation-card .body').innerText(),p.explanation.steps[i].body);
    const cp=p.explanation.steps[i].checkpoint;
    if(cp){await page.locator('#checkpoint-answer').fill(cp.answer.n);await page.locator('#checkpoint-submit').click();assert((await page.locator('#checkpoint-message').innerText()).includes('合っています'));}
    if(i<3)await page.locator('#step-next').click();
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('#finish-session').click();await page.locator('#return-home').click();
  }
  await page.reload();await page.waitForFunction(()=>window.SansuPilot);assert.equal(await page.evaluate(id=>window.SansuPilot.snapshot().units[id].stage,selected.unitId),1);
  assert.deepEqual(errors,[]);console.log('PASS: no separate bank; expedition gate; normal automatic grading and rewards; all 20 explanations and checkpoints; saved review record.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
