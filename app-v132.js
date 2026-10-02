const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cal=[[15,280],[16,297],[17,310],[18,333],[19,376],[20,393],[21,405],[22,437],[25,502]];
let knob=0.9,sub=0,roast="medium",rot=-32.4,drag=false,last=0,acc=0;
const tastes=[["sour","🍋 날카로운 신맛"],["bitter","☕ 쓴맛 / 로스티함"],["dry","🌿 떫음 / 건조감"],["thin","💧 묽음 / 밋밋함"],["heavy","🪵 무거움 / 답답함"],["hollow","🕳️ 빈 맛 / 짧은 피니시"],["sweet","🍯 단맛 / 균형감"]];
const rc={light:[92,95,1.8,2.3],medium:[89,92,1.5,1.8],mediumdark:[88,91,1.4,1.7],dark:[86,89,1.3,1.6]};
function micron(p){
  if(p<=0.9)return 153;
  if(p<1.5)return Math.round(153+(p-.9)*(280-153)/(.6));
  const q=p*10;
  for(let i=0;i<cal.length-1;i++){
    const a=cal[i],b=cal[i+1];
    if(q===a[0])return a[1];
    if(q>a[0]&&q<b[0])return Math.round(a[1]+(q-a[0])*(b[1]-a[1])/(b[0]-a[0]));
  }
  const a=cal.at(-2),b=cal.at(-1);
  return Math.round(a[1]+(q-a[0])*(b[1]-a[1])/(b[0]-a[0]));
}
function knobParts(p,s=0){
  const turn=Math.max(0,Math.floor(p/10));
  const dial=p-(turn*10);
  return {turn,dial,sub:s};
}
function kp(p,s=0){
  const q=knobParts(p,s);
  return q.turn+"+"+q.dial.toFixed(1);
}
function kp2(p,s=0,delta=0){
  const q=knobParts(p,s);
  return q.turn+"+"+(q.dial+delta).toFixed(2);
}
function stepKnob(dir){
  knob=Math.max(0,Math.round((knob+(dir>0?.1:-.1))*10)/10);
  rot += dir>0 ? -3.6 : 3.6;
}
function state(v){return v===0?"없음":v<=2?"아주 약함":v<=4?"약함":v<=6?"중간":v<=8?"강함":"매우 강함"}
function render(){ $("#knobText").textContent=kp(knob);$("#umText").textContent=micron(knob)+" µm";let d=+$("#dose").value,y=+$("#yield").value;$("#ratioText").textContent=d&&y?"1:"+(y/d).toFixed(2):"-";$("#knob").style.transform="translateX(-50%) rotate("+rot+"deg)"}
function build(){$("#dial").innerHTML="";tastes.forEach(([id,n],i)=>$("#sliders").insertAdjacentHTML("beforeend",`<div class="flavor"><div class="fhead"><span>${n}</span><span class="state" id="${id}S"></span></div><input id="${id}" type="range" min="0" max="10" value="0"></div>`));}
function refresh(){tastes.forEach(([id])=>$("#"+id+"S").textContent=state(+$("#"+id).value))}
$$(".roasts button").forEach(b=>b.onclick=()=>{$$(".roasts button").forEach(x=>x.classList.remove("on"));b.classList.add("on");roast=b.dataset.roast});
$$(".quick button").forEach(b=>b.onclick=()=>{$$(".quick button").forEach(x=>x.classList.remove("on"));b.classList.add("on");tastes.forEach(([id])=>$("#"+id).value=0);if(b.dataset.preset==="sour"){$("#sour").value=8;$("#thin").value=5;$("#hollow").value=4}if(b.dataset.preset==="bitter"){$("#bitter").value=8;$("#dry").value=5}if(b.dataset.preset==="mixed"){$("#sour").value=7;$("#bitter").value=7;$("#dry").value=5}refresh()});
document.addEventListener("input",e=>{if(e.target.matches("input")){refresh();render()}});
function ang(e){let r=$("#knob").getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI}
$("#knob").onpointerdown=e=>{drag=true;last=ang(e);$("#knob").setPointerCapture?.(e.pointerId)};
$("#knob").onpointermove=e=>{if(!drag)return;let a=ang(e),d=a-last;if(d>180)d-=360;if(d<-180)d+=360;last=a;acc+=d;rot+=d;while(acc>=3.6){stepKnob(-1);acc-=3.6}while(acc<=-3.6){stepKnob(1);acc+=3.6}render()};
$("#knob").onpointerup=$("#knob").onpointercancel=()=>{drag=false;acc=0};

$(".step-btn").forEach(btn=>btn.addEventListener("click",()=>{
  const input=$("#"+btn.dataset.target);
  const step=Number(input.step)||1;
  const dir=btn.classList.contains("plus")?1:-1;
  const decimals=step<1?1:0;
  let value=(Number(input.value)||0)+(dir*step);
  value=Math.max(0,value);
  input.value=value.toFixed(decimals);
  input.dispatchEvent(new Event("input",{bubbles:true}));
}));

