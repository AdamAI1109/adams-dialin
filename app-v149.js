const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cal=[[15,280],[16,297],[17,310],[18,333],[19,376],[20,393],[21,405],[22,437],[25,502]];
let turn=0,major=9,sub=0,roast="medium",rot=-324,drag=false,last=0,acc=0;
const tastes=[["sour","🍋 날카로운 신맛"],["bitter","☕ 쓴맛 / 로스티함"],["dry","🌿 떫음 / 건조감"],["thin","💧 묽음 / 밋밋함"],["heavy","🧱 무거움 / 답답함"],["hollow","🕳️ 빈 맛 / 짧은 피니시"],["sweet","🍯 단맛 / 균형감"]];
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
  const dir=delta<0?"FINE":"COARSE";
  return kp()+" · "+dir+" 미세";
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


function currentTasteVector(){
  return {
    sour:+$("#sour").value,bitter:+$("#bitter").value,dry:+$("#dry").value,
    thin:+$("#thin").value,heavy:+$("#heavy").value,hollow:+$("#hollow").value,sweet:+$("#sweet").value
  };
}
function loadLastAnalysis(){
  try{return JSON.parse(localStorage.getItem("lastAnalysis")||"null")}catch(e){return null}
}
function saveLastAnalysis(data){
  try{localStorage.setItem("lastAnalysis",JSON.stringify(data))}catch(e){}
}


const tasteNames={
  sour:"신맛",bitter:"쓴맛",dry:"떫음",thin:"묽음",heavy:"무거움",hollow:"빈 맛",sweet:"단맛"
};

function loadBaseline(){
  try{return JSON.parse(localStorage.getItem("baselineShot")||"null")}catch(e){return null}
}
function saveBaseline(data){
  try{localStorage.setItem("baselineShot",JSON.stringify(data))}catch(e){}
}
function confidenceLabel(delta,mixed,tv){
  if(mixed)return "낮음";
  const defects=[tv.sour,tv.bitter,tv.dry,tv.thin,tv.heavy,tv.hollow];
  const peak=Math.max(...defects);
  const gap=Math.abs(delta);
  if(gap>=7 && peak>=7)return "높음";
  if(gap>=3)return "중간";
  return "낮음";
}
function stageLabel(balanced,repeatCount,move,direction){
  if(balanced)return "기준 샷 후보";
  if(move===0.01)return "미세조정";
  if(direction==="hold")return "재확인";
  if(repeatCount>=3)return "3차 조정";
  if(repeatCount===2)return "2차 조정";
  return "1차 조정";
}
function shotSnapshot(){
  const d=+$("#dose").value,y=+$("#yield").value,t=+$("#time").value,tmp=+$("#temp").value;
  return {
    kt:turn,km:major,ks:sub,knob:kp(),d,y,t,tmp,ratio:d?y/d:0,
    tastes:currentTasteVector(),ts:Date.now()
  };
}
function baselineSummaryHtml(b){
  if(!b)return "";
  return `<div class="baseline-title">⭐ 기준 샷</div>
    <div class="baseline-main"><b>${b.knob||kp(b.kt,b.km,b.ks)}</b><span>${Number(b.d).toFixed(1)}g → ${Number(b.y).toFixed(1)}g · ${b.t}s · ${b.tmp}°C</span></div>
    <div class="baseline-sub">비율 1:${Number(b.ratio||b.y/b.d).toFixed(2)} · 신맛 ${b.tastes?.sour??"-"} · 쓴맛 ${b.tastes?.bitter??"-"} · 단맛 ${b.tastes?.sweet??"-"}</div>`;
}

function signed(n,digits=0){
  const v=Number(n)||0;
  return (v>0?"+":"")+v.toFixed(digits);
}

function dominantTaste(tv){
  const order=[
    ["sour","신맛"],["bitter","쓴맛"],["dry","떫음"],["thin","묽음"],
    ["heavy","무거움"],["hollow","빈 맛"],["sweet","단맛"]
  ];
  const defects=order.filter(([k])=>k!=="sweet").map(([k,n])=>({k,n,v:Number(tv[k]||0)})).sort((a,b)=>b.v-a.v);
  return defects[0]||{k:"",n:"",v:0};
}

function primaryVariable(primary){
  if(primary.includes("추출량"))return "yield";
  if(primary.includes("온도"))return "temp";
  if(primary.includes("FINE")||primary.includes("COARSE"))return "grind";
  if(primary.includes("퍽")||primary.includes("유량"))return "puck";
  return "hold";
}
function previousChangeApplied(last,curKnob,y,tmp){
  if(!last)return false;
  if(last.primaryVariable==="grind")return curKnob!==last.current;
  if(last.primaryVariable==="yield")return Math.abs(y-(last.yield??y))>=0.5;
  if(last.primaryVariable==="temp")return tmp!==(last.temp??tmp);
  return false;
}

