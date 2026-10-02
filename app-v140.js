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


function currentTasteVector(){
  return {
    sour:+$("#sour").value,bitter:+$("#bitter").value,dry:+$("#dry").value,
    thin:+$("#thin").value,heavy:+$("#heavy").value,hollow:+$("#hollow").value,sweet:+$("#sweet").value
  };
}
function loadLastAnalysis(){
  try{return JSON.parse(sessionStorage.getItem("lastAnalysis")||"null")}catch(e){return null}
}
function saveLastAnalysis(data){
  try{sessionStorage.setItem("lastAnalysis",JSON.stringify(data))}catch(e){}
}


const tasteNames={
  sour:"신맛",bitter:"쓴맛",dry:"떫음",thin:"묽음",heavy:"무거움",hollow:"빈 맛",sweet:"단맛"
};
function signed(n,digits=0){
  const v=Number(n)||0;
  return (v>0?"+":"")+v.toFixed(digits);
}
function tasteChangeRows(last,tv){
  if(!last||!last.tastes)return [];
  return Object.keys(tasteNames).map(k=>{
    const prev=Number(last.tastes[k]??0),cur=Number(tv[k]??0),diff=cur-prev;
    return {k,name:tasteNames[k],prev,cur,diff};
  }).filter(x=>x.diff!==0);
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
  const overNow = Math.max(B,D);
  const overPrev = last ? Math.max(last.tastes?.bitter??B,last.tastes?.dry??D) : overNow;
  const overChange = overNow-overPrev;
  const timeChange = last ? t-(last.time??t) : 0;
  const ratioChange = last ? r-(last.ratio??r) : 0;
  const tasteRows = tasteChangeRows(last,tv);

  let direction="hold", move=0;
  let primaryChange="노브 유지";

  if(W>=7 && Math.max(S,B,D,T,H,O)<=3){
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
    direction="fine";move=0.01;
    b="미세조정";h="FINE으로 0.01 미세 조정";why="저추출 신호가 아주 조금 더 우세합니다.";primaryChange="FINE 0.01";
    targetText=kp2(-0.01);
    steps=["FINE 방향으로 0.01 → "+targetText,"나머지 변수는 그대로 두고 맛만 다시 확인"];
  }else if(delta<0){
    direction="coarse";move=0.01;
    b="미세조정";h="COARSE로 0.01 미세 조정";why="과다추출 신호가 아주 조금 더 우세합니다.";primaryChange="COARSE 0.01";
    targetText=kp2(0.01);
    steps=["COARSE 방향으로 0.01 → "+targetText,"나머지 변수는 그대로 두고 맛만 다시 확인"];
  }else{
    direction="hold";
    b="미세조정";h="노브 유지";why="저추출과 과다추출 신호가 거의 같습니다.";primaryChange="노브 유지";
    steps=["노브는 그대로 유지","추출량이나 온도 중 한 변수만 소폭 조정"];
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

  $("#badge").textContent=b;
  $("#headline").textContent=h;
  $("#cur").textContent=curKnob;
  $("#target").textContent=targetText;
  $("#reason").textContent=why;

  const one=$("#oneChange");
  one.classList.remove("hidden");
  one.innerHTML=`<small>이번 샷에서는 이것만 변경</small><strong>${primaryChange}</strong><span>도징 · 추출량 · 온도는 별도 지시가 없으면 그대로 유지</span>`;

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

  $("#plan").innerHTML=steps.map((x,i)=>`<div><b>${i+1}.</b> ${x}</div>`).join("");
  $("#result").classList.remove("hidden");
  $("#result").scrollIntoView({behavior:"smooth"});

  saveLastAnalysis({
    current:curKnob,target:targetText,direction,move,repeatCount,tastes:tv,
    dose:d,yield:y,time:t,temp:tmp,ratio:r
  });
};
$("#saveShot").onclick=()=>{let H=JSON.parse(localStorage.getItem("shots")||"[]");H.unshift({kt:turn,km:major,ks:sub,d:+$("#dose").value,y:+$("#yield").value,t:+$("#time").value,tmp:+$("#temp").value});localStorage.setItem("shots",JSON.stringify(H.slice(0,6)));showHist()};
function showHist(){let H=JSON.parse(localStorage.getItem("shots")||"[]");$("#history").innerHTML=H.map(x=>`<div class="hist"><b>${x.kt!==undefined?kp(x.kt,x.km,x.ks):String(x.k??"-")}</b> · ${x.d}→${x.y}g · ${x.t}s · ${x.tmp}°C</div>`).join("")}
$("#reset").onclick=()=>{try{sessionStorage.removeItem("lastAnalysis")}catch(e){};turn=0;major=9;sub=0;rot=-324;$("#dose").value="22.0";$("#yield").value="35.0";$("#time").value="27";$("#temp").value="92";tastes.forEach(([id])=>$("#"+id).value=0);$("#result").classList.add("hidden");$("#oneChange").classList.add("hidden");$("#changes").classList.add("hidden");refresh();render()};
build();refresh();render();showHist();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});