import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
// Derive the app script reference from the HTML so a cache-version bump
// (app-v160.js?v=165 -> v=166) or a new app-vNNN.js file does not break the harness.
const scriptMatch=html.match(/<script src="\.\/(app-v\d+\.js)\?v=\d+"><\/script>/);
assert.ok(scriptMatch,"index.html must reference a versioned app script");
const appSrc=readFileSync(new URL("../"+scriptMatch[1],import.meta.url),"utf8");

// seed: optional map of localStorage keys to JSON-serializable values, written
// before any app script runs (simulates records saved by a previous session).
function boot(seed){
  const inlined=html.replace(scriptMatch[0],()=>"<script>"+appSrc+"</"+"script>");
  const dom=new JSDOM(inlined,{runScripts:"dangerously",url:"https://localhost/",pretendToBeVisual:true,
    beforeParse(window){
      window.alert=()=>{};
      window.HTMLElement.prototype.scrollIntoView=()=>{};
      if(seed)for(const[k,v]of Object.entries(seed))window.localStorage.setItem(k,JSON.stringify(v));
    }});
  return dom.window;
}

function score(window,flavor,n){
  window.document.querySelector(`button[data-flavor="${flavor}"][data-score="${n}"]`).click();
}

const zeroTastes={sour:0,bright:0,bitter:0,dry:0,thin:0,heavy:0,hollow:0,sweet:0};
const legacyShot=extra=>({knob:"0+9.0",kt:0,km:9,ks:0,d:22,y:35,t:27,tmp:92,ratio:35/22,ts:1761000000000,...extra}); // no tasteScale: legacy 0-10 record
const legacyAnalysis=extra=>({current:"0+9.0",target:"0+9.0",direction:"hold",move:0,repeatCount:1,dose:22,yield:35,time:27,temp:92,ratio:35/22,pi:{wet:2,wait:5},drink:{mode:"iced-americano",water:200,ice:null,milk:0,consistent:true},...extra}); // no tasteScale

test("app boots without errors and builds the taste inputs",t=>{
  const window=boot();
  const doc=window.document;
  assert.ok(doc.querySelectorAll("#sliders .flavor").length>=5,"primary taste rows render");
  assert.ok(doc.querySelector("#appError").classList.contains("hidden"),"error box stays hidden");
  assert.equal(doc.querySelector("#knobText").textContent,"0+9.0");
  assert.equal(doc.querySelector("#ratioText").textContent,"1:1.59");
});

test("taste buttons set the 0-5 score and label",t=>{
  const window=boot();
  const doc=window.document;
  score(window,"sour",4);
  assert.equal(doc.querySelector("#sour").value,"4");
  assert.match(doc.querySelector("#sourS").textContent,/^4 · /);
});

test("knob steppers move one 0.1 mark at a time",t=>{
  const window=boot();
  const doc=window.document;
  doc.querySelector("#knobCoarse").click();
  assert.equal(doc.querySelector("#knobText").textContent,"0+9.1");
  doc.querySelector("#knobFine").click();
  doc.querySelector("#knobFine").click();
  assert.equal(doc.querySelector("#knobText").textContent,"0+8.5");
});

test("baseline summary shows the 0-5 score the user entered, not doubled engine values",t=>{
  const window=boot();
  const doc=window.document;
  score(window,"sour",4);
  score(window,"sweet",3);
  doc.querySelector("#setBaseline").click();
  const text=doc.querySelector("#baselineBox").textContent;
  assert.match(text,/신맛 4/,"baseline shows sour 4");
  assert.match(text,/단맛 3/,"baseline shows sweet 3");
  assert.ok(!/신맛 8/.test(text),"baseline must not show the doubled engine value 8");
});

test("previous-shot comparison rows show 0-5 values on both sides",t=>{
  const window=boot();
  const doc=window.document;
  score(window,"sour",4);
  doc.querySelector("#analyze").click();
  assert.ok(!doc.querySelector("#result").classList.contains("hidden"),"first analysis renders");
  score(window,"sour",2);
  doc.querySelector("#analyze").click();
  const changes=doc.querySelector("#changes").textContent;
  assert.match(changes,/신맛/,"taste row exists");
  assert.match(changes,/4 → 2/,"comparison shows the 0-5 scores 4 and 2");
  assert.match(changes,/4 → 2 \(-2\)/,"the displayed change amount is on the 0-5 scale: -2, not the engine diff -4");
  assert.ok(!/8 → 4/.test(changes),"comparison must not show doubled engine values 8 and 4");
});

