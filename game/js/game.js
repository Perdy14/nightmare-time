// ================================================================
// NIGHTMARE TIME v4 - Realistic FNAF-style
// Vista primera persona realista, iluminación, animatrónicos
// detallados, cursor visible, audio procedural
// ================================================================
const C = document.getElementById('c');
const X = C.getContext('2d');
const W = 1280, H = 720;
C.width = W; C.height = H;

// ========== ESTADO ==========
let state = 'menu'; // menu, game, cameras, gameover, win
let night = 1, maxNight = +(localStorage.getItem('nt_night')||1);
let hour = 0, hourT = 0, HOUR_S = 50;
let power = 100, gameT = 0;
let lookX = 0; // -400 a 400 (offset de la oficina)
let mx = W/2, my = H/2; // posición del mouse
let doorL = false, doorR = false;
let lightL = false, lightR = false;
let camOpen = false, camSel = 0, camStatic = 0;
let flickerT = 0, ambientPulse = 0;
let gameOverT = 0, winT = 0;
let killer = null;

// ========== ANIMATRÓNICOS ==========
let bots = [];
const CAM_NAMES = ['Escenario','Comedor','Backstage','Pasillo Oeste','Pasillo Este','Rincón Oeste','Rincón Este'];
const ROUTES = {
  finn:  [0,1,3,5,'L'], jake: [0,1,4,6,'R'],
  chicle:[0,2,3,5,'L'], rey:  [0,1,4,6,'R']
};
const DIFF = [
  null,
  {finn:3,jake:0,chicle:0,rey:0},
  {finn:5,jake:3,chicle:0,rey:0},
  {finn:7,jake:5,chicle:3,rey:2},
  {finn:10,jake:7,chicle:5,rey:4},
  {finn:14,jake:11,chicle:9,rey:7},
  {finn:18,jake:15,chicle:12,rey:11}
];

function mkBot(id,name,ag,route){
  const side = route[route.length-1];
  return {id,name,ag,route,pos:0,side,atDoor:false,
    mt:0, mi:Math.max(3,20-ag*1.1),
    at:0, ad:Math.max(4,14-ag*0.8), active:ag>0};
}
function initBots(){
  const d=DIFF[night]||DIFF[5];
  bots=[
    mkBot('finn','Finn Corrupto',d.finn,ROUTES.finn),
    mkBot('jake','Jake Retorcido',d.jake,ROUTES.jake),
    mkBot('chicle','Princesa Chicle',d.chicle,ROUTES.chicle),
    mkBot('rey','Rey Hielo',d.rey,ROUTES.rey)
  ];
}
function startGame(n){
  night=n; state='game'; hour=0; hourT=0; power=100; gameT=0;
  lookX=0; doorL=false; doorR=false; lightL=false; lightR=false;
  camOpen=false; camSel=0; camStatic=0.5; killer=null;
  initBots();
}

// ========== INPUT ==========
C.addEventListener('mousemove',e=>{
  const r=C.getBoundingClientRect();
  mx=(e.clientX-r.left)/r.width*W;
  my=(e.clientY-r.top)/r.height*H;
});
let clicked=false, clickHandled=false;
C.addEventListener('mousedown',()=>{clicked=true;clickHandled=false;});
C.addEventListener('mouseup',()=>{clicked=false; lightL=false; lightR=false;});

function btn(x,y,w,h){return mx>x&&mx<x+w&&my>y&&my<y+h;}

