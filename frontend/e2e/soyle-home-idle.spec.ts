import {test,expect} from '@playwright/test';

test('home life is automatic, interruptible, silent and absent from exercises',async({page},info)=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'no-preference'});
 // A seeded source gives reproducible coverage while keeping the real scheduler and Rive.
 await page.addInitScript(()=>{let seed=17;Math.random=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;});
 await page.route('**/api/**',async r=>{
  const response=await r.fetch({url:'http://localhost:8011'+new URL(r.request().url()).pathname,headers:{...r.request().headers(),origin:'http://localhost:3003'}});
  if(new URL(r.request().url()).pathname==='/api/settings')return r.fulfill({response,json:{...await response.json(),language:'ru',language_configured:true,calm_mode:false}});
  return r.fulfill({response});
 });
 await page.clock.install();
 await page.goto('/app');await page.getByRole('button',{name:'Ребёнок',exact:true}).click();
 await page.getByLabel('Логин ребёнка',{exact:true}).fill('alikhan');await page.getByLabel('PIN-код',{exact:true}).fill('1234');
 await page.getByRole('button',{name:'Начать заниматься',exact:true}).click();
 const pet=page.locator('.exercise-pet');
 await expect(pet).toHaveAttribute('data-pet-ready','true',{timeout:25000});
 await expect(pet).toHaveAttribute('data-pet-state','idle',{timeout:12000});
 await expect(pet).toHaveAttribute('data-rive-state',/Home • Sit idle/);
 await page.clock.fastForward(26000);await page.clock.runFor(1100);
 await expect(pet).not.toHaveAttribute('data-home-pet-state','sit');
 await expect(pet.locator('.pet-bubble')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('home-auto-idle.png')});
 const first=await pet.getAttribute('data-home-pet-state');
 // User activity delays the next automatic transition.
 await page.mouse.move(10,10);await page.clock.fastForward(9000);await page.clock.runFor(50);
 await expect(pet).toHaveAttribute('data-home-pet-state',first!);
 await pet.locator('button').click();await page.clock.runFor(700);
 await expect(pet).toHaveAttribute('data-pet-state','tap');
 await expect(pet).toHaveAttribute('data-rive-state',/Greeting/);
 await page.clock.fastForward(5000);await page.clock.runFor(1100);
 await expect(pet).toHaveAttribute('data-rive-state',/Home • Sit idle/);
 const seen=new Set<string>();
 for(let i=0;i<30;i++){
  await page.clock.fastForward(26000);await page.clock.runFor(1000);
  seen.add((await pet.getAttribute('data-home-pet-state'))!);
  await expect(pet.locator('.pet-bubble')).toHaveCount(0);
 }
 expect(seen.has('read')&&seen.has('look')&&seen.has('stand')).toBe(true);
 // Hidden tabs cannot advance the home activity.
 const pose=await pet.getAttribute('data-home-pet-state');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.fastForward(120000);await expect(pet).toHaveAttribute('data-home-pet-state',pose!);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(1100);
 // Follow a deterministic stand → sleep → wake → stand chain through the actual Rive graph.
 await page.evaluate(()=>{Math.random=()=>.8;});
 for(const [state,label] of [['stand','Stand idle'],['sleepy','Sleepy'],['wake','Wake stretch'],['stand','Stand idle']]){
  await page.clock.fastForward(26000);await page.clock.runFor(1100);
  await expect(pet).toHaveAttribute('data-home-pet-state',state);
  await expect(pet).toHaveAttribute('data-rive-state',new RegExp(`Home • ${label}`));
 }
 // System reduced motion keeps reading/looking but does not doze.
 await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(1100);
 for(let i=0;i<5;i++){
  await page.clock.fastForward(26000);await page.clock.runFor(1100);
  await expect(pet).not.toHaveAttribute('data-home-pet-state',/^sleepy$/);
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Leave via the actual home activity link; exercise runtime must use Companion.
 await page.locator('.home-activity-links button').first().click();
 const exercise=page.getByRole('button',{name:/Я хочу.*Начать/}).first();await exercise.click();
 await page.clock.runFor(6000);
 await expect(pet).toHaveAttribute('data-pet-mode','exercise');
 await expect(pet).toHaveAttribute('data-rive-state',/Idle/);
 await page.clock.fastForward(120000);await page.clock.runFor(1000);
 await expect(pet).not.toHaveAttribute('data-home-pet-state',/.+/);
 await expect(pet).toHaveAttribute('data-rive-state',/Idle/);
 await page.screenshot({path:info.outputPath('exercise-unchanged.png')});
});
