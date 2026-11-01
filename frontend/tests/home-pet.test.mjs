import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const compiled=ts.transpileModule(await readFile(new URL('../lib/homePet.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {homePetStates,nextHomePetState,homePetDelay}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('standing sleep always wakes upright; no unrelated clips follow sleep',()=>{
 for(let i=0;i<100;i++){
  const rng=()=>i/100;
  assert.equal(nextHomePetState('sleepy','stand',false,rng),'wake');
  assert.equal(nextHomePetState('wake','sleepy',false,rng),'stand');
  assert.ok(['sit','sleepy'].includes(nextHomePetState('stand','sit',false,rng)));
  assert.equal(nextHomePetState('happy','sit',false,rng),'sit');
 }
});
test('weighted choices prefer reading and looking; avoid immediate activity repetition',()=>{
 const counts={read:0,look:0,stand:0,happy:0};
 for(let i=0;i<1100;i++)counts[nextHomePetState('sit',null,false,()=>i/1100)]++;
 assert.ok(counts.read>counts.stand && counts.look>counts.stand && counts.stand>counts.happy);
 for(let i=0;i<100;i++)assert.notEqual(nextHomePetState('sit','read',false,()=>i/100),'read');
});
test('reduced motion avoids sleeping; dwell intervals stay 10–25s',()=>{
 for(let i=0;i<1000;i++){
  assert.ok(nextHomePetState('stand',null,true,()=>i/1000) !== 'sleepy');
  for(const state of Object.keys(homePetStates)){
   const delay=homePetDelay(state,()=>i/1000);
   if(!['wake','happy'].includes(state))assert.ok(delay>=10000 && delay<=25000);
  }
 }
 assert.equal(homePetDelay('wake'),3600);assert.equal(homePetDelay('happy'),3200);
});