$("#analyze").onclick=()=>{
  const doseEl=$("#dose"), yieldEl=$("#yield"), timeEl=$("#time"), tempEl=$("#temp");
  const d=+doseEl.value,y=+yieldEl.value,t=+timeEl.value,tmp=+tempEl.value;
  if(!d||!y||!t||!tmp)return alert("현재 샷 정보를 확인해줘.");
  const r=y/d,c=rc[roast];
  const S=+$("#sour").value,B=+$("#bitter").value,D=+$("#dry").value,T=+$("#thin").value,H=+$("#heavy").value,O=+$("#hollow").value,W=+$("#sweet").value;
  const u=S+T*.8+O*.7+(t<24?3:0)+(r<c[2]?2:0);
  const o=B+D*1.15+H*.5+(t>31?3:0)+(r>c[3]?2:0);
  const mixed=S>=4&&(B>=4||D>=4);

  let b="미세조정",h="한 변수만 미세 조정",why="한쪽 결점이 뚜렷하지 않아 아주 작은 조정이 좋습니다.";
  let targetText=kp(knob);
  let steps=["퍽 균일성과 흐름 확인","현재 밸런스를 크게 깨지 않도록 아주 작게 조정"];

  if(u>o){
    h="FINE으로 0.01 미세 조정";
    why="저추출 신호가 아주 조금 더 우세합니다.";
    targetText=kp2(knob,0,-0.01);
    steps=["FINE 방향으로 0.01 이동 → "+targetText,"나머지 변수는 그대로 두고 맛만 다시 확인"];
  }else if(o>u){
    h="COARSE로 0.01 미세 조정";
    why="과다추출 신호가 아주 조금 더 우세합니다.";
    targetText=kp2(knob,0,0.01);
    steps=["COARSE 방향으로 0.01 이동 → "+targetText,"나머지 변수는 그대로 두고 맛만 다시 확인"];
  }

  if(W>=7&&Math.max(S,B,D,T,H,O)<=3){
    b="균형 좋음";h="지금 세팅 그대로";why="단맛과 균형이 좋고 결점 신호가 낮습니다.";
    targetText=kp(knob);
    steps=["아무것도 바꾸지 않기","오늘 기준 샷으로 저장"];
  }else if(mixed){
    b="불균일 추출 의심";h="퍽 준비 먼저 확인";why="신맛과 쓴맛/떫음이 함께 강합니다.";
    targetText=kp(knob);
    steps=["WDT·분배·수평 탬핑 확인","그다음 노브는 표시 한 칸(0.1)만 움직여 다시 확인"];
  }else if(u>o+2){
    b="저추출 쪽";h="노브 0.1 곱게";why="신맛·묽음·빈 맛과 빠른 흐름이 저추출 쪽입니다.";
    const tk=Math.max(0,Math.round((knob-.1)*10)/10);targetText=kp(tk);
    steps=["FINE 방향으로 표시 한 칸(0.1) → "+targetText,"그래도 비면 추출량 +2g","마지막에 온도 +1°C"];
  }else if(o>u+2){
    b="과다추출 쪽";h="노브 0.1 굵게";why="쓴맛·떫음·건조감과 느린 흐름이 과다추출 쪽입니다.";
    const tk=Math.round((knob+.1)*10)/10;targetText=kp(tk);
    steps=["COARSE 방향으로 표시 한 칸(0.1) → "+targetText,"그래도 거칠면 추출량 -2g","마지막에 온도 -1°C"];
  }

  $("#badge").textContent=b;
  $("#headline").textContent=h;
  $("#cur").textContent=kp(knob);
  $("#target").textContent=targetText;
  $("#reason").textContent=why;
  $("#plan").innerHTML=steps.map((x,i)=>`<div><b>${i+1}.</b> ${x}</div>`).join("");
  $("#result").classList.remove("hidden");
  $("#result").scrollIntoView({behavior:"smooth"});
};
$("#saveShot").onclick=()=>{let H=JSON.parse(localStorage.getItem("shots")||"[]");H.unshift({k:knob,d:+$("#dose").value,y:+$("#yield").value,t:+$("#time").value,tmp:+$("#temp").value});localStorage.setItem("shots",JSON.stringify(H.slice(0,6)));showHist()};
function showHist(){let H=JSON.parse(localStorage.getItem("shots")||"[]");$("#history").innerHTML=H.map(x=>`<div class="hist"><b>${kp(x.k)}</b> · ${x.d}→${x.y}g · ${x.t}s · ${x.tmp}°C</div>`).join("")}
$("#reset").onclick=()=>{knob=0.9;sub=0;rot=-32.4;$("#dose").value="22.0";$("#yield").value="35.0";$("#time").value="27";$("#temp").value="92";tastes.forEach(([id])=>$("#"+id).value=0);$("#result").classList.add("hidden");refresh();render()};
build();refresh();render();showHist();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});