test("baseline comparison: legacy 8/10 baseline vs new 4/5 shot are equal internally, so no diff",t=>{
  const window=boot({baselineShot:legacyShot({tastes:{...zeroTastes,sour:8}})});
  const doc=window.document;
  score(window,"sour",4); // engine value 8, identical to the legacy 8/10 baseline
  doc.querySelector("#analyze").click();
  const bc=doc.querySelector("#baselineCompare").textContent;
  assert.ok(!/신맛 8→4/.test(bc),"equal internal values must not show a phantom 8→4 change");
  assert.match(bc,/맛 점수 동일/,"no real taste change is reported");
});

test("baseline comparison: legacy 4/10 baseline vs new 4/5 shot differ and the legacy scale is labeled",t=>{
  const window=boot({baselineShot:legacyShot({tastes:{...zeroTastes,sour:4}})});
  const doc=window.document;
  score(window,"sour",4); // engine 8, clearly different from legacy engine 4
  doc.querySelector("#analyze").click();
  const bc=doc.querySelector("#baselineCompare").textContent;
  assert.match(bc,/신맛 4\/10→4\/5/,"both scales are labeled: legacy 4/10, new 4/5");
});

test("previous-shot comparison: legacy 8/10 vs new 4/5 produces no taste row",t=>{
  const window=boot({lastAnalysis:legacyAnalysis({tastes:{...zeroTastes,sour:8}})});
  const doc=window.document;
  score(window,"sour",4); // engine 8, identical internally
  doc.querySelector("#analyze").click();
  const changes=doc.querySelector("#changes").textContent;
  assert.ok(!/신맛/.test(changes),"no sour row when internal values are equal");
});

test("previous-shot comparison: legacy scores are labeled /10 next to new 0-5 scores",t=>{
  const window=boot({lastAnalysis:legacyAnalysis({tastes:{...zeroTastes,sour:4}})});
  const doc=window.document;
  score(window,"sour",4); // engine 8 vs legacy engine 4: a real change
  doc.querySelector("#analyze").click();
  const changes=doc.querySelector("#changes").textContent;
  assert.match(changes,/신맛\s?4\/10 → 4\/5/,"both scales are labeled: legacy 4/10, new 4/5");
});

test("boundary scores 0 and 5 display on the 0-5 scale, including in comparisons",t=>{
  const window=boot();
  const doc=window.document;
  score(window,"sour",5);
  score(window,"sweet",0);
  doc.querySelector("#setBaseline").click();
  const text=doc.querySelector("#baselineBox").textContent;
  assert.match(text,/신맛 5/,"max score 5 shows as 5, not 10 or -");
  assert.match(text,/단맛 0/,"min score 0 shows as 0, not -");
  score(window,"sour",0);
  doc.querySelector("#analyze").click();
  assert.match(doc.querySelector("#baselineCompare").textContent,/신맛 5→0/,"5 to 0 boundary change is shown on the 0-5 scale");
});

test("records saved by a previous session render correctly on a fresh page load",t=>{
  const shot={knob:"0+9.0",kt:0,km:9,ks:0,d:22,y:35,t:27,tmp:92,ratio:35/22,tastes:{...zeroTastes,sour:8,sweet:6},tasteScale:5,ts:1761000000000};
  const window=boot({shots:[shot],baselineShot:shot});
  const doc=window.document;
  const hist=doc.querySelector("#history").textContent;
  assert.match(hist,/🍋 4/,"history card halves the stored engine value back to the 0-5 scale");
  assert.match(hist,/🍯 3/,"sweet 3 shows in history");
  const base=doc.querySelector("#baselineBox").textContent;
  assert.match(base,/신맛 4/,"baseline box restores the saved baseline on the 0-5 scale");
});
