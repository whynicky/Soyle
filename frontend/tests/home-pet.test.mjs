import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const compiled=ts.transpileModule(await readFile(new URL('../lib/homePet.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {homePetStates,nextHomePetState,homePetDelay}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('rest follows anatomical transitions and wakes into sitting',()=>{
 for(let i=0;i<100;i++){
  const rng=()=>i/100;
  assert.equal(nextHomePetState('stand',null,false,rng),'sit');
  assert.equal(nextHomePetState('sleepy','lie',false,rng),'wake');
  assert.equal(nextHomePetState('wake','sleepy',false,rng),'sit');
  assert.ok(['wake','sleepy'].includes(nextHomePetState('lie','sit',false,rng)));
  assert.equal(nextHomePetState('read','sit',false,rng),'sit');
 }
});
test('weighted choices favor reading/looking and avoid repeating the last activity',()=>{
 const counts={read:0,look:0,lie:0,stand:0,happy:0};
 for(let i=0;i<1200;i++)counts[nextHomePetState('sit',null,false,()=>i/1200)]++;
 assert.ok(counts.read>counts.lie && counts.look>counts.lie && counts.lie>counts.happy);
 for(let i=0;i<100;i++)assert.notEqual(nextHomePetState('sit','read',false,()=>i/100),'read');
});
test('reduced mode excludes lying/sleep; activities dwell for 10–25s',()=>{
 for(let i=0;i<1000;i++){
  assert.ok(!['lie','sleepy'].includes(nextHomePetState('sit',null,true,()=>i/1000)));
  for(const state of Object.keys(homePetStates)){
   const delay=homePetDelay(state,()=>i/1000);
   if(!['wake','happy'].includes(state))assert.ok(delay>=10000 && delay<=25000);
  }
 }
 assert.equal(homePetDelay('wake'),4400);assert.equal(homePetDelay('happy'),3600);
});
