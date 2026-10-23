import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const appSrc=readFileSync(new URL("../app-v160.js",import.meta.url),"utf8");

function boot(){
  const marker='<script src="./app-v160.js?v=165"></script>';
  assert.ok(html.includes(marker),"index.html must load app-v160.js");
  const inlined=html.replace(marker,()=>"<script>"+appSrc+"</"+"script>");
  const dom=new JSDOM(inlined,{runScripts:"dangerously",url:"https://localhost/",pretendToBeVisual:true});
  const {window}=dom;
  window.alert=()=>{};
  window.HTMLElement.prototype.scrollIntoView=()=>{};
  return window;
}

function score(window,flavor,n){
  window.document.querySelector(`button[data-flavor="${flavor}"][data-score="${n}"]`).click();
}

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
  assert.ok(!/8 → 4/.test(changes),"comparison must not show doubled engine values 8 and 4");
});