function comparisonAudit(last,{d,y,t,tmp,curKnob}){
  if(!last)return {level:"첫 샷",note:"이전 샷이 없어 현재 입력만으로 판단합니다.",uncontrolled:false};
  const changed=[];
  if(Math.abs(d-(last.dose??d))>=0.3)changed.push("도징");
  if(Math.abs(y-(last.yield??y))>=0.5)changed.push("추출량");
  if(Math.abs(tmp-(last.temp??tmp))>=1)changed.push("온도");
  if(curKnob!==(last.current??curKnob))changed.push("노브");
  const recommended=last.primaryVariable||"";
  const map={dose:"도징",yield:"추출량",temp:"온도",grind:"노브",puck:"퍽"};
  const recName=map[recommended]||"";
  const unexpected=changed.filter(x=>x!==recName);
  if(unexpected.length>=2)return {level:"낮음",note:"여러 변수가 동시에 바뀌어 이전 샷과 원인 비교가 어렵습니다: "+changed.join(" · "),uncontrolled:true};
  if(unexpected.length===1)return {level:"중간",note:"추천 변수 외에 "+unexpected[0]+"도 바뀌어 비교 신뢰도가 조금 낮습니다.",uncontrolled:true};
  return {level:"좋음",note:"한 변수 중심으로 바뀌어 이전 샷과 비교하기 좋습니다.",uncontrolled:false};
}
function repeatabilityGuard(last,{d,y,t,tmp,curKnob}){
  if(!last)return null;
  const sameKnob=curKnob===last.current;
  const sameDose=Math.abs(d-(last.dose??d))<0.3;
  const sameYield=Math.abs(y-(last.yield??y))<0.5;
  const sameTemp=Math.abs(tmp-(last.temp??tmp))<1;
  const timeDrift=Math.abs(t-(last.time??t));
  if(sameKnob&&sameDose&&sameYield&&sameTemp&&timeDrift>=4){
    return {timeDrift,note:"세팅은 같은데 추출시간이 "+timeDrift+"초 차이납니다. 분쇄도보다 도징 분포·탬핑·잔류분·유량 편차를 먼저 확인하세요."};
  }
  return null;
}

function shotSummaryText(tv,t,r,c,mixed){
  const {sour:S,bitter:B,dry:D,thin:T,heavy:H,hollow:O,sweet:W}=tv;
  if(W>=7 && Math.max(S,B,D,T,H,O)<=3)return "균형이 좋고 큰 결점이 없는 샷";
  if((S>=5&&D>=4)||(S>=5&&B>=5)||mixed)return "신맛과 거친 결점이 겹쳐 불균일 추출 가능성";
  if(S>=4&&T>=4)return "날카로운 신맛과 묽음이 함께 있는 추출 부족 경향";
  if(T>=4&&O>=4)return "묽고 빈 피니시가 함께 나타나는 바디 부족";
  if(B>=4&&H>=4)return "쓴맛과 무거운 바디가 함께 있는 과한 추출 강도";
  if(D>=4&&t>31)return "긴 추출시간과 떫음이 겹친 과저항 경향";
  if(T>=3&&S<=3&&B<=3&&D<=3)return "맛 방향은 깨끗하지만 농도와 바디가 부족한 편";
  if(H>=3&&S<=3&&B<=3&&D<=3)return "결점은 적지만 바디가 다소 무겁고 답답한 편";
  if(S>=4)return "날카로운 신맛이 가장 두드러지는 샷";
  if(B>=4||D>=4)return "쓴맛·떫음 계열이 가장 두드러지는 샷";
  if(r<c[2])return "비율이 짧아 추출 수율을 더 확인할 필요가 있는 샷";
  if(r>c[3])return "비율이 길어 농도와 피니시를 확인할 필요가 있는 샷";
  return "큰 결점은 적고 미세한 조정만 필요한 샷";
}

function expectedOutcome(primary,tv){
  if(primary.includes("추출량 -")) return "농도와 바디가 조금 올라가고 묽음이 줄어드는지 확인";
  if(primary.includes("추출량 +")) return "답답함이 풀리고 피니시가 길어지는지 확인";
  if(primary.includes("온도 -")) return "로스티함·쓴맛이 줄고 단맛이 더 또렷해지는지 확인";
  if(primary.includes("온도 +")) return "날카로운 신맛이 둥글어지고 단맛이 늘어나는지 확인";
  if(primary.includes("FINE")) return "추출시간이 늘면서 날카로운 신맛/빈 맛이 줄어드는지 확인";
  if(primary.includes("COARSE")) return "추출시간이 줄면서 쓴맛·떫음·답답함이 줄어드는지 확인";
  if(primary.includes("퍽")) return "샷 편차와 신맛+떫음 동시 발생이 줄어드는지 확인";
  return "같은 조건에서 맛이 재현되는지 확인";
}

function tasteChangeRows(last,tv){
  if(!last||!last.tastes)return [];
  return Object.keys(tasteNames).map(k=>{
    const prev=Number(last.tastes[k]??0),cur=Number(tv[k]??0),diff=cur-prev;
    return {k,name:tasteNames[k],prev,cur,diff};
  }).filter(x=>x.diff!==0);
}


function preinfusionAdvice({repeatCount,direction,move,mixed,timeChange,t,sourChange,overChange}){
  // Default is fixed 2s wet + 5s wait. Only suggest PI after repeated poor response.
  if(mixed){
    return {show:false};
  }
  if(repeatCount>=3 && direction==="fine" && Math.abs(sourChange)<=1){
    return {
      show:true,
      title:"프리인퓨전 테스트",
      text:"2초 적심은 유지하고 대기만 5초 → 6초로 테스트",
      note:"한 번에 1초만 늘리고, 다음 샷에서는 다른 변수는 그대로 유지"
    };
  }
  if(repeatCount>=3 && direction==="coarse" && Math.abs(overChange)<=1){
    return {
      show:true,
      title:"프리인퓨전 테스트",
      text:"2초 적심은 유지하고 대기 5초 → 4초로 테스트",
      note:"답답함·느린 흐름이 반복될 때만 1초 줄여 확인"
    };
  }
  if(timeChange>=4 && t>34 && direction==="fine"){
    return {
      show:true,
      title:"프리인퓨전은 그대로",
      text:"현재 2초 + 5초 유지",
      note:"이미 총 추출시간이 많이 늘었으므로 프리인퓨전보다 분쇄도/유량을 먼저 확인"
    };
  }
  return {show:false};
}

