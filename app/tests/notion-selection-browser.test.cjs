const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/tsuzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const dismissTreasure=async()=>{const d=page.locator('.treasure-dialog[open]');await d.waitFor({timeout:2500}).catch(()=>{});if(await d.count()){if(await page.locator('#treasure-open').isVisible())await page.locator('#treasure-open').click();await page.locator('#treasure-close').click();}};
  await page.addInitScript(()=>localStorage.setItem('sansu-pilot-preferences',JSON.stringify({recentUnits:['R20'],scopeUnits:['R24','R25','R26','R27']})));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);await page.waitForFunction(()=>window.SansuPilot);await page.locator('#begin-adventure').click();
  assert.match(await page.locator('.scope-note').innerText(),/R26/);
  assert.equal(await page.locator('[data-mode="all"]').isDisabled(),true);
  await page.locator('#records-open').click();assert.equal(await page.locator('#recent-scope').inputValue(),'R26');assert.equal(await page.locator('#test-scope').inputValue(),'R24,R25,R26');await page.locator('#settings-close').click();
  await page.locator('[data-category="calc"]').click();await page.locator('[data-tier="basic"]').click();await page.locator('#start').click();
  const seen=new Set();
  for(let i=0;i<5;i++){
   const text=await page.locator('#question-text').innerText(),p=await page.evaluate(t=>window.SansuPilot.data.problems.find(p=>p.text.replace(/\n?[［\[]図[：:][^］\]]*[］\]]/g,'').trim()===t),text);
   assert.equal(p.category,'calc');assert.equal(seen.has(p.id),false);seen.add(p.id);
   await page.locator('#answer').fill(p.answer.n+'/'+p.answer.d);await page.locator('#submit-answer').click();await page.locator('#next-calculation').waitFor();
   if(i<4)await page.locator('#next-calculation').click();
  }
  await page.evaluate(()=>window.SansuPilot.whenSaved());const s=await page.evaluate(()=>window.SansuPilot.snapshot());assert.ok(s.materials>=10);assert.equal(s.attempts.filter(a=>a.correct).length,5);
  await dismissTreasure();await page.locator('#finish-session').click();await dismissTreasure();await page.locator('#return-home').click();await dismissTreasure();
  await page.locator('[data-category="geometry"]').click();await page.locator('[data-tier="standard"]').click();
  // R26 (相当算・還元算) has no figure problems yet: the R24 octagon is reached by switching the recent scope back to R24.
  assert.equal(await page.locator('#start').isDisabled(),true);
  await page.locator('#records-open').click();await page.locator('#recent-scope').fill('R24');await page.locator('#save-preferences').evaluate(b=>b.click());await dismissTreasure();
  if(await page.locator('[data-category="geometry"]').getAttribute('aria-pressed')!=='true')await page.locator('[data-category="geometry"]').click();await page.locator('[data-tier="standard"]').click();await page.locator('#start').click();
  await page.locator('#original-figure').evaluate(i=>i.decode());assert.equal(await page.locator('#original-figure').evaluate(i=>i.naturalWidth>0),true);
  await page.locator('#answer').fill('112.5');await page.locator('#submit-answer').click();await page.locator('#explanation-open').click();await page.locator('#step-next').click();await page.locator('#checkpoint-answer').fill('45');await page.locator('#checkpoint-submit').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  fs.mkdirSync(path.resolve(__dirname,'../reports/selection-screenshots'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../reports/selection-screenshots/geometry-explanation-390.png'),fullPage:true});
  assert.deepEqual(errors,[]);results.push('PASS: old scope migration to R26 (R24,R25,R26 learned), free expedition lock, five distinct standard calculations/daily rewards, original octagon image, wrong answer/checkpoint, 390px layout and no browser errors.');
  await context.close();
  const questContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),quest=await questContext.newPage();
  await quest.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);await quest.waitForFunction(()=>window.SansuPilot);await quest.locator('#begin-adventure').click();
  for(let i=0;i<2;i++){
   await quest.locator('#start').click();const text=await quest.locator('#question-text').innerText(),p=await quest.evaluate(t=>window.SansuPilot.data.problems.find(p=>p.text.replace(/\n?[［\[]図[：:][^］\]]*[］\]]/g,'').trim()===t),text);
   assert.deepEqual(p.scopeUnits,['R26']);assert.ok(p.source.url.includes('notion.com'));if(p.answer.parts){for(let k=0;k<p.answer.parts.length;k++){const a=p.answer.parts[k];await quest.locator('#answer-'+k).fill(a.terms?a.terms.join(':'):a.n+'/'+a.d);}}else await quest.locator('#answer').fill(p.answer.n+'/'+p.answer.d);await quest.locator('#submit-answer').click();await quest.locator('#finish-session').click();await quest.locator('#return-home').click();
  }
  await quest.evaluate(()=>window.SansuPilot.whenSaved());assert.equal(await quest.evaluate(()=>window.SansuPilot.snapshot().souls),4);
  assert.equal(await quest.locator('[data-mode="all"]').isDisabled(),true);assert.equal(await quest.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push('PASS: two different R26 Notion representatives, exact fraction answers, soul daily bonus, and expedition remains locked while priority types remain.');await questContext.close();
  fs.writeFileSync(path.resolve(__dirname,'../reports/notion-selection-browser-report.md'),results.join('\n')+'\n');console.log(results.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
