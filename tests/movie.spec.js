import { test, expect } from '@playwright/test';
import { chapters, endings } from '../src/story.js';
import { resolve, sep } from 'node:path';

const baseURL='https://example.test/christmas-romance-adventure/';

async function mountProduction(page) {
  const root=resolve('dist');
  await page.route('**/*',async route=>{
    const url=route.request().url();
    if (!url.startsWith(baseURL)) { await route.abort(); return; }
    const file=resolve(root,new URL(url).pathname.split('/').slice(2).join('/')||'index.html');
    if (!file.startsWith(root+sep)) { await route.abort(); return; }
    await route.fulfill({path:file});
  });
}


async function openMovie(page) {
  await mountProduction(page);
  await page.goto('./');
  await page.getByRole('button',{name:'Sound on'}).click();
  await page.getByRole('button',{name:'Reduced motion'}).click();
  await page.getByRole('button',{name:'Play Movie'}).click();
}

async function openChapter(page,chapter) {
  await expect(page.getByRole('heading',{name:chapter.title}).first()).toBeVisible();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  for(const _ of chapter.intro) await page.getByRole('button',{name:'Continue ↵'}).click();
  await expect(page.locator('#objective')).toContainText(chapter.objective);
}

for(const [endingIndex,ending] of endings.entries()) {
  test('finishes the production movie with '+ending.title,async({ page },info)=>{
    const errors=[];
    const failures=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()); });
    page.on('requestfailed',request=>failures.push(request.url()));
    const requests=[];
    page.on('request',request=>requests.push(request.url()));
    await openMovie(page);
    for(const [index,chapter] of chapters.entries()) {
      await openChapter(page,chapter);
      if(index===0) {
        await page.keyboard.press('Escape');
        await expect(page.getByRole('heading',{name:'Movie paused'})).toBeVisible();
        await page.keyboard.press('Escape');
        await page.keyboard.press('Space');
        if (endingIndex===0) await page.screenshot({path:info.outputPath('coming-home.png')});
      }
      await page.keyboard.down(index%2?'d':'ArrowRight');
      if(index===0) {
        await expect(page.getByRole('button',{name:'Continue ↵'})).toBeVisible({timeout:27000});
        await page.keyboard.up('ArrowRight');
      } else {
        const prompt=page.getByRole('button',{name:'✦ '+chapter.goal.label+' · E',exact:true});
        await expect(prompt).toBeVisible({timeout:27000});
        await page.keyboard.up(index%2?'d':'ArrowRight');
        await expect(page.locator('#objective')).toHaveText(chapter.destination);
        if(chapter.items.length) await expect(page.locator('#inventory')).toContainText(chapter.items.length+' / '+chapter.items.length);
        if (index===2 && endingIndex===0) await page.screenshot({path:info.outputPath('tree-farm.png')});
        await page.keyboard.press('e');
      }
      for(const line of chapter.dialogue) {
        if(line.choices) {
          const choices=page.locator('.choices button');
          await expect(choices).toHaveCount(3);
          await page.keyboard.press(String(endingIndex+1));
          const reply=line.choices[endingIndex].reply||ending.reply;
          await expect(page.locator('.dialogue p')).toHaveText(reply);
        }
        await page.getByRole('button',{name:'Continue ↵'}).click();
      }
      if(index===4&&endingIndex===0) await page.screenshot({path:info.outputPath('christmas-wish.png')});
    }
    await page.getByRole('button',{name:'See Christmas Movie Bingo'}).click();
    await expect(page.getByRole('heading',{name:ending.title})).toBeVisible();
    await expect(page.locator('.bingo li span')).toHaveText(Array(16).fill('✦'));
    await expect(page.getByText(/Completion time/)).toBeVisible();
    if(endingIndex===0) await page.screenshot({path:info.outputPath('bingo.png')});
    await page.getByRole('button',{name:'Play Again'}).click();
    await openChapter(page,chapters[0]);
    await expect(page.locator('#inventory')).toContainText('0 / 3');
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
    expect(requests.every(url=>url.startsWith(baseURL))).toBe(true);
  });
}


test('mobile touch controls move, jump and interact, and preferences persist',async({ browser },info)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,
    baseURL});
  try {
    const page=await context.newPage();
    await openMovie(page);
    await openChapter(page,chapters[0]);
    await expect(page.getByRole('navigation',{name:'Touch controls'})).toBeVisible();
    await page.getByRole('button',{name:'Jump'}).tap();
    const right=page.getByRole('button',{name:'Move right'});
    const bounds=await right.boundingBox();
    const cdp=await context.newCDPSession(page);
    const point={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    await expect(page.locator('#inventory')).toContainText('1 / 3',{timeout:8500});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.screenshot({path:info.outputPath('mobile.png')});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    await expect(page.getByRole('button',{name:'Continue ↵'})).toBeVisible({timeout:22000});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    for(const _ of chapters[0].dialogue) await page.getByRole('button',{name:'Continue ↵'}).tap();
    await openChapter(page,chapters[1]);
    const nextPosition=await right.boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{
      x:nextPosition.x+nextPosition.width/2,y:nextPosition.y+nextPosition.height/2
    }]});
    await expect(page.getByRole('button',{name:'✦ Jack · E',exact:true})).toBeVisible({timeout:27000});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.getByRole('button',{name:'✦ Interact',exact:true}).tap();
    await expect(page.getByRole('button',{name:'Continue ↵'})).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button',{name:'Sound off'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Motion reduced'})).toBeVisible();
  } finally { await context.close(); }
});