$("#analyze").onclick=()=>{
  const doseEl=$("#dose"), yieldEl=$("#yield"), timeEl=$("#time"), tempEl=$("#temp");
  const d=+doseEl.value,y=+yieldEl.value,t=+timeEl.value,tmp=+tempEl.value;
  if(!d||!y||!t||!tmp)return alert("현재 샷 정보를 확인해줘.");

  const r=y/d,c=rc[roast],tv=currentTasteVector();
  const {sour:S,bitter:B,dry:D,thin:T,heavy:H,hollow:O,sweet:W}=tv;

  const u=S+T*.8+O*.7+(t<24?3:0)+(r<c[2]?2:0);
  const o=B+D*1.15+H*.5+(t>31?3:0)+(r>c[3]?2:0);
  const delta=u-o;
  const mixed=S>=6 && (B>=6 || D>=6);

  const last=loadLastAnalysis();
  const curKnob=kp();
  const audit=comparisonAudit(last,{d,y,t,tmp,curKnob});
  const repeatGuard=repeatabilityGuard(last,{d,y,t,tmp,curKnob});

  let b="미세조정",h="한 변수만 미세 조정";
  let why="한쪽 결점이 뚜렷하지 않아 아주 작은 조정이 좋습니다.";
  let targetText=curKnob;
  let steps=["현재 세팅을 크게 바꾸지 않기","한 변수만 아주 작게 조정"];

  // Detect whether the previous target was actually applied.
  const appliedLast = !!(last && last.target===curKnob);
  const sameDirectionUnder = appliedLast && last.direction==="fine";
  const sameDirectionOver = appliedLast && last.direction==="coarse";

  // Improvement / persistence compared with the last analyzed shot.
  const sourChange = last ? S-(last.tastes?.sour ?? S) : 0;
  const hollowChange = last ? O-(last.tastes?.hollow ?? O) : 0;
  const thinChange = last ? T-(last.tastes?.thin ?? T) : 0;
  const overNow = Math.max(B,D);
  const overPrev = last ? Math.max(last.tastes?.bitter??B,last.tastes?.dry??D) : overNow;
  const overChange = overNow-overPrev;
  const timeChange = last ? t-(last.time??t) : 0;
  const ratioChange = last ? r-(last.ratio??r) : 0;
  const tasteRows = tasteChangeRows(last,tv);

  let direction="hold", move=0;
  let primaryChange="노브 유지";

  // Guardrail: if a finer move already made flow much slower while the cup became more hollow,
  // do not keep tightening the grinder. A low ratio with a long/normal shot is better corrected
  // by beverage yield or puck consistency first.
  const lowRatio = r < c[2];
  const highRatio = r > c[3];
  const fineBackfired = sameDirectionUnder && timeChange>=4 && hollowChange>=2;
  const longLowRatio = lowRatio && t>=29 && (O>=5 || T>=5);

  // Variable-first diagnosis. Body/intensity problems should normally be corrected
  // with beverage yield before changing grind size.
  const thinIsolated = T>=3 && S<=3 && B<=3 && D<=3 && H<=2 && O<=3;
  const heavyIsolated = H>=3 && S<=3 && B<=3 && D<=3 && T<=2 && O<=3;
  const roastBitter = B>=4 && D<=3 && S<=3 && t>=24 && t<=31;
  const sharpSourNormalFlow = S>=4 && B<=3 && D<=3 && t>=26 && t<=32 && !lowRatio;

  // Taste-combination rules: choose the variable that best matches the pattern.
  const sourThin = S>=4 && T>=4 && B<=3 && D<=3;
  const thinHollow = T>=4 && O>=4 && S<=3 && B<=3 && D<=3;
  const bitterHeavy = B>=4 && H>=4 && S<=3 && D<=3;
  const dryLong = D>=4 && t>31 && S<=4;
  const unevenCombo = (S>=5 && D>=4) || (S>=5 && B>=5);

  if(repeatGuard){
    direction="hold";move=0;targetText=curKnob;
    b="재현성 문제";
    h="분쇄도 조정 중지";
    primaryChange="퍽/유량 재확인";
    why=repeatGuard.note;
    steps=[
      "노브·도징·추출량·온도 유지",
      "그라인더 퍼지/잔류분 확인",
      "WDT·분배·수평 탬핑을 동일하게 재현",
      "같은 조건으로 한 샷 더 뽑아 시간 편차 확인"
    ];
  }else if(unevenCombo){
    direction="hold";move=0;
    b="불균일 추출 의심";
    h="분쇄도보다 퍽 준비 먼저";
    primaryChange="퍽/유량 확인";
    targetText=curKnob;
    why="날카로운 신맛과 떫음/쓴맛이 함께 나타납니다. 서로 반대처럼 보이는 결점이 동시에 강하면 분쇄도 한 방향보다 채널링·분배 편차를 먼저 의심하는 편이 안전합니다.";
    steps=[
      "노브 "+curKnob+" 유지",
      "WDT·분배·수평 탬핑 확인",
      "바텀리스 흐름 또는 유량 편차 확인",
      "다음 샷에서 신맛과 떫음이 함께 줄었는지 비교"
    ];
  }else if(sourThin){
    targetText=curKnob;
    if(t<26){
      direction="fine";
      move=(S>=8&&t<23)?0.2:0.1;
      const n=shiftedSteps(-1,Math.max(1,Math.round(move*10)));
      targetText=kp(n.t,n.m,n.s);
      b="추출 부족";
      h="FINE으로 "+move.toFixed(1)+" 이동";
      primaryChange="FINE "+move.toFixed(1);
      why="신맛과 묽음이 함께 있고 추출시간도 빠릅니다. 이 조합은 먼저 분쇄도를 곱게 해 접촉시간을 늘리는 쪽이 맞습니다.";
      steps=["FINE 방향으로 "+move.toFixed(1)+" → "+targetText,"도징·추출량·온도 유지","다음 샷에서 시간 증가와 신맛/묽음 감소 확인"];
    }else if(lowRatio){
      direction="hold";move=0;
      const ty=Math.max(y+2,d*c[2]);
      b="수율 보정";
      h="추출량 먼저 늘리기";
      primaryChange="추출량 +"+(ty-y).toFixed(1)+"g";
      why="신맛과 묽음이 있지만 추출시간은 충분하고 비율이 짧습니다. 더 곱게 하기보다 추출량을 늘려 수율을 확보하는 편이 우선입니다.";
      steps=["노브 "+curKnob+" 유지","추출량 "+y.toFixed(1)+"g → "+ty.toFixed(1)+"g","도징·온도 유지","신맛과 묽음이 함께 줄었는지 확인"];
    }else if(tmp<rc[roast][1]){
      direction="hold";move=0;
      b="온도 보정";
      h="온도 +1°C 먼저";
      primaryChange="온도 +1°C";
      why="신맛과 묽음이 있지만 시간과 비율은 크게 벗어나지 않았습니다. 이때는 분쇄도를 더 조이기 전에 온도를 1°C 올려 추출을 밀어보는 편이 깔끔합니다.";
      steps=["노브 "+curKnob+" 유지","온도 "+tmp+"°C → "+(tmp+1)+"°C","도징·추출량 유지","신맛과 단맛 변화를 확인"];
    }else{
      direction="hold";move=0;
      b="재현성 확인";h="퍽/유량 확인";primaryChange="퍽/유량 확인";
      why="신맛과 묽음이 있지만 시간·비율·온도가 이미 충분합니다. 이 경우 분쇄도보다 채널링이나 샷 편차를 먼저 확인합니다.";
      steps=["노브 유지","WDT·분배·수평 탬핑 확인","같은 조건으로 한 샷 재현"];
    }
  }else if(thinHollow){
    direction="hold";move=0;targetText=curKnob;
    if(highRatio){
      const ty=Math.max(d*c[2],y-2);
      b="바디 보정";h="추출량 줄이기";primaryChange="추출량 -"+(y-ty).toFixed(1)+"g";
      why="묽음과 빈 피니시가 함께 있고 비율도 긴 편입니다. 농도를 회복하기 위해 추출량을 먼저 줄이는 편이 자연스럽습니다.";
      steps=["노브 유지","추출량 "+y.toFixed(1)+"g → "+ty.toFixed(1)+"g","도징·온도 유지","바디와 피니시 변화를 확인"];
    }else{
      b="유량 재확인";h="노브보다 퍽/유량 먼저";primaryChange="퍽/유량 확인";
      why="묽음과 빈 맛이 함께 있지만 비율이 과하게 길지 않습니다. 이 경우 단순 농도보다 불균일 흐름 가능성을 먼저 확인합니다.";
      steps=["노브·추출량 유지","WDT·분배·수평 탬핑 확인","다음 샷의 흐름과 피니시 비교"];
    }
  }else if(bitterHeavy){
    targetText=curKnob;
    if(t>31){
      direction="coarse";move=0.1;
      const n=shiftedSteps(1,1);targetText=kp(n.t,n.m,n.s);
      b="과저항 경향";h="COARSE 0.1";primaryChange="COARSE 0.1";
      why="쓴맛과 무거움이 함께 있고 시간도 깁니다. 이때는 분쇄도를 한 칸 굵게 해 저항을 줄이는 쪽이 우선입니다.";
      steps=["COARSE 0.1 → "+targetText,"도징·추출량·온도 유지","쓴맛·답답함 감소 확인"];
    }else if(!highRatio){
      direction="hold";move=0;
      const add=H>=7?2:1;
      const ty=Math.min(d*c[3],y+add);
      b="바디 보정";h="추출량 조금 늘리기";primaryChange="추출량 +"+Math.max(0,ty-y).toFixed(1)+"g";
      why="쓴맛과 무거움이 있지만 시간이 과하게 길지 않습니다. 농도를 조금 풀어 컵의 답답함을 줄이는 쪽을 먼저 테스트합니다.";
      steps=["노브 유지","추출량 "+y.toFixed(1)+"g → "+ty.toFixed(1)+"g","온도 유지","쓴맛·답답함 변화 확인"];
    }else{
      direction="hold";move=0;b="온도 보정";h="온도 -1°C";primaryChange="온도 -1°C";
      why="쓴맛과 무거움이 있고 비율도 충분히 깁니다. 추출량을 더 늘리기보다 온도를 1°C 낮춰 거친 맛을 줄이는 편이 좋습니다.";
      steps=["노브 유지","온도 "+tmp+"°C → "+Math.max(80,tmp-1)+"°C","도징·추출량 유지","쓴맛·단맛 변화 확인"];
    }
  }else if(dryLong){
    direction="coarse";move=0.1;
    const n=shiftedSteps(1,1);targetText=kp(n.t,n.m,n.s);
    b="과저항 경향";h="COARSE 0.1";primaryChange="COARSE 0.1";
    why="떫음이 분명하고 추출시간도 깁니다. 이 조합은 분쇄도를 한 칸 굵게 해 접촉시간과 저항을 줄이는 쪽이 우선입니다.";
    steps=["COARSE 0.1 → "+targetText,"다른 변수 유지","다음 샷에서 떫음과 시간 감소 확인"];
  }else if(thinIsolated && !lowRatio){
    direction="hold";
    move=0;
    const cut=T>=7?3:T>=5?2:1;
    const targetYield=Math.max(d*c[2],y-cut);
    b="바디 보정";
    h="분쇄도보다 추출량 줄이기";
    if(Math.abs(y-targetYield)<0.5){
      primaryChange="노브/퍽 재확인";
      h="추출량은 이미 충분히 짧음";
      why="묽음이 있지만 현재 비율이 이미 권장 하단에 가깝습니다. 더 짧게 뽑기보다 채널링과 분쇄 균일성을 먼저 확인하는 편이 좋습니다.";
    }else{
      primaryChange="추출량 -"+(y-targetYield).toFixed(1)+"g";
    }
    targetText=curKnob;
    why="묽음이 주된 문제이고 신맛·쓴맛·떫음은 낮습니다. 이런 경우에는 분쇄도보다 브루 레이시오를 짧게 해 농도와 바디를 올리는 편이 자연스럽습니다.";
    steps=[
      "노브는 "+curKnob+" 그대로 유지",
      Math.abs(y-targetYield)>=0.5 ? "추출량을 "+y.toFixed(1)+"g → "+targetYield.toFixed(1)+"g로 줄이기" : "추출량은 그대로 유지",
      "도징 "+d.toFixed(1)+"g · 온도 "+tmp+"°C 유지",
      "다음 샷에서 묽음과 단맛을 다시 비교"
    ];
  }else if(thinIsolated && lowRatio){
    direction="hold";
    move=0;
    b="분쇄도 보류";
    h="추출량은 더 줄이지 마세요";
    primaryChange="퍽/유량 확인";
    targetText=curKnob;
    why="묽음이 느껴지지만 현재 비율이 이미 짧습니다. 여기서 추출량을 더 줄이면 수율이 더 떨어질 수 있어, 채널링이나 유량 편차를 먼저 확인하는 편이 좋습니다.";
    steps=[
      "노브와 추출량은 그대로 유지",
      "WDT·분배·수평 탬핑 확인",
      "다음 샷의 실제 추출시간과 흐름을 비교"
    ];
  }else if(heavyIsolated && !highRatio){
    direction="hold";
    move=0;
    const add=H>=7?3:H>=5?2:1;
    const targetYield=Math.min(d*c[3],y+add);
    b="바디 보정";
    h="추출량 조금 늘리기";
    const actualAdd=Math.max(0,targetYield-y);
    if(actualAdd<0.5){
      primaryChange="온도/퍽 재확인";
      h="추출량은 이미 충분히 김";
      why="답답함이 있지만 현재 비율이 이미 권장 상단에 가깝습니다. 더 길게 뽑기보다 온도나 퍽 흐름을 먼저 확인하는 편이 좋습니다.";
    }else{
      primaryChange="추출량 +"+actualAdd.toFixed(1)+"g";
    }
    targetText=curKnob;
    why="무거움/답답함이 주된 문제이고 다른 결점은 낮습니다. 분쇄도를 건드리기보다 추출량을 조금 늘려 농도를 풀어주는 편이 우선입니다.";
    steps=[
      "노브는 "+curKnob+" 그대로 유지",
      Math.abs(y-targetYield)>=0.5 ? "추출량을 "+y.toFixed(1)+"g → "+targetYield.toFixed(1)+"g로 늘리기" : "추출량은 그대로 유지",
      "도징과 온도는 그대로 유지",
      "다음 샷에서 답답함과 피니시를 비교"
    ];
  }else if(roastBitter){
    direction="hold";
    move=0;
    b="온도 보정";
    h="분쇄도보다 온도 먼저";
    primaryChange="온도 -1°C";
    targetText=curKnob;
    why="쓴맛/로스티함은 있지만 추출시간은 정상 범위이고 떫음은 낮습니다. 이 경우에는 먼저 온도를 1°C 낮춰 맛의 거친 부분을 줄여보는 편이 좋습니다.";
    steps=[
      "노브는 "+curKnob+" 그대로 유지",
      "온도를 "+tmp+"°C → "+Math.max(80,tmp-1)+"°C로 낮추기",
      "도징·추출량은 그대로 유지",
      "다음 샷에서 쓴맛과 단맛을 비교"
    ];
  }else if(sharpSourNormalFlow && tmp<rc[roast][1]){
    direction="hold";
    move=0;
    b="온도 보정";
    h="분쇄도보다 온도 먼저";
    primaryChange="온도 +1°C";
    targetText=curKnob;
    why="신맛이 도드라지지만 추출시간과 비율은 크게 벗어나지 않았습니다. 이 경우에는 분쇄도를 더 곱게 하기 전에 온도를 1°C 올려 추출을 밀어보는 선택지가 더 깔끔합니다.";
    steps=[
      "노브는 "+curKnob+" 그대로 유지",
      "온도를 "+tmp+"°C → "+(tmp+1)+"°C로 올리기",
      "도징·추출량은 그대로 유지",
      "다음 샷에서 날카로운 신맛과 단맛을 비교"
    ];
  }else if(fineBackfired){
    direction="hold";
    move=0;
    b="FINE 추가 중지";
    h="노브를 더 조이지 마세요";
    primaryChange="추출량 늘리기";
    const targetYield=Math.max(y+2, d*c[2]);
    targetText=curKnob;
    why="이전 FINE 조정 후 추출시간이 "+signed(timeChange)+"초 늘었는데 빈 맛이 "+signed(hollowChange)+"점 악화됐습니다. 더 곱게 가면 저항만 커지고 불균일 추출이 심해질 가능성이 있습니다.";
    steps=[
      "노브는 "+curKnob+"에서 유지",
      "추출량을 "+y.toFixed(1)+"g → "+targetYield.toFixed(1)+"g로 늘려 테스트",
      "WDT·분배·수평 탬핑은 그대로 정확히 유지",
      "다음 샷에서 빈 맛과 신맛이 줄었는지 확인"
    ];
  }else if(longLowRatio){
    direction="hold";
    move=0;
    b="비율 우선 보정";
    h="분쇄도보다 추출량 먼저";
    primaryChange="추출량 늘리기";
    const targetYield=Math.max(y+2, d*c[2]);
    targetText=curKnob;
    why="현재 추출시간은 이미 충분한데 비율이 짧고 빈 맛/묽음이 큽니다. 이 경우 더 곱게 가기보다 추출량을 늘려 수율을 확보하는 편이 합리적입니다.";
    steps=[
      "노브는 "+curKnob+"에서 유지",
      "추출량을 "+y.toFixed(1)+"g → "+targetYield.toFixed(1)+"g로 변경",
      "온도와 도징은 그대로 유지",
      "다음 샷에서 신맛·빈 맛·단맛 변화를 비교"
    ];
  }else if(W>=7 && Math.max(S,B,D,T,H,O)<=3){
    b="균형 좋음";h="지금 세팅 그대로";why="단맛과 균형이 좋고 결점 신호가 낮습니다.";
    targetText=curKnob;primaryChange="변경 없음";
    steps=["아무것도 바꾸지 않기","오늘 기준 샷으로 저장"];
  }else if(mixed){
    b="불균일 추출 의심";h="노브보다 퍽 준비 먼저";primaryChange="퍽 준비만 확인";
    why="신맛과 쓴맛/떫음이 모두 강해서 채널링이나 불균일 추출 가능성이 큽니다.";
    steps=["WDT·분배·수평 탬핑 확인","노브는 일단 유지하고 다음 샷에서 방향을 다시 판단"];
  }else if(delta>2){
    direction="fine";

    // First severe under-extracted shot.
    move = (S>=8 && B<=3 && D<=4) ? 0.2 : 0.1;
    if(S>=8 && (T>=5 || O>=5 || t<23)) move=0.3;

    // Adaptive follow-up if prior recommendation was applied.
    if(sameDirectionUnder){
      if(sourChange<=-2){
        move=0.1;
        why="이전 FINE 조정 후 신맛이 분명히 줄었습니다. 같은 방향으로 폭을 줄여 접근합니다.";
      }else if(Math.abs(sourChange)<=1){
        if((last.repeatCount||1)>=2){
          move=0;
          b="그라인더만으로 해결 안 됨";
          h="노브 유지하고 다른 변수 확인";
          primaryChange = Math.abs(timeChange)<2 ? "추출시간/유량 확인" : "추출량 +2g 테스트";
          why="같은 방향으로 두 번 이상 조정했는데 신맛이 거의 줄지 않았습니다.";
          steps=[
            "노브는 "+curKnob+"에서 유지",
            "추출시간·퍽 흐름·채널링 먼저 확인",
            "필요하면 추출량 +2g 또는 온도 +1°C 중 하나만 테스트"
          ];
        }else{
          move=0.2;
          why="이전 FINE 조정 뒤에도 신맛 강도가 거의 그대로라 같은 방향으로 한 번 더 진행합니다.";
        }
      }else if(sourChange>=2){
        move=0;
        b="방향 재확인";
        h="FINE 추가 이동 중지";
        primaryChange="노브 유지";
        why="FINE 조정 후 오히려 신맛이 강해졌습니다. 채널링이나 샷 편차를 먼저 확인하는 편이 좋습니다.";
        steps=["노브 추가 이동 중지","WDT·분배·수평 탬핑과 실제 추출시간 확인"];
      }
    }

    if(move>0){
      const marks=Math.max(1,Math.round(move*10));
      const n=shiftedSteps(-1,marks);
      targetText=kp(n.t,n.m,n.s);
      b="저추출 쪽";
      h="FINE으로 "+move.toFixed(1)+" 이동";
      primaryChange="FINE "+move.toFixed(1);
      if(!sameDirectionUnder) why="신맛 중심의 저추출 신호가 우세합니다.";
      steps=[
        "FINE 방향으로 "+move.toFixed(1)+" → "+targetText,
        "다른 변수는 그대로 유지",
        "다음 샷에서 신맛 점수가 얼마나 줄었는지 비교"
      ];
    }
  }else if(delta<-2){
    direction="coarse";
    move = ((B>=8 || D>=8) && S<=3) ? 0.2 : 0.1;
    if((B>=8 || D>=8) && (H>=5 || t>33)) move=0.3;

    if(sameDirectionOver){
      if(overChange<=-2){
        move=0.1;
        why="이전 COARSE 조정 후 쓴맛/떫음이 분명히 줄었습니다. 같은 방향으로 폭을 줄여 접근합니다.";
      }else if(Math.abs(overChange)<=1){
        if((last.repeatCount||1)>=2){
          move=0;
          b="그라인더만으로 해결 안 됨";
          h="노브 유지하고 다른 변수 확인";
          primaryChange = Math.abs(timeChange)<2 ? "추출시간/유량 확인" : "추출량 -2g 테스트";
          why="같은 방향으로 두 번 이상 조정했는데 쓴맛/떫음이 거의 줄지 않았습니다.";
          steps=[
            "노브는 "+curKnob+"에서 유지",
            "추출시간과 실제 유량 확인",
            "필요하면 추출량 -2g 또는 온도 -1°C 중 하나만 테스트"
          ];
        }else{
          move=0.2;
          why="이전 COARSE 조정 뒤에도 쓴맛/떫음이 거의 그대로라 같은 방향으로 한 번 더 진행합니다.";
        }
      }else if(overChange>=2){
        move=0;
        b="방향 재확인";
        h="COARSE 추가 이동 중지";
        primaryChange="노브 유지";
        why="COARSE 조정 후 오히려 쓴맛/떫음이 강해졌습니다. 샷 편차나 다른 변수를 먼저 확인합니다.";
        steps=["노브 추가 이동 중지","추출시간·유량·채널링 확인"];
      }
    }

    if(move>0){
      const marks=Math.max(1,Math.round(move*10));
      const n=shiftedSteps(1,marks);
      targetText=kp(n.t,n.m,n.s);
      b="과다추출 쪽";
      h="COARSE로 "+move.toFixed(1)+" 이동";
      primaryChange="COARSE "+move.toFixed(1);
      if(!sameDirectionOver) why="쓴맛/떫음 중심의 과다추출 신호가 우세합니다.";
      steps=[
        "COARSE 방향으로 "+move.toFixed(1)+" → "+targetText,
        "다른 변수는 그대로 유지",
        "다음 샷에서 쓴맛/떫음 점수가 얼마나 줄었는지 비교"
      ];
    }
  }else if(delta>0){
    const underPeak=Math.max(S,T,O);
    if(underPeak>=4){
      direction="fine";move=0.01;
      b="미세조정";h="FINE 쪽으로 아주 미세하게";why="저추출 신호가 조금 더 우세하지만 큰 이동이 필요한 정도는 아닙니다.";primaryChange="FINE 미세";
      targetText=kp2(-0.01);
      steps=["현재 "+curKnob+"에서 FINE 쪽으로 표시 한 칸(0.1)의 약 1/10 정도만 미세 이동","나머지 변수는 그대로 두고 맛만 다시 확인"];
    }else{
      direction="hold";move=0;
      b="유지";h="노브 그대로";why="맛 결점이 약하고 점수 차이도 작아서 억지로 미세 조정할 필요가 없습니다.";primaryChange="변경 없음";
      targetText=curKnob;
      steps=["노브는 "+curKnob+" 그대로 유지","같은 조건으로 한 샷 더 확인"];
    }
  }else if(delta<0){
    const overPeak=Math.max(B,D,H);
    if(overPeak>=4){
      direction="coarse";move=0.01;
      b="미세조정";h="COARSE 쪽으로 아주 미세하게";why="과다추출 신호가 조금 더 우세하지만 큰 이동이 필요한 정도는 아닙니다.";primaryChange="COARSE 미세";
      targetText=kp2(0.01);
      steps=["현재 "+curKnob+"에서 COARSE 쪽으로 표시 한 칸(0.1)의 약 1/10 정도만 미세 이동","나머지 변수는 그대로 두고 맛만 다시 확인"];
    }else{
      direction="hold";move=0;
      b="유지";h="노브 그대로";why="맛 결점이 약하고 점수 차이도 작아서 억지로 미세 조정할 필요가 없습니다.";primaryChange="변경 없음";
      targetText=curKnob;
      steps=["노브는 "+curKnob+" 그대로 유지","같은 조건으로 한 샷 더 확인"];
    }
  }else{
    direction="hold";
    b="미세조정";h="노브 유지";why="저추출과 과다추출 신호가 거의 같습니다.";primaryChange="노브 유지";
    steps=["노브는 그대로 유지","추출량이나 온도 중 한 변수만 소폭 조정"];
  }

  // Stop hammering the same variable forever.
  let pv=primaryVariable(primaryChange);
  const priorApplied=previousChangeApplied(last,curKnob,y,tmp);
  let variableStreak=(last&&last.primaryVariable===pv&&priorApplied)?(last.variableStreak||1)+1:1;
  if(variableStreak>=3 && ["grind","yield","temp"].includes(pv)){
    const oldVar=pv;
    direction="hold";move=0;targetText=curKnob;
    b="변수 전환";
    h="같은 변수 3회 연속 조정 중지";
    primaryChange="퍽/유량 재확인";
    pv="puck";
    variableStreak=1;
    why="같은 변수를 연속으로 조정했는데 충분히 해결되지 않았습니다. 더 밀어붙이기보다 다른 원인을 확인하는 단계입니다.";
    steps=[
      "현재 노브·도징·추출량·온도 유지",
      oldVar==="grind" ? "분쇄도 추가 변경 중지" : oldVar==="yield" ? "추출량 추가 변경 중지" : "온도 추가 변경 중지",
      "WDT·분배·탬핑·유량 편차 확인",
      "한 샷 재현 후 다시 판단"
    ];
  }

  if(appliedLast && last){
    const keyTasteDelta = direction==="fine" ? sourChange : direction==="coarse" ? overChange : 0;
    if(Math.abs(timeChange)>=3 && Math.abs(keyTasteDelta)<=1 && move>0){
      why += " 추출시간은 "+signed(timeChange)+"초 변했지만 핵심 맛 점수 변화가 작아, 다음 샷에서는 노브 외 변수도 함께 점검해야 합니다.";
    }else if(Math.abs(timeChange)>=3 && ((direction==="fine"&&sourChange<=-2)||(direction==="coarse"&&overChange<=-2))){
      why += " 추출시간 변화와 맛 개선이 같은 방향으로 나타나 현재 조정은 효과가 있습니다.";
    }
  }

  const repeatCount = appliedLast && last.direction===direction ? (last.repeatCount||1)+1 : 1;
  const balanced = W>=7 && Math.max(S,B,D,T,H,O)<=3;
  let confidence = confidenceLabel(delta,mixed,tv);
  if(audit.level==="낮음")confidence="낮음";
  else if(audit.level==="중간"&&confidence==="높음")confidence="중간";
  if(repeatGuard)confidence="낮음";
  const stage = stageLabel(balanced,repeatCount,move,direction);
  const piRec = preinfusionAdvice({repeatCount,direction,move,mixed,timeChange,t,sourChange,overChange});

  $("#badge").textContent=b;
  $("#shotSummary").textContent=shotSummaryText(tv,t,r,c,mixed);
  $("#stage").textContent=stage;
  $("#confidence").textContent="신뢰도 · "+confidence;
  $("#headline").textContent=h;
  $("#cur").textContent=curKnob;
  $("#target").textContent=targetText;
  $("#reason").textContent=why;

  const cq=$("#comparisonQuality");
  if(last){
    cq.classList.remove("hidden");
    cq.innerHTML=`<b>비교 품질 · ${audit.level}</b><span>${audit.note}</span>`;
  }else{
    cq.classList.add("hidden");
    cq.innerHTML="";
  }

  const dom=dominantTaste(tv);
  const diagnosis=$("#diagnosis");
  diagnosis.classList.remove("hidden");
  diagnosis.innerHTML=`
    <div><small>가장 큰 신호</small><b>${dom.v>0?dom.n+" "+dom.v:"뚜렷한 결점 없음"}</b></div>
    <div><small>우선 조정 변수</small><b>${primaryChange}</b></div>
    <div class="diag-outcome"><small>다음 샷에서 볼 것</small><span>${expectedOutcome(primaryChange,tv)}</span></div>`;

  const pi=$("#piAdvice");
  if(piRec.show){
    pi.classList.remove("hidden");
    pi.innerHTML=`<div class="pi-title">${piRec.title}</div><strong>${piRec.text}</strong><span>${piRec.note}</span>`;
  }else{
    pi.classList.add("hidden");
    pi.innerHTML="";
  }

  const one=$("#oneChange");
  one.classList.remove("hidden");
  const keepItems=[];
  if(!primaryChange.includes("도징"))keepItems.push("도징 "+d.toFixed(1)+"g");
  if(!primaryChange.includes("추출량"))keepItems.push("추출량 "+y.toFixed(1)+"g");
  if(!primaryChange.includes("온도"))keepItems.push("온도 "+tmp+"°C");
  if(!primaryChange.includes("FINE")&&!primaryChange.includes("COARSE")&&!primaryChange.includes("노브"))keepItems.push("노브 "+curKnob);
  one.innerHTML=`<small>이번 샷에서는 이것만 변경</small><strong>${primaryChange}</strong><span>바꾸지 말 것 · ${keepItems.join(" · ")} 유지</span>`;

  const changes=$("#changes");
  if(last){
    const rows=[];
    if(last.current!==curKnob) rows.push(`<div><span>노브</span><b>${last.current} → ${curKnob}</b></div>`);
    rows.push(`<div><span>추출시간</span><b>${last.time}s → ${t}s <em>(${signed(timeChange)}s)</em></b></div>`);
    rows.push(`<div><span>추출비율</span><b>1:${(last.ratio||0).toFixed(2)} → 1:${r.toFixed(2)} <em>(${signed(ratioChange,2)})</em></b></div>`);
    tasteRows.forEach(x=>rows.push(`<div><span>${x.name}</span><b>${x.prev} → ${x.cur} <em>(${signed(x.diff)})</em></b></div>`));
    changes.classList.remove("hidden");
    changes.innerHTML=`<div class="changes-title">이전 샷과 비교</div>${rows.join("")}`;
  }else{
    changes.classList.add("hidden");
    changes.innerHTML="";
  }

  const baseline=loadBaseline();
  const bc=$("#baselineCompare");
  if(baseline){
    const bd=baseline.tastes||{};
    const diffs=[];
    ["sour","bitter","dry","thin","heavy","hollow","sweet"].forEach(k=>{
      if(bd[k]!==undefined && tv[k]!==bd[k]) diffs.push(tasteNames[k]+" "+bd[k]+"→"+tv[k]);
    });
    bc.classList.remove("hidden");
    bc.innerHTML=`<div class="baseline-title">기준 샷과 비교</div><div class="baseline-main"><b>${baseline.knob||kp(baseline.kt,baseline.km,baseline.ks)} → ${curKnob}</b><span>${diffs.slice(0,4).join(" · ")||"맛 점수 동일"}</span></div>`;
  }else{
    bc.classList.add("hidden");
    bc.innerHTML="";
  }

  $("#plan").innerHTML=steps.map((x,i)=>`<div><b>${i+1}.</b> ${x}</div>`).join("");
  $("#result").classList.remove("hidden");
  $("#result").scrollIntoView({behavior:"smooth"});

  saveLastAnalysis({
    current:curKnob,target:targetText,direction,move,repeatCount,tastes:tv,
    dose:d,yield:y,time:t,temp:tmp,ratio:r,primaryVariable:pv,variableStreak,
    recommendedPrimary:primaryChange,comparisonQuality:audit.level
  });
};
$("#saveShot").onclick=()=>{let H=JSON.parse(localStorage.getItem("shots")||"[]");H.unshift(shotSnapshot());localStorage.setItem("shots",JSON.stringify(H.slice(0,6)));showHist()};
$("#setBaseline").onclick=()=>{
  const snap=shotSnapshot();
  saveBaseline(snap);
  showBaseline();
  alert("이 샷을 기준 샷으로 저장했어.");
};
function showBaseline(){
  const b=loadBaseline(),box=$("#baselineBox");
  if(!b){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");
  box.innerHTML=baselineSummaryHtml(b);
}
function showHist(){
  const H=JSON.parse(localStorage.getItem("shots")||"[]");
  const baseline=loadBaseline();
  $("#history").innerHTML=H.map((x,i)=>{
    const knob=x.knob||(x.kt!==undefined?kp(x.kt,x.km,x.ks):String(x.k??"-"));
    const tv=x.tastes||{};
    const isBase=baseline && (baseline.ts&&x.ts===baseline.ts);
    const tasteLine=x.tastes?`<div class="hist-tastes">🍋 ${tv.sour} · ☕ ${tv.bitter} · 🌿 ${tv.dry} · 🍯 ${tv.sweet}</div>`:"";
    return `<div class="hist-card"><div class="hist-head"><span>#${H.length-i}</span><b>${knob}</b>${isBase?'<em>기준</em>':''}</div><div class="hist-shot">${Number(x.d).toFixed(1)}→${Number(x.y).toFixed(1)}g · ${x.t}s · ${x.tmp}°C</div>${tasteLine}</div>`;
  }).join("");
}
$("#reset").onclick=()=>{try{localStorage.removeItem("lastAnalysis")}catch(e){};turn=0;major=9;sub=0;rot=-324;$("#dose").value="22.0";$("#yield").value="35.0";$("#time").value="27";$("#temp").value="92";tastes.forEach(([id])=>$("#"+id).value=0);$("#result").classList.add("hidden");$("#oneChange").classList.add("hidden");$("#changes").classList.add("hidden");$("#baselineCompare").classList.add("hidden");$("#piAdvice").classList.add("hidden");$("#diagnosis").classList.add("hidden");$("#comparisonQuality").classList.add("hidden");refresh();render()};
build();refresh();render();showHist();showBaseline();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});