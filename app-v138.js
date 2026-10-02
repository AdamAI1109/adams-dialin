const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cal=[[15,280],[16,297],[17,310],[18,333],[19,376],[20,393],[21,405],[22,437],[25,502]];
let turn=0,major=9,sub=0,roast="medium",rot=-324,drag=false,last=0,acc=0;
const tastes=[["sour","🍋 날카로운 신맛"],["bitter","☕ 쓴맛 / 로스티함"],["dry","🌿 떫음 / 건조감"],["thin","💧 묽음 / 밋밋함"],["heavy","🪵 무거움 / 답답함"],["hollow","🕳️ 빈 맛 / 짧은 피니시"],["sweet","🍯 단맛 / 균형감"]];
const rc={light:[92,95,1.8,2.3],medium:[89,92,1.5,1.8],mediumdark:[88,91,1.4,1.7],dark:[86,89,1.3,1.6]};
function micron(p){
  if(p<=0)return 0;
  if(p<=0.9)return Math.round((p/0.9)*153);
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
function knobValue(t=turn,m=major,s=sub){
  return t+(m/10)+(s/60);
}
function kp(t=turn,m=major,s=sub){
  return t+"+"+m+"."+s;
}
function kp2(delta=0){
  const sign=delta<0?"-":"+";
  return kp()+" "+sign+"0.01";
}
function shiftedState(t,m,s,dir){
  if(dir>0){
    if(s<5)s++;
    else{s=0;m++;if(m>=10){m=0;t++;}}
  }else{
    if(s>0)s--;
    else{
      if(m>0){m--;s=5}
      else if(t>0){t--;m=9;s=5}
    }
  }
  return {t,m,s};
}
function shiftedStep(dir){
  return shiftedState(turn,major,sub,dir);
}
function shiftedSteps(dir,count){
  let n={t:turn,m:major,s:sub};
  for(let i=0;i<count;i++) n=shiftedState(n.t,n.m,n.s,dir);
  return n;
}
function stepKnob(dir){
  const n=shiftedStep(dir);
  turn=n.t;major=n.m;sub=n.s;
  rot += dir>0 ? -6 : 6;
}
function state(v){const labels=["없음","거의 없음","매우 미미함","미미함","약함","보통","약간 강함","조금 강함","강함","매우 강함","극도로 강함"];const n=Math.max(0,Math.min(10,Math.round(v)));return n+" · "+labels[n]}
function render(){ $("#knobText").textContent=kp();$("#umText").textContent=micron(knobValue())+" µm";let d=+$("#dose").value,y=+$("#yield").value;$("#ratioText").textContent=d&&y?"1:"+(y/d).toFixed(2):"-";$("#knob").style.transform="translateX(-50%) rotate("+rot+"deg)"}
function build(){$("#dial").innerHTML="";tastes.forEach(([id,n],i)=>$("#sliders").insertAdjacentHTML("beforeend",`<div class="flavor"><div class="fhead"><span>${n}</span><span class="state" id="${id}S"></span></div><input id="${id}" type="range" min="0" max="10" value="0"></div>`));}
function refresh(){tastes.forEach(([id])=>{const input=$("#"+id),label=$("#"+id+"S");if(input&&label)label.textContent=state(+input.value)})}
$$(".roasts button").forEach(b=>b.onclick=()=>{$$(".roasts button").forEach(x=>x.classList.remove("on"));b.classList.add("on");roast=b.dataset.roast});
$$(".quick button").forEach(b=>b.onclick=()=>{$$(".quick button").forEach(x=>x.classList.remove("on"));b.classList.add("on");tastes.forEach(([id])=>$("#"+id).value=0);if(b.dataset.preset==="sour"){$("#sour").value=8;$("#thin").value=5;$("#hollow").value=4}if(b.dataset.preset==="bitter"){$("#bitter").value=8;$("#dry").value=5}if(b.dataset.preset==="mixed"){$("#sour").value=7;$("#bitter").value=7;$("#dry").value=5}refresh()});
document.addEventListener("input",e=>{if(e.target.matches("input")){refresh();render()}});
function ang(e){let r=$("#knob").getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI}
$("#knob").onpointerdown=e=>{drag=true;last=ang(e);$("#knob").setPointerCapture?.(e.pointerId)};
$("#knob").onpointermove=e=>{if(!drag)return;let a=ang(e),d=a-last;if(d>180)d-=360;if(d<-180)d+=360;last=a;acc+=d;rot+=d;while(acc>=6){stepKnob(-1);acc-=6}while(acc<=-6){stepKnob(1);acc+=6}render()};
$("#knob").onpointerup=$("#knob").onpointercancel=()=>{drag=false;acc=0};

document.addEventListener("pointerdown",e=>{
  const btn=e.target.closest(".step-btn");
  if(!btn)return;
  $(".step-btn.pressed").forEach(x=>x.classList.remove("pressed"));
  btn.classList.add("pressed");
});
["pointerup","pointercancel","pointerleave"].forEach(type=>{
  document.addEventListener(type,e=>{
    const btn=e.target.closest?.(".step-btn");
    if(btn)btn.classList.remove("pressed");
  });
});
document.addEventListener("click",e=>{
  const btn=e.target.closest(".step-btn");
  if(!btn)return;
  e.preventDefault();
  const input=$("#"+btn.dataset.target);
  if(!input)return;
  const step=Number(input.getAttribute("step"))||1;
  const dir=btn.classList.contains("plus")?1:-1;
  const decimals=step<1?1:0;
  let value=(Number(input.value)||0)+(dir*step);
  value=Math.max(0,value);
  input.value=value.toFixed(decimals);
  input.dispatchEvent(new Event("input",{bubbles:true}));
});

$("#analyze").onclick=()=>{
  const doseEl=$("#dose"), yieldEl=$("#yield"), timeEl=$("#time"), tempEl=$("#temp");
  const d=+doseEl.value,y=+yieldEl.value,t=+timeEl.value,tmp=+tempEl.value;
  if(!d||!y||!t||!tmp)return alert("현재 샷 정보를 확인해줘.");

  const r=y/d,c=rc[roast];
  const S=+$("#sour").value,B=+$("#bitter").value,D=+$("#dry").value,T=+$("#thin").value,H=+$("#heavy").value,O=+$("#hollow").value,W=+$("#sweet").value;

  const u=S+T*.8+O*.7+(t<24?3:0)+(r<c[2]?2:0);
  const o=B+D*1.15+H*.5+(t>31?3:0)+(r>c[3]?2:0);
  const delta=u-o;

  // "mixed" is reserved for clearly strong opposing defects.
  // A moderate dry score alone should not hide an obvious sour/under-extracted shot.
  const mixed=S>=6 && (B>=6 || D>=6);

  let b="미세조정",h="한 변수만 미세 조정";
  let why="한쪽 결점이 뚜렷하지 않아 아주 작은 조정이 좋습니다.";
  let targetText=kp();
  let steps=["현재 세팅을 크게 바꾸지 않기","한 변수만 아주 작게 조정"];

  if(W>=7 && Math.max(S,B,D,T,H,O)<=3){
    b="균형 좋음";
    h="지금 세팅 그대로";
    why="단맛과 균형이 좋고 결점 신호가 낮습니다.";
    targetText=kp();
    steps=["아무것도 바꾸지 않기","오늘 기준 샷으로 저장"];
  }else if(mixed){
    b="불균일 추출 의심";
    h="노브보다 퍽 준비 먼저";
    why="신맛과 쓴맛/떫음이 모두 강해서 채널링이나 불균일 추출 가능성이 큽니다.";
    targetText=kp();
    steps=["WDT·분배·수평 탬핑 확인","노브는 일단 유지하고 다음 샷에서 방향을 다시 판단"];
  }else if(delta>2){
    // Strong one-sided sourness deserves more than a token 0.1 move.
    let marks=1;
    if(S>=8 && B<=3 && D<=4) marks=2;
    if(S>=8 && (T>=5 || O>=5 || t<23)) marks=3;
    const n=shiftedSteps(-1,marks);
    const amount=(marks/10).toFixed(1);

    b="저추출 쪽";
    h="FINE으로 "+amount+" 이동";
    why=marks>=2
      ? "신맛이 매우 강하고 반대쪽 결점은 낮아서 저추출 방향이 뚜렷합니다."
      : "저추출 신호가 우세합니다.";
    targetText=kp(n.t,n.m,n.s);
    steps=[
      "FINE 방향으로 "+amount+" → "+targetText,
      "도징·추출량·온도는 우선 그대로 유지",
      "다음 샷 맛을 보고 추가 0.1 여부 판단"
    ];
  }else if(delta<-2){
    let marks=1;
    if((B>=8 || D>=8) && S<=3) marks=2;
    if((B>=8 || D>=8) && (H>=5 || t>33)) marks=3;
    const n=shiftedSteps(1,marks);
    const amount=(marks/10).toFixed(1);

    b="과다추출 쪽";
    h="COARSE로 "+amount+" 이동";
    why=marks>=2
      ? "쓴맛/떫음이 매우 강하고 신맛은 낮아서 과다추출 방향이 뚜렷합니다."
      : "과다추출 신호가 우세합니다.";
    targetText=kp(n.t,n.m,n.s);
    steps=[
      "COARSE 방향으로 "+amount+" → "+targetText,
      "도징·추출량·온도는 우선 그대로 유지",
      "다음 샷 맛을 보고 추가 0.1 여부 판단"
    ];
  }else if(delta>0){
    b="미세조정";
    h="FINE으로 0.01 미세 조정";
    why="저추출 신호가 아주 조금 더 우세합니다.";
    targetText=kp2(-0.01);
    steps=["FINE 방향으로 0.01 → "+targetText,"나머지 변수는 그대로 두고 맛만 다시 확인"];
  }else if(delta<0){
    b="미세조정";
    h="COARSE로 0.01 미세 조정";
    why="과다추출 신호가 아주 조금 더 우세합니다.";
    targetText=kp2(0.01);
    steps=["COARSE 방향으로 0.01 → "+targetText,"나머지 변수는 그대로 두고 맛만 다시 확인"];
  }else{
    b="미세조정";
    h="노브 유지";
    why="저추출과 과다추출 신호가 거의 같습니다.";
    targetText=kp();
    steps=["노브는 그대로 유지","추출량이나 온도 중 한 변수만 소폭 조정"];
  }

  $("#badge").textContent=b;
  $("#headline").textContent=h;
  $("#cur").textContent=kp();
  $("#target").textContent=targetText;
  $("#reason").textContent=why;
  $("#plan").innerHTML=steps.map((x,i)=>`<div><b>${i+1}.</b> ${x}</div>`).join("");
  $("#result").classList.remove("hidden");
  $("#result").scrollIntoView({behavior:"smooth"});
};
$("#saveShot").onclick=()=>{let H=JSON.parse(localStorage.getItem("shots")||"[]");H.unshift({kt:turn,km:major,ks:sub,d:+$("#dose").value,y:+$("#yield").value,t:+$("#time").value,tmp:+$("#temp").value});localStorage.setItem("shots",JSON.stringify(H.slice(0,6)));showHist()};
function showHist(){let H=JSON.parse(localStorage.getItem("shots")||"[]");$("#history").innerHTML=H.map(x=>`<div class="hist"><b>${x.kt!==undefined?kp(x.kt,x.km,x.ks):String(x.k??"-")}</b> · ${x.d}→${x.y}g · ${x.t}s · ${x.tmp}°C</div>`).join("")}
$("#reset").onclick=()=>{turn=0;major=9;sub=0;rot=-324;$("#dose").value="22.0";$("#yield").value="35.0";$("#time").value="27";$("#temp").value="92";tastes.forEach(([id])=>$("#"+id).value=0);$("#result").classList.add("hidden");refresh();render()};
build();refresh();render();showHist();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});