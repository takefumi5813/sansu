const {chromium}=require('C:/Users/tsuzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await b.newPage({viewport:{width:390,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SANSU_TEST_URL||pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);await page.waitForFunction(()=>window.SansuPilot);
 const stats=await page.evaluate(()=>{const ps=SansuPilot.data.problems;return {stored:ps.length,active:ps.filter(SansuCore.isActiveProblem).length,archived:ps.filter(p=>!SansuCore.isActiveProblem(p)).length,advanced:ps.filter(p=>p.category==='calc'&&SansuCore.isActiveProblem(p)&&['advanced','hard'].includes(SansuCore.calcTier(p))).length};});
 assert.deepEqual(stats,{stored:754,active:565,archived:189,advanced:0});
 await page.locator('#begin-adventure').click();await page.locator('[data-category="calc"]').click();
 assert.match(await page.locator('.board-footer').innerText(),/565問/);
 await page.locator('#practice-open').click();
 const catalog=await page.locator('[data-practice]').evaluateAll(es=>es.map(e=>e.dataset.practice));
 const expected=await page.evaluate(()=>SansuPilot.data.problems.filter(p=>p.category==='calc'&&SansuCore.isActiveProblem(p)).map(p=>p.id));assert.deepEqual(catalog.sort(),expected.sort());
 await page.locator('#settings-close').click();await page.locator('[data-tier="advanced"]').click();assert.equal(await page.locator('#start').isDisabled(),true);
 await page.locator('[data-tier="standard"]').click();await page.locator('#start').click();assert(await page.locator('#question-text').isVisible());
 assert.deepEqual(errors,[]);console.log(JSON.stringify({stats,catalogCount:catalog.length,browser:'pass'}));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
