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
const CAM_NAMES = ['Escenario','Comedor','Backstage','Pasillo Oeste','Pasillo Este','Rincón Oeste','Rincón Este','Baños','Almacén','Conductos','Sótano','Entrada'];
const ROUTES = {
  finn:  [0,1,3,5,7,5,'L'], jake: [0,1,4,6,9,6,'R'],
  chicle:[0,2,8,3,5,7,5,'L'], rey:  [0,11,1,4,6,10,6,'R']
};
const DIFF = [
  null,
  {finn:3,jake:2,chicle:1,rey:1},
  {finn:5,jake:4,chicle:3,rey:2},
  {finn:7,jake:6,chicle:5,rey:4},
  {finn:10,jake:8,chicle:7,rey:6},
  {finn:14,jake:12,chicle:10,rey:9},
  {finn:18,jake:16,chicle:14,rey:12}
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
    const target=-(mx/W-0.5)*800;
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
    for(let i=0;i<12;i++){
      const bx=840,by=48+i*44;
      if(btn(bx,by,180,38)){if(camSel!==i)camStatic=0.25;camSel=i;playStatic();return;}
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
  for(let i=0;i<12;i++){
    const bx=840,by=48+i*44,bw=180,bh=38;
    const sel=i===camSel, hov=btn(bx,by,bw,bh);
    X.fillStyle=sel?'#0a2a0a':(hov?'#1a1a1a':'#0a0a0a');
    X.fillRect(bx,by,bw,bh);
    X.strokeStyle=sel?'#0f0':(hov?'#4a4a4a':'#222');
    X.lineWidth=sel?2:1;X.strokeRect(bx,by,bw,bh);
    X.fillStyle=sel?'#0f0':'#888';X.font='12px Segoe UI';X.textAlign='left';
    X.fillText(`CAM ${i+1} ${CAM_NAMES[i]}`,bx+10,by+30);
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
  const o=22,w=786,h=556;
  // Fondo base oscuro
  X.fillStyle='#050308';X.fillRect(o,o,w,h);
  switch(idx){
    case 0: // Escenario principal
      // Pared trasera con textura de ladrillo
      var wg=X.createLinearGradient(o,o,o,o+h);
      wg.addColorStop(0,'#1a0a20');wg.addColorStop(1,'#0a0510');
      X.fillStyle=wg;X.fillRect(o,o,w,h);
      // Ladrillos
      X.strokeStyle='rgba(40,15,50,0.3)';X.lineWidth=1;
      for(var r=0;r<18;r++)for(var b=0;b<12;b++){
        var bx=o+b*68+(r%2)*34,by=o+r*32;
        X.strokeRect(bx,by,66,30);
      }
      // Escenario elevado con madera
      var sg=X.createLinearGradient(o,o+220,o,o+480);
      sg.addColorStop(0,'#2a1535');sg.addColorStop(1,'#150a1a');
      X.fillStyle=sg;X.fillRect(o+100,o+220,586,280);
      // Tablas del escenario
      X.strokeStyle='rgba(60,30,80,0.3)';X.lineWidth=1;
      for(var i=0;i<10;i++)X.strokeRect(o+100+i*59,o+220,58,280);
      // Cortinas con pliegues
      var cg=X.createLinearGradient(o+100,o,o+160,o);
      cg.addColorStop(0,'#5a0a30');cg.addColorStop(0.5,'#8a1050');cg.addColorStop(1,'#5a0a30');
      X.fillStyle=cg;X.fillRect(o+100,o+50,65,450);
      cg=X.createLinearGradient(o+621,o,o+686,o);
      cg.addColorStop(0,'#5a0a30');cg.addColorStop(0.5,'#8a1050');cg.addColorStop(1,'#5a0a30');
      X.fillStyle=cg;X.fillRect(o+621,o+50,65,450);
      // Cortina superior
      X.fillStyle='#4a0828';X.fillRect(o+100,o+50,586,35);
      // Borlas doradas
      X.fillStyle='#aa8800';
      for(var i=0;i<8;i++){X.beginPath();X.arc(o+140+i*70,o+88,4,0,Math.PI*2);X.fill();}
      // Focos de luz
      X.fillStyle='rgba(255,200,100,0.04)';
      X.beginPath();X.moveTo(o+300,o+50);X.lineTo(o+250,o+500);X.lineTo(o+350,o+500);X.closePath();X.fill();
      X.beginPath();X.moveTo(o+500,o+50);X.lineTo(o+450,o+500);X.lineTo(o+550,o+500);X.closePath();X.fill();
      // Suelo con reflejo
      X.fillStyle='#080510';X.fillRect(o,o+480,w,76);
      X.fillStyle='rgba(30,10,40,0.5)';
      for(var i=0;i<12;i++)X.fillRect(o+i*66,o+480,64,76);
      break;
    case 1: // Comedor
      var wg=X.createLinearGradient(o,o,o,o+h);
      wg.addColorStop(0,'#120a18');wg.addColorStop(1,'#080510');
      X.fillStyle=wg;X.fillRect(o,o,w,h);
      // Suelo de baldosas
      X.fillStyle='#0a0812';X.fillRect(o,o+380,w,176);
      X.strokeStyle='rgba(30,15,40,0.4)';X.lineWidth=1;
      for(var i=0;i<12;i++)for(var j=0;j<4;j++)X.strokeRect(o+i*66,o+380+j*44,65,43);
      // Mesas con mantel y sombra
      for(var t=0;t<3;t++){
        var tx=o+80+t*240,ty=o+280;
        X.fillStyle='rgba(0,0,0,0.3)';X.fillRect(tx+5,ty+65,130,10);
        X.fillStyle='#1a1025';X.fillRect(tx,ty,130,60);
        X.fillStyle='#2a1535';X.fillRect(tx+5,ty+2,120,5);
        // Platos
        X.strokeStyle='#333';X.lineWidth=1;
        X.beginPath();X.ellipse(tx+40,ty+30,12,6,0,0,Math.PI*2);X.stroke();
        X.beginPath();X.ellipse(tx+90,ty+30,12,6,0,0,Math.PI*2);X.stroke();
      }
      // Sillas
      for(var i=0;i<10;i++){
        var sx=o+60+i*75,sy=o+350;
        X.fillStyle='#150a1a';X.fillRect(sx,sy,20,50);
        X.fillRect(sx+2,sy-30,16,32);
      }
      // Cuadros en pared con marcos
      X.fillStyle='#1a1030';X.fillRect(o+150,o+60,90,70);
      X.strokeStyle='#3a2a4a';X.lineWidth=3;X.strokeRect(o+150,o+60,90,70);
      X.fillStyle='#1a1030';X.fillRect(o+500,o+80,70,55);
      X.strokeStyle='#3a2a4a';X.lineWidth=3;X.strokeRect(o+500,o+80,70,55);
      // Lámpara colgante
      X.strokeStyle='#333';X.lineWidth=2;X.beginPath();X.moveTo(o+400,o);X.lineTo(o+400,o+60);X.stroke();
      X.fillStyle='#2a2a1a';X.beginPath();X.arc(o+400,o+65,15,0,Math.PI);X.fill();
      X.fillStyle='rgba(255,200,100,0.03)';X.beginPath();X.arc(o+400,o+65,80,0,Math.PI*2);X.fill();
      break;
    case 2: // Backstage (almacén siniestro)
      X.fillStyle='#0a0810';X.fillRect(o,o,w,h);
      // Estantes metálicos
      for(var s=0;s<3;s++){
        var sx=o+50+s*260,sy=o+60;
        X.fillStyle='#1a1a20';X.fillRect(sx,sy,100,440);
        X.strokeStyle='#2a2a30';X.lineWidth=2;X.strokeRect(sx,sy,100,440);
        for(var sh=0;sh<5;sh++){
          X.fillStyle='#222228';X.fillRect(sx+5,sy+sh*88,90,3);
          // Objetos en estantes
          X.fillStyle='#1a1520';X.fillRect(sx+10,sy+sh*88-25,25,25);
          X.fillStyle='#151218';X.beginPath();X.arc(sx+70,sy+sh*88-15,12,0,Math.PI*2);X.fill();
        }
      }
      // Cabezas de animatrónicos (repuesto) - CREEPY
      X.fillStyle='#2a2a30';X.beginPath();X.arc(o+80,o+130,18,0,Math.PI*2);X.fill();
      X.fillStyle='#f00';X.beginPath();X.arc(o+75,o+125,3,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(o+85,o+125,3,0,Math.PI*2);X.fill();
      X.fillStyle='#2a2a30';X.beginPath();X.arc(o+130,o+220,15,0,Math.PI*2);X.fill();
      X.fillStyle='#ff0';X.beginPath();X.arc(o+126,o+216,2,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(o+134,o+216,2,0,Math.PI*2);X.fill();
      // Mesa de trabajo
      X.fillStyle='#1a1520';X.fillRect(o+400,o+300,250,20);
      X.fillStyle='#151218';X.fillRect(o+420,o+320,20,180);X.fillRect(o+620,o+320,20,180);
      // Herramientas
      X.strokeStyle='#444';X.lineWidth=2;
      X.beginPath();X.moveTo(o+450,o+280);X.lineTo(o+450,o+300);X.stroke();
      X.beginPath();X.moveTo(o+480,o+270);X.lineTo(o+480,o+300);X.stroke();
      // Suelo sucio
      X.fillStyle='rgba(20,10,15,0.5)';X.fillRect(o,o+480,w,76);
      break;
    case 3: // Pasillo Oeste
      X.fillStyle='#060410';X.fillRect(o,o,w,h);
      // Perspectiva de pasillo realista
      var pg=X.createLinearGradient(o+200,o,o+586,o);
      pg.addColorStop(0,'#0a0818');pg.addColorStop(0.5,'#0f0c20');pg.addColorStop(1,'#0a0818');
      X.fillStyle=pg;
      X.beginPath();X.moveTo(o+180,o);X.lineTo(o+606,o);X.lineTo(o+520,o+h);X.lineTo(o+266,o+h);X.closePath();X.fill();
      // Suelo con perspectiva
      X.fillStyle='#080612';
      X.beginPath();X.moveTo(o+266,o+350);X.lineTo(o+520,o+350);X.lineTo(o+520,o+h);X.lineTo(o+266,o+h);X.closePath();X.fill();
      // Baldosas perspectiva
      X.strokeStyle='rgba(30,15,40,0.3)';X.lineWidth=1;
      for(var i=0;i<6;i++){var ly=o+350+i*35;X.beginPath();X.moveTo(o+266,ly);X.lineTo(o+520,ly);X.stroke();}
      // Cuadros con marcos dorados
      X.fillStyle='#1a1030';X.fillRect(o+300,o+80,90,110);
      X.strokeStyle='#8a7a30';X.lineWidth=3;X.strokeRect(o+300,o+80,90,110);
      X.fillStyle='#1a1030';X.fillRect(o+440,o+100,70,90);
      X.strokeStyle='#8a7a30';X.lineWidth=3;X.strokeRect(o+440,o+100,70,90);
      // Dibujos perturbadores dentro
      X.fillStyle='#f00';X.beginPath();X.arc(o+345,o+130,5,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(o+475,o+140,4,0,Math.PI*2);X.fill();
      // Luz al fondo
      X.fillStyle='rgba(100,50,150,0.04)';X.beginPath();X.arc(o+393,o+200,60,0,Math.PI*2);X.fill();
      // Tubería en el techo
      X.fillStyle='#1a1a20';X.fillRect(o+280,o+10,226,8);
      break;
    case 4: // Pasillo Este
      X.fillStyle='#060410';X.fillRect(o,o,w,h);
      var pg=X.createLinearGradient(o+200,o,o+586,o);
      pg.addColorStop(0,'#0a0818');pg.addColorStop(0.5,'#0f0c20');pg.addColorStop(1,'#0a0818');
      X.fillStyle=pg;
      X.beginPath();X.moveTo(o+180,o);X.lineTo(o+606,o);X.lineTo(o+520,o+h);X.lineTo(o+266,o+h);X.closePath();X.fill();
      X.fillStyle='#080612';
      X.beginPath();X.moveTo(o+266,o+350);X.lineTo(o+520,o+350);X.lineTo(o+520,o+h);X.lineTo(o+266,o+h);X.closePath();X.fill();
      X.strokeStyle='rgba(30,15,40,0.3)';X.lineWidth=1;
      for(var i=0;i<6;i++){var ly=o+350+i*35;X.beginPath();X.moveTo(o+266,ly);X.lineTo(o+520,ly);X.stroke();}
      // Poster de Finn rasgado
      X.fillStyle='#1a2a4a';X.fillRect(o+320,o+90,80,100);
      X.strokeStyle='#3a4a6a';X.lineWidth=2;X.strokeRect(o+320,o+90,80,100);
      X.strokeStyle='#f00';X.lineWidth=2;X.beginPath();X.moveTo(o+330,o+90);X.lineTo(o+390,o+190);X.stroke();
      // Ventana rota
      X.fillStyle='#030010';X.fillRect(o+450,o+100,70,80);
      X.strokeStyle='#2a2a3a';X.lineWidth=2;X.strokeRect(o+450,o+100,70,80);
      X.strokeStyle='#3a3a4a';X.beginPath();X.moveTo(o+450,o+140);X.lineTo(o+520,o+140);X.stroke();
      X.beginPath();X.moveTo(o+485,o+100);X.lineTo(o+485,o+180);X.stroke();
      // Grietas
      X.strokeStyle='rgba(60,0,80,0.3)';X.lineWidth=1;
      X.beginPath();X.moveTo(o+350,o+250);X.bezierCurveTo(o+360,o+300,o+340,o+350,o+355,o+400);X.stroke();
      break;
    case 5: // Rincón Oeste (puerta izquierda de oficina)
      X.fillStyle='#030208';X.fillRect(o,o,w,h);
      // Paredes convergentes
      X.fillStyle='#0a0615';
      X.beginPath();X.moveTo(o+150,o);X.lineTo(o+636,o);X.lineTo(o+550,o+h);X.lineTo(o+236,o+h);X.closePath();X.fill();
      // Puerta de la oficina visible
      X.fillStyle='#1a0a1a';X.fillRect(o+320,o+120,150,350);
      X.strokeStyle='#4a2a5a';X.lineWidth=4;X.strokeRect(o+320,o+120,150,350);
      // Pomo
      X.fillStyle='#888';X.beginPath();X.arc(o+450,o+300,6,0,Math.PI*2);X.fill();
      // Cartel "OFICINA"
      X.fillStyle='#1a1a20';X.fillRect(o+350,o+90,90,25);
      X.fillStyle='#aaa';X.font='bold 11px Segoe UI';X.textAlign='center';X.fillText('OFICINA',o+395,o+107);
      // Suelo
      X.fillStyle='#050310';X.fillRect(o+236,o+420,314,136);
      // Sombras largas
      X.fillStyle='rgba(0,0,0,0.4)';
      X.beginPath();X.moveTo(o+320,o+470);X.lineTo(o+280,o+h);X.lineTo(o+520,o+h);X.lineTo(o+470,o+470);X.closePath();X.fill();
      // Luz parpadeante
      if(Math.sin(gameT*4)>0.7){X.fillStyle='rgba(255,200,100,0.02)';X.beginPath();X.arc(o+395,o+80,100,0,Math.PI*2);X.fill();}
      break;
    case 6: // Rincón Este (puerta derecha de oficina)
      X.fillStyle='#030208';X.fillRect(o,o,w,h);
      X.fillStyle='#0a0615';
      X.beginPath();X.moveTo(o+150,o);X.lineTo(o+636,o);X.lineTo(o+550,o+h);X.lineTo(o+236,o+h);X.closePath();X.fill();
      // Puerta
      X.fillStyle='#1a0a1a';X.fillRect(o+320,o+120,150,350);
      X.strokeStyle='#4a2a5a';X.lineWidth=4;X.strokeRect(o+320,o+120,150,350);
      X.fillStyle='#888';X.beginPath();X.arc(o+340,o+300,6,0,Math.PI*2);X.fill();
      X.fillStyle='#1a1a20';X.fillRect(o+350,o+90,90,25);
      X.fillStyle='#aaa';X.font='bold 11px Segoe UI';X.textAlign='center';X.fillText('OFICINA',o+395,o+107);
      X.fillStyle='#050310';X.fillRect(o+236,o+420,314,136);
      // Ventana con luna
      X.fillStyle='#020015';X.fillRect(o+450,o+60,100,80);
      X.strokeStyle='#2a2a3a';X.lineWidth=2;X.strokeRect(o+450,o+60,100,80);
      X.fillStyle='#1a0a30';X.beginPath();X.arc(o+510,o+85,12,0,Math.PI*2);X.fill();
      // Sombras
      X.fillStyle='rgba(0,0,0,0.4)';
      X.beginPath();X.moveTo(o+320,o+470);X.lineTo(o+280,o+h);X.lineTo(o+520,o+h);X.lineTo(o+470,o+470);X.closePath();X.fill();
      if(Math.sin(gameT*3+1)>0.8){X.fillStyle='rgba(255,200,100,0.02)';X.beginPath();X.arc(o+395,o+80,100,0,Math.PI*2);X.fill();}
    case 7: // Baños
      X.fillStyle='#080810';X.fillRect(o,o,w,h);
      // Azulejos
      X.strokeStyle='rgba(30,30,40,0.4)';X.lineWidth=1;
      for(var r=0;r<20;r++)for(var b=0;b<14;b++)X.strokeRect(o+b*57,o+r*28,56,27);
      // Lavabos
      X.fillStyle='#1a1a25';
      X.fillRect(o+100,o+300,150,20);X.fillRect(o+350,o+300,150,20);
      X.fillStyle='#222230';
      X.beginPath();X.ellipse(o+175,o+295,30,12,0,0,Math.PI*2);X.fill();
      X.beginPath();X.ellipse(o+425,o+295,30,12,0,0,Math.PI*2);X.fill();
      // Espejos (rotos)
      X.fillStyle='#0a0a15';X.fillRect(o+130,o+150,90,120);X.fillRect(o+380,o+150,90,120);
      X.strokeStyle='#3a3a4a';X.lineWidth=2;X.strokeRect(o+130,o+150,90,120);X.strokeRect(o+380,o+150,90,120);
      X.strokeStyle='rgba(100,100,120,0.3)';X.beginPath();X.moveTo(o+140,o+160);X.lineTo(o+210,o+260);X.stroke();
      // Cubículos
      X.fillStyle='#151520';
      X.fillRect(o+550,o+100,60,400);X.fillRect(o+650,o+100,60,400);
      X.fillStyle='#1a1a28';X.fillRect(o+560,o+120,40,350);X.fillRect(o+660,o+120,40,350);
      // Suelo mojado
      X.fillStyle='rgba(20,20,40,0.4)';X.fillRect(o,o+450,w,106);
      X.fillStyle='rgba(40,40,80,0.1)';
      for(var i=0;i<5;i++)X.fillRect(o+100+i*130,o+460,80,30);
      break;
    case 8: // Almacén
      X.fillStyle='#0a0808';X.fillRect(o,o,w,h);
      // Cajas apiladas
      for(var i=0;i<4;i++)for(var j=0;j<3-i;j++){
        var bx2=o+80+i*180,by2=o+350-j*70;
        X.fillStyle=j%2===0?'#1a1510':'#151210';
        X.fillRect(bx2,by2,80,65);X.strokeStyle='#2a2520';X.lineWidth=1;X.strokeRect(bx2,by2,80,65);
      }
      // Estantes al fondo
      X.fillStyle='#1a1515';X.fillRect(o+500,o+80,250,420);
      X.strokeStyle='#2a2020';X.lineWidth=2;X.strokeRect(o+500,o+80,250,420);
      for(var i=0;i<5;i++)X.fillRect(o+505,o+80+i*84,240,3);
      // Bombilla colgante
      X.strokeStyle='#333';X.lineWidth=1;X.beginPath();X.moveTo(o+350,o);X.lineTo(o+350,o+80);X.stroke();
      X.fillStyle='rgba(255,200,100,0.6)';X.beginPath();X.arc(o+350,o+85,5,0,Math.PI*2);X.fill();
      X.fillStyle='rgba(255,200,100,0.02)';X.beginPath();X.arc(o+350,o+85,120,0,Math.PI*2);X.fill();
      break;
    case 9: // Conductos
      X.fillStyle='#080a08';X.fillRect(o,o,w,h);
      // Tubos metálicos
      X.fillStyle='#1a1a1a';
      X.fillRect(o,o+200,w,120);X.fillRect(o,o+380,w,120);
      X.strokeStyle='#2a2a2a';X.lineWidth=3;
      X.strokeRect(o,o+200,w,120);X.strokeRect(o,o+380,w,120);
      // Remaches
      X.fillStyle='#333';
      for(var i=0;i<12;i++){X.beginPath();X.arc(o+50+i*65,o+210,3,0,Math.PI*2);X.fill();}
      for(var i=0;i<12;i++){X.beginPath();X.arc(o+50+i*65,o+390,3,0,Math.PI*2);X.fill();}
      // Rejillas
      X.strokeStyle='rgba(40,40,40,0.5)';X.lineWidth=1;
      for(var i=0;i<30;i++){X.beginPath();X.moveTo(o+i*27,o+200);X.lineTo(o+i*27,o+320);X.stroke();}
      for(var i=0;i<30;i++){X.beginPath();X.moveTo(o+i*27,o+380);X.lineTo(o+i*27,o+500);X.stroke();}
      // Oscuridad arriba y abajo
      X.fillStyle='#040604';X.fillRect(o,o,w,200);X.fillRect(o,o+500,w,56);
      break;
    case 10: // Sótano
      X.fillStyle='#050305';X.fillRect(o,o,w,h);
      // Escaleras
      X.fillStyle='#0a0808';
      for(var i=0;i<8;i++)X.fillRect(o+50,o+50+i*40,200,35);
      X.strokeStyle='#1a1515';X.lineWidth=1;
      for(var i=0;i<8;i++)X.strokeRect(o+50,o+50+i*40,200,35);
      // Calderas/tuberías
      X.fillStyle='#1a1515';X.beginPath();X.arc(o+500,o+350,60,0,Math.PI*2);X.fill();
      X.strokeStyle='#2a2020';X.lineWidth=3;X.beginPath();X.arc(o+500,o+350,60,0,Math.PI*2);X.stroke();
      X.fillStyle='#222';X.fillRect(o+480,o+250,40,40);
      // Tuberías
      X.strokeStyle='#2a2020';X.lineWidth=6;
      X.beginPath();X.moveTo(o+500,o+290);X.lineTo(o+500,o+100);X.lineTo(o+700,o+100);X.stroke();
      X.beginPath();X.moveTo(o+560,o+350);X.lineTo(o+750,o+350);X.lineTo(o+750,o+500);X.stroke();
      // Suelo húmedo
      X.fillStyle='rgba(10,15,10,0.5)';X.fillRect(o,o+450,w,106);
      X.fillStyle='rgba(20,40,20,0.1)';
      for(var i=0;i<4;i++)X.fillRect(o+150+i*150,o+460,60,20);
      break;
    case 11: // Entrada
      X.fillStyle='#060410';X.fillRect(o,o,w,h);
      // Puerta principal grande
      X.fillStyle='#1a1020';X.fillRect(o+280,o+80,220,420);
      X.strokeStyle='#3a2545';X.lineWidth=5;X.strokeRect(o+280,o+80,220,420);
      // Ventanilla en puerta
      X.fillStyle='#030015';X.fillRect(o+340,o+120,100,60);
      X.strokeStyle='#2a2a3a';X.lineWidth=2;X.strokeRect(o+340,o+120,100,60);
      // Cartel "NIGHTMARE TIME"
      X.fillStyle='#1a1020';X.fillRect(o+310,o+30,160,35);
      X.fillStyle='#a855f7';X.font='bold 14px Segoe UI';X.textAlign='center';
      X.fillText('NIGHTMARE TIME',o+390,o+53);
      // Paredes laterales
      X.fillStyle='#0a0815';X.fillRect(o,o,280,h);X.fillRect(o+500,o,286,h);
      // Plantas muertas
      X.fillStyle='#1a2a1a';X.fillRect(o+100,o+350,30,150);
      X.fillStyle='#0a1a0a';X.beginPath();X.arc(o+115,o+340,20,0,Math.PI*2);X.fill();
      X.fillStyle='#1a2a1a';X.fillRect(o+620,o+370,30,130);
      X.fillStyle='#0a1a0a';X.beginPath();X.arc(o+635,o+360,18,0,Math.PI*2);X.fill();
      // Suelo
      X.fillStyle='#080510';X.fillRect(o,o+480,w,76);
      // Baldosas
      X.strokeStyle='rgba(20,10,30,0.4)';X.lineWidth=1;
      for(var i=0;i<12;i++)X.strokeRect(o+i*66,o+480,65,76);
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

// Personajes cargados desde characters.js

// ========== LOOP ==========
let lt=performance.now();
(function loop(now){
  const dt=Math.min((now-lt)/1000,0.1);lt=now;
  update(dt);render();
  requestAnimationFrame(loop);
})(lt);