// ========== AUDIO ==========
let audioCtx=null, masterGain=null;
function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  masterGain=audioCtx.createGain(); masterGain.gain.value=0.4;
  masterGain.connect(audioCtx.destination);
}
function playTone(f,dur,type='sine',vol=0.2){
  if(!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(vol,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
  o.connect(g); g.connect(masterGain); o.start(); o.stop(audioCtx.currentTime+dur);
}
function playDoor(){playTone(80,0.3,'square',0.3);playTone(60,0.2,'triangle',0.2);}
function playStatic(){for(let i=0;i<3;i++)setTimeout(()=>playTone(200+Math.random()*2000,0.05,'sawtooth',0.05),i*30);}
function playScare(){playTone(100,0.5,'sawtooth',0.5);playTone(200,0.4,'square',0.4);}

// ========== UPDATE ==========
function update(dt){
  gameT+=dt; flickerT+=dt; ambientPulse=Math.sin(gameT*0.5)*0.02;
  if(state==='menu'||state==='gameover'||state==='win'){
    if(clicked&&!clickHandled){clickHandled=true; handleMenuClick();}
    return;
  }
  if(state!=='game'&&state!=='cameras')return;

  // Hora
  hourT+=dt;
  if(hourT>=HOUR_S){hourT=0;hour++;if(hour>=6){state='win';winT=0;
    if(night>=maxNight){maxNight=Math.min(6,night+1);localStorage.setItem('nt_night',maxNight);}return;}}

  // Energía
  let drain=0.07;
  if(camOpen)drain+=0.09;
  if(doorL)drain+=0.06;
  if(doorR)drain+=0.06;
  if(lightL)drain+=0.05;
  if(lightR)drain+=0.05;
  power-=drain*dt;
  if(power<=0){power=0;doorL=false;doorR=false;lightL=false;lightR=false;camOpen=false;}

  // Mirar (solo fuera de cámaras)
  if(!camOpen){
    const target=(mx/W-0.5)*800;
    lookX+=(target-lookX)*dt*4;
    lookX=Math.max(-350,Math.min(350,lookX));
  }

  // Cámara static
  if(camStatic>0)camStatic-=dt;

  // Clicks
  if(clicked&&!clickHandled){clickHandled=true; handleGameClick();}

  // Bots
  bots.forEach(b=>updateBot(b,dt));

  // Power out attack
  if(power<=0){
    const a=bots.find(b=>b.active);
    if(a){a.at+=dt*2;if(a.at>4){killer=a;state='gameover';gameOverT=0;playScare();}}
  }
}

function updateBot(b,dt){
  if(!b.active)return;
  if(b.atDoor){
    const blocked=(b.side==='L'?doorL:doorR);
    if(blocked){b.at+=dt;if(b.at>b.ad*2){b.atDoor=false;b.pos=Math.max(0,b.pos-2);b.at=0;}}
    else{b.at+=dt;if(b.at>=b.ad){killer=b;state='gameover';gameOverT=0;playScare();}}
    return;
  }
  b.mt+=dt;
  if(b.mt>=b.mi){
    b.mt=0;
    if(Math.random()*20<b.ag){
      b.pos++;camStatic=0.3;playStatic();
      if(b.pos>=b.route.length-1){b.atDoor=true;b.at=0;}
    }
  }
}

function handleMenuClick(){
  if(state==='menu'){
    // Play button
    if(btn(W/2-120,380,240,55)){initAudio();startGame(Math.min(maxNight,6));return;}
    // Night buttons
    for(let i=0;i<6;i++){
      if(i+1<=maxNight&&btn(190+i*155,500,135,50)){initAudio();startGame(i+1);return;}
    }
  }
  if(state==='gameover'){if(gameT>1){startGame(night);return;}}
  if(state==='win'){if(night<6)startGame(Math.min(night+1,6));else state='menu';}
}

function handleGameClick(){
  if(power<=0)return;
  // Cámara toggle
  if(!camOpen&&btn(W/2-80,H-60,160,48)){camOpen=true;camStatic=0.4;playStatic();return;}
  if(camOpen&&btn(W/2-80,H-60,160,48)){camOpen=false;return;}
  if(camOpen){
    // Cam buttons
    for(let i=0;i<7;i++){
      const bx=840,by=80+i*65;
      if(btn(bx,by,180,50)){if(camSel!==i)camStatic=0.25;camSel=i;playStatic();return;}
    }
    return;
  }
  // Puertas
  if(btn(0,200,70,300)){doorL=!doorL;playDoor();return;}
  if(btn(W-70,200,70,300)){doorR=!doorR;playDoor();return;}
  // Luces (hold)
  if(btn(0,520,80,60)){lightL=true;return;}
  if(btn(W-80,520,80,60)){lightR=true;return;}
}

// ========== RENDER ==========
function render(){
  X.clearRect(0,0,W,H);
  switch(state){
    case 'menu': rMenu(); break;
    case 'game': rOffice(); rHUD(); break;
    case 'cameras': rOffice(); rHUD(); break;
    case 'gameover': rGameOver(); break;
    case 'win': rWin(); break;
  }
  if(state==='game'||state==='cameras'){
    if(camOpen) rCameras();
  }
  // Cursor siempre visible
  rCursor();
}

// ========== MENÚ ==========
function rMenu(){
  // Fondo con gradiente oscuro
  const g=X.createRadialGradient(W/2,H/2,100,W/2,H/2,600);
  g.addColorStop(0,'#1a0a2e');g.addColorStop(1,'#000');
  X.fillStyle=g; X.fillRect(0,0,W,H);
  // Partículas de polvo
  X.fillStyle='rgba(150,100,200,0.1)';
  for(let i=0;i<30;i++){
    const px=(Math.sin(gameT*0.3+i*7)*0.5+0.5)*W;
    const py=(Math.cos(gameT*0.2+i*5)*0.5+0.5)*H;
    X.beginPath();X.arc(px,py,1+Math.sin(gameT+i)*0.5,0,Math.PI*2);X.fill();
  }
  // Título
  X.textAlign='center';
  X.font='bold 58px Segoe UI'; X.fillStyle='#b388ff';
  X.shadowColor='#7c4dff';X.shadowBlur=30;
  X.fillText('NIGHTMARE TIME',W/2,180);
  X.shadowBlur=0;
  X.font='16px Segoe UI'; X.fillStyle='#666';
  X.fillText('Five Nights at the Tree House',W/2,220);
  // Personajes mini en el fondo
  drawBot(X,'finn',300,550,1.2,0.3);
  drawBot(X,'jake',500,560,1.1,0.3);
  drawBot(X,'chicle',780,545,1.15,0.3);
  drawBot(X,'rey',980,540,1.2,0.3);
  // Botón jugar
  rButton(W/2-120,380,240,55,`► JUGAR NOCHE ${Math.min(maxNight,6)}`,btn(W/2-120,380,240,55));
  // Noches
  X.font='13px Segoe UI';X.fillStyle='#555';X.textAlign='center';
  X.fillText('Seleccionar noche:',W/2,480);
  for(let i=0;i<6;i++){
    const bx=190+i*155,by=500,bw=135,bh=50;
    const unlocked=i+1<=maxNight;
    const hover=btn(bx,by,bw,bh);
    X.fillStyle=unlocked?(hover?'#2a1a40':'#150a25'):'#0a0a0a';
    X.fillRect(bx,by,bw,bh);
    X.strokeStyle=unlocked?(hover?'#b388ff':'#4a2a6a'):'#222';
    X.lineWidth=2;X.strokeRect(bx,by,bw,bh);
    X.fillStyle=unlocked?'#d4b0ff':'#333';
    X.font='13px Segoe UI';X.textAlign='center';
    X.fillText(unlocked?`Noche ${i+1}`:'🔒',bx+bw/2,by+30);
  }
  X.font='11px Segoe UI';X.fillStyle='#444';X.textAlign='center';
  X.fillText('Controles: Ratón para mirar · Click puertas/luces · Botón cámaras abajo',W/2,H-20);
}

function rButton(x,y,w,h,text,hover){
  X.fillStyle=hover?'#2a1a40':'#120820';
  X.fillRect(x,y,w,h);
  X.strokeStyle=hover?'#b388ff':'#5a3a8a';
  X.lineWidth=2;X.strokeRect(x,y,w,h);
  if(hover){X.shadowColor='#7c4dff';X.shadowBlur=10;}
  X.fillStyle=hover?'#fff':'#c8a8ff';
  X.font='bold 16px Segoe UI';X.textAlign='center';
  X.fillText(text,x+w/2,y+h/2+6);
  X.shadowBlur=0;
}

// ========== OFICINA REALISTA ==========
function rOffice(){
  const ox=lookX; // parallax offset
  // Techo oscuro con textura
  X.fillStyle='#080410';X.fillRect(0,0,W,100);
  // Pared de fondo con textura de madera corrupta
  const wallG=X.createLinearGradient(0,100,0,550);
  wallG.addColorStop(0,'#1a1025');wallG.addColorStop(0.5,'#150a20');wallG.addColorStop(1,'#0a0515');
  X.fillStyle=wallG;X.fillRect(0,100,W,450);
  // Textura de pared (líneas verticales como madera)
  X.strokeStyle='rgba(40,20,60,0.3)';X.lineWidth=1;
  for(let i=0;i<40;i++){const lx=i*35+ox*0.1;X.beginPath();X.moveTo(lx,100);X.lineTo(lx+2,550);X.stroke();}
  // Grietas en la pared
  X.strokeStyle='rgba(80,0,120,0.2)';X.lineWidth=1;
  X.beginPath();X.moveTo(400+ox*0.3,150);X.lineTo(420+ox*0.3,250);X.lineTo(410+ox*0.3,350);X.stroke();
  X.beginPath();X.moveTo(900+ox*0.3,180);X.lineTo(880+ox*0.3,300);X.stroke();

  // Ventana con luna (centro)
  const wx=500+ox*0.4,wy=130;
  X.fillStyle='#050020';X.fillRect(wx,wy,280,180);
  X.strokeStyle='#2a1545';X.lineWidth=5;X.strokeRect(wx,wy,280,180);
  X.strokeStyle='#2a1545';X.lineWidth=3;
  X.beginPath();X.moveTo(wx+140,wy);X.lineTo(wx+140,wy+180);X.stroke();
  X.beginPath();X.moveTo(wx,wy+90);X.lineTo(wx+280,wy+90);X.stroke();
  // Luna
  X.fillStyle='#2a1a50';X.shadowColor='#4a2a8a';X.shadowBlur=20;
  X.beginPath();X.arc(wx+200,wy+60,28,0,Math.PI*2);X.fill();X.shadowBlur=0;
  // Estrellas
  X.fillStyle='rgba(200,150,255,0.3)';
  for(let i=0;i<5;i++){X.beginPath();X.arc(wx+40+i*50,wy+30+Math.sin(i)*20,1,0,Math.PI*2);X.fill();}

  // Suelo con perspectiva
  const floorG=X.createLinearGradient(0,550,0,H);
  floorG.addColorStop(0,'#0a0510');floorG.addColorStop(1,'#050308');
  X.fillStyle=floorG;X.fillRect(0,550,W,170);
  // Baldosas
  X.strokeStyle='rgba(30,15,40,0.5)';X.lineWidth=1;
  for(let i=0;i<16;i++){
    const tx=i*90+ox*0.2-50;
    X.beginPath();X.moveTo(tx,550);X.lineTo(tx-20,H);X.stroke();
  }
  for(let i=0;i<4;i++){X.beginPath();X.moveTo(0,560+i*40);X.lineTo(W,560+i*40);X.stroke();}

  // Escritorio
  const dx=350+ox*0.5;
  X.fillStyle='#1a0f25';X.fillRect(dx,460,580,20);
  // Sombra del escritorio
  X.fillStyle='rgba(0,0,0,0.3)';X.fillRect(dx+10,480,560,10);
  // Panel del escritorio
  X.fillStyle='#0f0818';X.fillRect(dx+20,480,540,140);

  // Fan/ventilador
  const fx=dx+480;
  X.strokeStyle='#444';X.lineWidth=2;
  X.beginPath();X.arc(fx,440,18,0,Math.PI*2);X.stroke();
  const fanAngle=gameT*8;
  X.strokeStyle='#555';X.lineWidth=3;
  for(let i=0;i<3;i++){
    const a=fanAngle+i*Math.PI*2/3;
    X.beginPath();X.moveTo(fx,440);X.lineTo(fx+Math.cos(a)*14,440+Math.sin(a)*14);X.stroke();
  }

  // Tablet/monitor de cámaras en mesa
  X.fillStyle='#0a0a0a';X.fillRect(dx+220,400,140,60);
  X.strokeStyle='#333';X.lineWidth=2;X.strokeRect(dx+220,400,140,60);
  X.fillStyle='#0a1a0a';X.fillRect(dx+225,405,130,50);
  X.fillStyle='#1a4a1a';X.font='9px Segoe UI';X.textAlign='center';
  X.fillText('SISTEMA CÁMARAS',dx+290,435);

  // === PUERTA IZQUIERDA ===
  const ldx=ox*0.15;
  X.fillStyle=doorL?'#1a0505':'#100a18';
  X.fillRect(ldx-20,120,85,450);
  // Marco
  X.strokeStyle=doorL?'#661111':'#2a1a3a';X.lineWidth=4;
  X.strokeRect(ldx-20,120,85,450);
  // Indicador
  X.fillStyle=doorL?'#ff3333':'#4a3a5a';
  X.beginPath();X.arc(ldx+50,345,8,0,Math.PI*2);X.fill();
  // Texto
  X.save();X.translate(ldx+30,350);X.rotate(-Math.PI/2);
  X.font='bold 12px Segoe UI';X.textAlign='center';
  X.fillStyle=doorL?'#ff6666':'#8a7a9a';
  X.fillText(doorL?'CERRADA':'PUERTA',0,0);X.restore();

  // === PUERTA DERECHA ===
  const rdx=W-65+ox*0.15;
  X.fillStyle=doorR?'#1a0505':'#100a18';
  X.fillRect(rdx,120,85,450);
  X.strokeStyle=doorR?'#661111':'#2a1a3a';X.lineWidth=4;
  X.strokeRect(rdx,120,85,450);
  X.fillStyle=doorR?'#ff3333':'#4a3a5a';
  X.beginPath();X.arc(rdx+15,345,8,0,Math.PI*2);X.fill();
  X.save();X.translate(rdx+55,350);X.rotate(Math.PI/2);
  X.font='bold 12px Segoe UI';X.textAlign='center';
  X.fillStyle=doorR?'#ff6666':'#8a7a9a';
  X.fillText(doorR?'CERRADA':'PUERTA',0,0);X.restore();

  // === LUCES ===
  // Botón luz izq
  X.fillStyle=lightL?'#2a2a10':'#0f0a15';
  X.fillRect(0,520,75,55);X.strokeStyle='#3a3a2a';X.lineWidth=1;X.strokeRect(0,520,75,55);
  X.fillStyle=lightL?'#ff8':'#777';X.font='11px Segoe UI';X.textAlign='center';
  X.fillText('💡 LUZ',37,552);
  // Botón luz der
  X.fillStyle=lightR?'#2a2a10':'#0f0a15';
  X.fillRect(W-75,520,75,55);X.strokeStyle='#3a3a2a';X.lineWidth=1;X.strokeRect(W-75,520,75,55);
  X.fillStyle=lightR?'#ff8':'#777';X.font='11px Segoe UI';X.textAlign='center';
  X.fillText('💡 LUZ',W-37,552);

  // Efecto de luz izquierda
  if(lightL){
    const lg=X.createLinearGradient(0,120,180,120);
    lg.addColorStop(0,'rgba(255,255,200,0.12)');lg.addColorStop(1,'rgba(0,0,0,0)');
    X.fillStyle=lg;X.fillRect(0,120,180,450);
    const atL=bots.find(b=>b.atDoor&&b.side==='L');
    if(atL) drawBot(X,atL.id,90+ldx,220,2.8,1);
  }
  // Efecto de luz derecha
  if(lightR){
    const lg=X.createLinearGradient(W,120,W-180,120);
    lg.addColorStop(0,'rgba(255,255,200,0.12)');lg.addColorStop(1,'rgba(0,0,0,0)');
    X.fillStyle=lg;X.fillRect(W-180,120,180,450);
    const atR=bots.find(b=>b.atDoor&&b.side==='R');
    if(atR) drawBot(X,atR.id,W-90+ox*0.1,220,2.8,1);
  }

  // Viñeta oscura
  const vig=X.createRadialGradient(W/2,H/2,150,W/2,H/2,650);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,`rgba(0,0,0,${0.55+ambientPulse})`);
  X.fillStyle=vig;X.fillRect(0,0,W,H);

  // Botón cámaras
  const camHover=btn(W/2-80,H-60,160,48);
  X.fillStyle=camHover?'#1a2a1a':'#0a0f0a';
  X.fillRect(W/2-80,H-60,160,48);
  X.strokeStyle=camHover?'#4f4':'#2a4a2a';X.lineWidth=2;
  X.strokeRect(W/2-80,H-60,160,48);
  X.fillStyle=camHover?'#8f8':'#4a8a4a';X.font='bold 14px Segoe UI';X.textAlign='center';
  X.fillText('📹 CÁMARAS',W/2,H-30);
}

// ========== CÁMARAS ==========
function rCameras(){
  // Fondo semi-transparente
  X.fillStyle='rgba(0,0,0,0.92)';X.fillRect(0,0,W,H);

  // Feed de cámara (izquierda)
  X.fillStyle='#080808';X.fillRect(20,20,790,560);
  X.strokeStyle='#1a1a1a';X.lineWidth=2;X.strokeRect(20,20,790,560);

  // Dibujar habitación
  rCamRoom(camSel);

  // Dibujar animatrónicos en esta cámara
  bots.forEach((b,i)=>{
    if(!b.active||b.atDoor)return;
    const camIdx=b.route[b.pos];
    if(typeof camIdx==='number'&&camIdx===camSel){
      const ex=180+i*160, ey=300;
      drawBot(X,b.id,ex,ey,2.5,1);
      X.fillStyle='#f44';X.font='bold 11px Segoe UI';X.textAlign='center';
      X.fillText(b.name,ex,ey+100);
    }
  });

  // Static
  if(camStatic>0){
    X.globalAlpha=camStatic;
    for(let i=0;i<400;i++){
      X.fillStyle=`rgba(${Math.random()*100+100},${Math.random()*100+100},${Math.random()*100+100},0.3)`;
      X.fillRect(20+Math.random()*790,20+Math.random()*560,Math.random()*40+5,1+Math.random()*2);
    }
    X.globalAlpha=1;
  }

  // Scanlines
  X.fillStyle='rgba(0,0,0,0.03)';
  for(let i=0;i<280;i++)X.fillRect(20,20+i*2,790,1);

  // REC
  const blink=Math.sin(gameT*3)>0;
  if(blink){X.fillStyle='#f00';X.beginPath();X.arc(50,45,5,0,Math.PI*2);X.fill();}
  X.fillStyle='#f00';X.font='11px Segoe UI';X.textAlign='left';X.fillText('REC',62,49);

  // Nombre cámara
  X.fillStyle='#0f0';X.font='bold 13px monospace';X.textAlign='left';
  X.fillText(`CAM ${camSel+1} - ${CAM_NAMES[camSel]}`,50,570);

  // Hora en cámara
  const hrs=['12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM'];
  X.textAlign='right';X.fillText(hrs[hour]||'12:00 AM',790,570);

  // === PANEL DERECHO: Botones de cámara ===
  X.fillStyle='#0a0a0a';X.fillRect(830,20,430,560);
  X.strokeStyle='#1a1a1a';X.lineWidth=1;X.strokeRect(830,20,430,560);
  X.fillStyle='#0f0';X.font='bold 14px Segoe UI';X.textAlign='center';
  X.fillText('MAPA DE CÁMARAS',1045,50);

  // Mapa visual simplificado
  rCamMap();

  // Botones de cámara
  for(let i=0;i<7;i++){
    const bx=840,by=80+i*65,bw=180,bh=50;
    const sel=i===camSel, hov=btn(bx,by,bw,bh);
    X.fillStyle=sel?'#0a2a0a':(hov?'#1a1a1a':'#0a0a0a');
    X.fillRect(bx,by,bw,bh);
    X.strokeStyle=sel?'#0f0':(hov?'#4a4a4a':'#222');
    X.lineWidth=sel?2:1;X.strokeRect(bx,by,bw,bh);
    X.fillStyle=sel?'#0f0':'#888';X.font='12px Segoe UI';X.textAlign='left';
    X.fillText(`CAM ${i+1} ${CAM_NAMES[i]}`,bx+10,by+30);
    // Indicador de enemigo
    const hasEnemy=bots.some(b=>b.active&&!b.atDoor&&typeof b.route[b.pos]==='number'&&b.route[b.pos]===i);
    if(hasEnemy){X.fillStyle='#f00';X.beginPath();X.arc(bx+bw-15,by+25,5,0,Math.PI*2);X.fill();}
  }

  // Botón cerrar
  const closeHov=btn(W/2-80,H-60,160,48);
  X.fillStyle=closeHov?'#2a1010':'#1a0a0a';
  X.fillRect(W/2-80,H-60,160,48);
  X.strokeStyle=closeHov?'#f66':'#6a2a2a';X.lineWidth=2;
  X.strokeRect(W/2-80,H-60,160,48);
  X.fillStyle=closeHov?'#faa':'#a66';X.font='bold 14px Segoe UI';X.textAlign='center';
  X.fillText('❌ CERRAR CÁMARAS',W/2,H-30);
}

function rCamMap(){
  // Mini mapa visual en la esquina inferior derecha del panel
  const ox=1040,oy=350;
  X.strokeStyle='#1a3a1a';X.lineWidth=1;
  // Conexiones
  const pts=[[ox,oy-80],[ox,oy-30],[ox-60,oy-30],[ox-60,oy+30],[ox+60,oy+30],[ox-60,oy+80],[ox+60,oy+80]];
  X.beginPath();X.moveTo(pts[0][0],pts[0][1]);X.lineTo(pts[1][0],pts[1][1]);X.stroke();
  X.beginPath();X.moveTo(pts[1][0],pts[1][1]);X.lineTo(pts[2][0],pts[2][1]);X.stroke();
  X.beginPath();X.moveTo(pts[1][0],pts[1][1]);X.lineTo(pts[3][0],pts[3][1]);X.stroke();
  X.beginPath();X.moveTo(pts[1][0],pts[1][1]);X.lineTo(pts[4][0],pts[4][1]);X.stroke();
  X.beginPath();X.moveTo(pts[3][0],pts[3][1]);X.lineTo(pts[5][0],pts[5][1]);X.stroke();
  X.beginPath();X.moveTo(pts[4][0],pts[4][1]);X.lineTo(pts[6][0],pts[6][1]);X.stroke();
  // Nodos
  pts.forEach((p,i)=>{
    X.fillStyle=i===camSel?'#0f0':'#2a4a2a';
    X.beginPath();X.arc(p[0],p[1],8,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font='8px Segoe UI';X.textAlign='center';
    X.fillText(''+(i+1),p[0],p[1]+3);
  });
  // Tu oficina
  X.fillStyle='#aa8';X.font='9px Segoe UI';X.textAlign='center';
  X.fillText('OFICINA',ox,oy+115);
  X.strokeStyle='#4a4a2a';
  X.beginPath();X.moveTo(pts[5][0],pts[5][1]+8);X.lineTo(ox-20,oy+105);X.stroke();
  X.beginPath();X.moveTo(pts[6][0],pts[6][1]+8);X.lineTo(ox+20,oy+105);X.stroke();
}

function rCamRoom(idx){
  X.save();X.beginPath();X.rect(22,22,786,556);X.clip();
  const o=22;
  switch(idx){
    case 0: // Escenario
      X.fillStyle='#0f0815';X.fillRect(o,o,786,556);
      // Escenario elevado
      X.fillStyle='#1a0a25';X.fillRect(o+150,o+200,486,250);
      // Cortinas
      X.fillStyle='#4a0a2a';X.fillRect(o+150,o+80,50,370);X.fillRect(o+586,o+80,50,370);
      // Cortina superior
      X.fillStyle='#3a0820';X.fillRect(o+150,o+80,486,40);
      // Estrellas decorativas
      X.fillStyle='#ff0';X.font='24px serif';X.textAlign='center';
      X.fillText('★',o+300,o+150);X.fillText('★',o+500,o+150);
      // Suelo
      X.fillStyle='#080510';X.fillRect(o,o+450,786,106);
      break;
    case 1: // Comedor
      X.fillStyle='#0a0810';X.fillRect(o,o,786,556);
      X.fillStyle='#0f0a18';X.fillRect(o,o+400,786,156);
      // Mesas
      X.fillStyle='#1a1020';
      X.fillRect(o+100,o+280,120,60);X.fillRect(o+350,o+300,120,60);X.fillRect(o+580,o+270,120,60);
      // Sillas
      X.fillStyle='#120a18';
      for(let i=0;i<8;i++)X.fillRect(o+80+i*90,o+350,25,50);
      // Dibujos en pared
      X.strokeStyle='#2a1a3a';X.lineWidth=1;
      X.strokeRect(o+200,o+80,60,80);X.strokeRect(o+500,o+100,50,60);
      break;
    case 2: // Backstage/Cocina
      X.fillStyle='#100810';X.fillRect(o,o,786,556);
      // Estantes
      X.fillStyle='#1a1020';X.fillRect(o+50,o+100,100,400);X.fillRect(o+600,o+80,150,420);
      // Mesa central
      X.fillStyle='#151015';X.fillRect(o+250,o+250,250,30);
      // Cabezas de repuesto (creepy)
      X.fillStyle='#333';
      X.beginPath();X.arc(o+80,o+150,15,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(o+120,o+200,12,0,Math.PI*2);X.fill();
      X.fillStyle='#f00';X.beginPath();X.arc(o+78,o+148,3,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(o+122,o+198,2,0,Math.PI*2);X.fill();
      break;
    case 3: case 4: // Pasillos
      X.fillStyle='#060410';X.fillRect(o,o,786,556);
      // Perspectiva de pasillo
      X.fillStyle='#0a0818';
      X.beginPath();X.moveTo(o+200,o);X.lineTo(o+586,o);X.lineTo(o+500,o+556);X.lineTo(o+286,o+556);X.closePath();X.fill();
      // Cuadros
      X.strokeStyle='#2a1a3a';X.lineWidth=2;
      X.strokeRect(o+300,o+100,80,100);X.strokeRect(o+450,o+120,60,80);
      // Luz tenue al fondo
      X.fillStyle='rgba(100,50,150,0.03)';X.fillRect(o+350,o+200,100,200);
      break;
    case 5: case 6: // Esquinas (cerca de oficina)
      X.fillStyle='#040308';X.fillRect(o,o,786,556);
      X.fillStyle='#0a0610';X.fillRect(o+200,o+50,386,456);
      // Puerta al fondo
      X.fillStyle='#1a0a1a';X.fillRect(o+320,o+150,150,300);
      X.strokeStyle='#3a1a4a';X.lineWidth=3;X.strokeRect(o+320,o+150,150,300);
      // Cartel
      X.fillStyle='#666';X.font='10px Segoe UI';X.textAlign='center';
      X.fillText(idx===5?'← OFICINA':'OFICINA →',o+395,o+470);
      // Sombras
      X.fillStyle='rgba(0,0,0,0.3)';X.fillRect(o+200,o+400,386,106);
      break;
  }
  X.restore();
}

// ========== HUD ==========
function rHUD(){
  const hrs=['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'];
  // Hora
  X.fillStyle='#eee';X.font='bold 26px Segoe UI';X.textAlign='right';
  X.fillText(hrs[hour],W-25,38);
  // Noche
  X.fillStyle='#aaa';X.font='15px Segoe UI';X.textAlign='right';
  X.fillText(`Noche ${night}`,W-25,62);
  // Energía
  X.textAlign='left';
  X.fillStyle=power>30?'#8f8':power>15?'#ff8':'#f88';
  X.font='bold 16px Segoe UI';
  X.fillText(`⚡ ${Math.round(power)}%`,25,38);
  // Barra
  X.fillStyle='#111';X.fillRect(25,45,150,6);
  X.fillStyle=power>30?'#2a6a2a':power>15?'#6a6a0a':'#6a1a1a';
  X.fillRect(25,45,power*1.5,6);
}

// ========== GAME OVER ==========
function rGameOver(){
  gameOverT+=0.016;
  X.fillStyle='#000';X.fillRect(0,0,W,H);
  // Jumpscare
  if(killer){
    // Flash rojo
    X.fillStyle=`rgba(60,0,0,${0.3+Math.sin(gameOverT*10)*0.1})`;X.fillRect(0,0,W,H);
    drawBot(X,killer.id,W/2,300,6,1);
  }
  // Static
  for(let i=0;i<500;i++){
    X.fillStyle=`rgba(255,255,255,${Math.random()*0.08})`;
    X.fillRect(Math.random()*W,Math.random()*H,Math.random()*30,1+Math.random());
  }
  X.fillStyle='#f00';X.font='bold 52px Segoe UI';X.textAlign='center';
  X.shadowColor='#f00';X.shadowBlur=20;
  X.fillText('GAME OVER',W/2,560);X.shadowBlur=0;
  if(killer){X.fillStyle='#a00';X.font='18px Segoe UI';X.fillText(killer.name+' te atrapó',W/2,600);}
  if(gameOverT>1.5){X.fillStyle='#666';X.font='14px Segoe UI';X.fillText('Click para reintentar',W/2,660);}
}

// ========== WIN ==========
function rWin(){
  winT+=0.016;
  X.fillStyle='#000';X.fillRect(0,0,W,H);
  X.fillStyle='#4f4';X.font='bold 72px Segoe UI';X.textAlign='center';
  X.shadowColor='#4f4';X.shadowBlur=30;
  X.fillText('6 AM',W/2,300);X.shadowBlur=0;
  X.fillStyle='#8f8';X.font='22px Segoe UI';
  X.fillText(`¡Noche ${night} superada!`,W/2,370);
  if(night>=6){X.fillStyle='#ff0';X.font='18px Segoe UI';X.fillText('¡TODAS LAS NOCHES COMPLETADAS!',W/2,420);}
  if(winT>1){X.fillStyle='#888';X.font='14px Segoe UI';X.fillText('Click para continuar',W/2,500);}
}

// ========== CURSOR ==========
function rCursor(){
  X.strokeStyle='#fff';X.lineWidth=1.5;
  X.beginPath();X.moveTo(mx,my-10);X.lineTo(mx,my+10);X.stroke();
  X.beginPath();X.moveTo(mx-10,my);X.lineTo(mx+10,my);X.stroke();
  X.fillStyle='rgba(255,255,255,0.1)';
  X.beginPath();X.arc(mx,my,4,0,Math.PI*2);X.fill();
}

// ========== DIBUJAR ANIMATRÓNICOS ==========
function drawBot(c,id,x,y,s,alpha){
  c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=alpha||1;
  switch(id){
    case'finn':dFinn(c);break;case'jake':dJake(c);break;
    case'chicle':dChicle(c);break;case'rey':dRey(c);break;
  }
  c.restore();
}

function dFinn(c){
  // Sombra
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(0,85,18,5,0,0,Math.PI*2);c.fill();
  // Piernas
  c.fillStyle='#ddd';c.fillRect(-10,58,8,22);c.fillRect(2,58,8,22);
  // Zapatos
  c.fillStyle='#1a1a1a';
  c.beginPath();c.ellipse(-6,80,7,4,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(6,80,7,4,0,0,Math.PI*2);c.fill();
  // Shorts
  c.fillStyle='#1a5a3a';c.fillRect(-14,45,28,16);
  // Cuerpo
  c.fillStyle='#1a5a8a';c.fillRect(-15,5,30,42);
  // Mochila
  c.fillStyle='#2a8a2a';c.beginPath();c.ellipse(0,25,10,14,0,0,Math.PI*2);c.fill();
  // Brazos
  c.fillStyle='#ddd';c.fillRect(-22,10,9,28);c.fillRect(13,10,9,28);
  // Gorro
  c.fillStyle='#f5f5f5';
  c.beginPath();c.arc(0,-14,20,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(-14,-30,8,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(14,-30,8,0,Math.PI*2);c.fill();
  // Cara
  c.fillStyle='#ffe0b0';c.beginPath();c.arc(0,-8,13,0,Math.PI*2);c.fill();
  // Ojos rojos brillantes
  c.fillStyle='#ff0000';c.shadowColor='#ff0000';c.shadowBlur=12;
  c.beginPath();c.arc(-5,-11,4,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-11,4,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  c.fillStyle='#300';c.beginPath();c.arc(-5,-11,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-11,2,0,Math.PI*2);c.fill();
  // Boca
  c.strokeStyle='#500';c.lineWidth=1.5;
  c.beginPath();c.arc(0,-2,6,0.2,Math.PI-0.2);c.stroke();
  // Espada
  c.fillStyle='#6a0dad';c.fillRect(20,-10,4,50);
  c.fillStyle='#b060ff';c.fillRect(17,-13,10,5);
  // Corrupción
  c.strokeStyle='rgba(120,0,180,0.4)';c.lineWidth=1;
  c.beginPath();c.moveTo(-8,8);c.lineTo(-14,40);c.moveTo(8,8);c.lineTo(14,42);c.stroke();
}

function dJake(c){
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(0,65,22,5,0,0,Math.PI*2);c.fill();
  // Patas
  c.fillStyle='#cc9900';
  c.fillRect(-18,40,9,25);c.fillRect(-5,40,9,22);c.fillRect(5,40,9,24);c.fillRect(15,40,9,20);
  // Cuerpo
  c.fillStyle='#ddaa00';c.beginPath();c.ellipse(0,20,24,18,0,0,Math.PI*2);c.fill();
  // Cabeza
  c.fillStyle='#eebb00';c.beginPath();c.arc(0,-12,18,0,Math.PI*2);c.fill();
  // Hocico
  c.fillStyle='#ffdd44';c.beginPath();c.ellipse(0,-5,10,7,0,0,Math.PI*2);c.fill();
  // Orejas
  c.fillStyle='#cc9900';
  c.beginPath();c.ellipse(-13,-26,5,11,-0.3,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(13,-26,5,11,0.3,0,Math.PI*2);c.fill();
  // Ojos
  c.fillStyle='#000';c.beginPath();c.arc(-7,-16,6,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-16,6,0,Math.PI*2);c.fill();
  c.fillStyle='#ffff00';c.shadowColor='#ffff00';c.shadowBlur=8;
  c.beginPath();c.arc(-7,-16,3,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-16,3,0,Math.PI*2);c.fill();c.shadowBlur=0;
  // Sonrisa enorme
  c.strokeStyle='#330000';c.lineWidth=2;
  c.beginPath();c.arc(0,-3,11,0.1,Math.PI-0.1);c.stroke();
  c.fillStyle='#fff';for(let i=-4;i<=4;i++)c.fillRect(-9+(i+4)*2.2,-3,2,4);
  // Cola
  c.strokeStyle='#cc9900';c.lineWidth=4;
  c.beginPath();c.moveTo(-24,20);c.quadraticCurveTo(-35,5,-30,-10);c.stroke();
}

function dChicle(c){
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(0,80,16,4,0,0,Math.PI*2);c.fill();
  // Cuerpo derretido
  c.fillStyle='#cc3388';
  c.beginPath();c.moveTo(-18,75);c.quadraticCurveTo(-20,15,0,-22);c.quadraticCurveTo(20,15,18,75);c.closePath();c.fill();
  // Goteo
  c.fillStyle='#aa2266';
  for(let i=-2;i<=2;i++){c.beginPath();c.ellipse(i*7,78+Math.abs(i)*4,3,8+Math.abs(i)*3,0,0,Math.PI*2);c.fill();}
  // Corona
  c.fillStyle='#ffd700';
  c.beginPath();c.moveTo(-11,-26);c.lineTo(-9,-40);c.lineTo(-4,-30);c.lineTo(0,-44);
  c.lineTo(4,-30);c.lineTo(9,-40);c.lineTo(11,-26);c.closePath();c.fill();
  c.fillStyle='#ff00aa';c.beginPath();c.arc(0,-32,3,0,Math.PI*2);c.fill();
  // Cara
  c.fillStyle='#ffccdd';c.beginPath();c.arc(0,-6,13,0,Math.PI*2);c.fill();
  // Ojos
  c.fillStyle='#000';c.beginPath();c.arc(-5,-9,4.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-7,3.5,0,Math.PI*2);c.fill();
  c.fillStyle='#ff00ff';c.shadowColor='#ff00ff';c.shadowBlur=6;
  c.beginPath();c.arc(-5,-9,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-7,1.5,0,Math.PI*2);c.fill();c.shadowBlur=0;
  // Boca
  c.strokeStyle='#660033';c.lineWidth=1.5;
  c.beginPath();c.moveTo(-7,2);c.quadraticCurveTo(0,9,7,1);c.stroke();
}

function dRey(c){
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(0,85,18,5,0,0,Math.PI*2);c.fill();
  // Túnica
  c.fillStyle='#1a3a6b';
  c.beginPath();c.moveTo(-18,15);c.lineTo(-24,85);c.lineTo(24,85);c.lineTo(18,15);c.closePath();c.fill();
  // Cuerpo
  c.fillStyle='#4488cc';c.beginPath();c.ellipse(0,8,16,20,0,0,Math.PI*2);c.fill();
  // Cabeza
  c.fillStyle='#6699cc';c.beginPath();c.arc(0,-18,16,0,Math.PI*2);c.fill();
  // Corona
  c.fillStyle='#ffd700';
  c.beginPath();c.moveTo(-11,-32);c.lineTo(-9,-46);c.lineTo(-4,-36);c.lineTo(0,-50);
  c.lineTo(4,-36);c.lineTo(9,-46);c.lineTo(11,-32);c.closePath();c.fill();
  c.fillStyle='#f00';c.beginPath();c.arc(0,-40,3,0,Math.PI*2);c.fill();
  // Nariz
  c.fillStyle='#5588bb';c.beginPath();c.moveTo(0,-16);c.lineTo(-4,0);c.lineTo(4,0);c.closePath();c.fill();
  // Ojos
  c.fillStyle='#fff';c.beginPath();c.arc(-6,-20,4.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,-20,4.5,0,Math.PI*2);c.fill();
  c.fillStyle='#00ccff';c.shadowColor='#00ccff';c.shadowBlur=6;
  c.beginPath();c.arc(-6,-20,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,-20,2,0,Math.PI*2);c.fill();c.shadowBlur=0;
  // Barba
  c.fillStyle='#ddeeff';
  c.beginPath();c.moveTo(-10,-8);c.quadraticCurveTo(-7,12,-4,28);c.lineTo(4,28);c.quadraticCurveTo(7,12,10,-8);c.closePath();c.fill();
  // Manos + hielo
  c.fillStyle='#4488cc';c.beginPath();c.arc(-20,28,7,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(20,28,7,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(100,200,255,0.5)';c.beginPath();c.arc(20,22,11,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(150,230,255,0.6)';c.lineWidth=1;c.beginPath();c.arc(20,22,11,0,Math.PI*2);c.stroke();
}

// ========== LOOP ==========
let lt=performance.now();
(function loop(now){
  const dt=Math.min((now-lt)/1000,0.1);lt=now;
  update(dt);render();
  requestAnimationFrame(loop);
})(lt);
