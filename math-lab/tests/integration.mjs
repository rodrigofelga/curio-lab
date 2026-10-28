import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=process.env.CURIO_URL || 'http://127.0.0.1:8003/curio-lab/';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];const failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
try{
 await page.goto(base);assert.equal(await page.locator('.featured-card').count(),3);assert.equal(await page.locator('.upcoming-card').count(),3);assert.equal(await page.locator('.live-count strong').innerText(),'03');
 assert.equal(await page.locator('[data-category="biology"] .card-hit-link').getAttribute('href'),'https://rodrigofelga.github.io/animal-cell-explorer/');assert.equal(await page.locator('[data-category="space"] .card-hit-link').getAttribute('href'),'https://rodrigofelga.github.io/solar-system-galaxy/');
 await page.locator('[data-filter="mathematics"]').click();assert.equal(await page.locator('.featured-card:visible').count(),1);assert.equal(await page.locator('.upcoming-card:visible').count(),0);
 await page.locator('[data-filter="all"]').click();await page.locator('#experience-search').fill('cone');assert.equal(await page.locator('.featured-card:visible').count(),1);await page.locator('#experience-search').fill('');
 await page.screenshot({path:'test-results/curiolab-integration.png',fullPage:true});
 await page.locator('[data-category="mathematics"] .card-hit-link').click();await page.waitForURL(base+'math-lab/');assert.equal(await page.locator('[data-activity]').count(),4);assert.equal(await page.locator('.hub-link').getAttribute('href'),'https://rodrigofelga.github.io/curio-lab/');
 await page.locator('[data-subject="volume"]').click();await page.locator('[data-activity="cone"]').click();await page.locator('#stage canvas').waitFor();await page.locator('#play').click();await page.waitForTimeout(200);await page.locator('#play').click();assert.ok(Number(await page.locator('#progress').inputValue())>0);
 await page.locator('#language').selectOption('pt');await page.locator('#stage canvas').waitFor();assert.equal(await page.locator('.hub-link').getAttribute('aria-label'),'Voltar ao portal de aprendizagem CurioLab');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Portuguese activity mobile overflow');await page.locator('#back').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Portuguese home mobile overflow');await page.locator('[data-activity="cone"]').click();await page.locator('#stage canvas').waitFor();}
 await page.goto(base);await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Hub mobile overflow');await page.screenshot({path:'test-results/curiolab-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);await writeFile('test-results/integration-report.json',JSON.stringify({base,passed:true,errors,failures},null,2));console.log('PASS hub card, live counts, search/filter, existing explorer links, nested navigation, cone playback, bilingual return link, desktop/mobile layouts and network assets');
}finally{await browser.close();}
