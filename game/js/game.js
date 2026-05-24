// ============================================================
// NIGHTMARE TIME - Five Nights at the Tree House
// FNAF-style con vista primera persona, cámaras funcionales,
// animatrónicos visibles y progresión de noches guardada
// ============================================================

const W = 1280, H = 720;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;

// ===== ESTADO GLOBAL =====
let scene = 'menu'; // menu, game, gameover, win
let night = 1;
let maxNightUnlocked = parseInt(localStorage.getItem('nt_maxNight') || '1');
let hour = 0; // 0=12AM ... 6=6AM
let hourTimer = 0;
const HOUR_DURATION = 55; // segundos por hora
let power = 100;
let gameTime = 0;

// Oficina
let lookAngle = 0; // -1 izq, 0 centro, 1 der (smooth)
let targetLook = 0;
let mouseX = W / 2;

// Cámaras
let cameraOpen = false;
let currentCam = 0;
let camStaticTimer = 0;

// Puertas y luces
let doorLeft = false, doorRight = false;
let lightLeft = false, lightRight = false;

// Animatrónicos
let enemies = [];

// Input
let keys = {};
let mouseDown = false;
let clickX = 0, clickY = 0;
let justClicked = false;

// ===== CÁMARAS - MAPA =====
const cams = [
  { id: 0, name: 'Escenario', x: 380, y: 80, w: 120, h: 60 },
  { id: 1, name: 'Comedor', x: 380, y: 180, w: 120, h: 60 },
  { id: 2, name: 'Cocina', x: 200, y: 180, w: 100, h: 60 },
  { id: 3, name: 'Pasillo Izq', x: 150, y: 300, w: 100, h: 60 },
  { id: 4, name: 'Pasillo Der', x: 620, y: 300, w: 100, h: 60 },
  { id: 5, name: 'Esquina Izq', x: 150, y: 420, w: 100, h: 60 },
  { id: 6, name: 'Esquina Der', x: 620, y: 420, w: 100, h: 60 }
];
// Conexiones para el mapa visual
const camLinks = [[0,1],[1,2],[1,3],[1,4],[3,5],[4,6]];

// ===== DIFICULTAD POR NOCHE =====
const nightData = [
  null, // noche 0 no existe
  { finn: 2, jake: 0, chicle: 0, rey: 0 },
  { finn: 4, jake: 2, chicle: 0, rey: 0 },
  { finn: 6, jake: 4, chicle: 3, rey: 1 },
  { finn: 9, jake: 6, chicle: 5, rey: 4 },
  { finn: 13, jake: 10, chicle: 8, rey: 7 },
  { finn: 17, jake: 14, chicle: 12, rey: 11 }
];

// Rutas de cada animatrónico (índices de cámaras, último = puerta)
const routes = {
  finn:   [0, 1, 3, 5, 'doorL'],
  jake:   [0, 1, 4, 6, 'doorR'],
  chicle: [0, 2, 3, 5, 'doorL'],
  rey:    [0, 1, 4, 6, 'doorR']
};

// ===== FUNCIONES DE ANIMATRÓNICOS =====
function createEnemy(id, name, aggr, route) {
  return {
    id, name, aggr,
    route: route,
    pos: 0, // posición en la ruta
    moveTimer: 0,
    moveInterval: Math.max(4, 22 - aggr * 1.2),
    atDoor: false,
    doorSide: route[route.length - 1] === 'doorL' ? 'left' : 'right',
    attackTimer: 0,
    attackTime: Math.max(4, 16 - aggr),
    active: aggr > 0
  };
}

function initEnemies() {
  const d = nightData[night] || nightData[5];
  enemies = [
    createEnemy('finn', 'Finn Corrupto', d.finn, routes.finn),
    createEnemy('jake', 'Jake Retorcido', d.jake, routes.jake),
    createEnemy('chicle', 'Princesa Chicle', d.chicle, routes.chicle),
    createEnemy('rey', 'Rey Hielo', d.rey, routes.rey)
  ];
}

// ===== INPUT =====
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width * W;
});
canvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  clickX = (e.clientX - rect.left) / rect.width * W;
  clickY = (e.clientY - rect.top) / rect.height * H;
  justClicked = true;
});
canvas.addEventListener('mouseup', () => { mouseDown = false; lightLeft = false; lightRight = false; });
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ===== INICIAR NOCHE =====
function startNight(n) {
  night = n;
  scene = 'game';
  hour = 0; hourTimer = 0;
  power = 100; gameTime = 0;
  cameraOpen = false; currentCam = 0;
  doorLeft = false; doorRight = false;
  lightLeft = false; lightRight = false;
  lookAngle = 0; targetLook = 0;
  camStaticTimer = 0.5;
  initEnemies();
}

// ===== UPDATE =====
function update(dt) {
  gameTime += dt;

  if (scene === 'menu' || scene === 'gameover' || scene === 'win') {
    if (justClicked) handleMenuClick();
    justClicked = false;
    return;
  }
  if (scene !== 'game') return;

  // Hora
  hourTimer += dt;
  if (hourTimer >= HOUR_DURATION) { hourTimer = 0; hour++; }
  if (hour >= 6) { winNight(); justClicked = false; return; }

  // Energía
  let drain = 0.08;
  if (cameraOpen) drain += 0.1;
  if (doorLeft) drain += 0.07;
  if (doorRight) drain += 0.07;
  if (lightLeft) drain += 0.06;
  if (lightRight) drain += 0.06;
  power -= drain * dt;
  if (power <= 0) { power = 0; doorLeft = false; doorRight = false; cameraOpen = false; }

  // Mirar oficina (mouse controla la vista)
  if (!cameraOpen) {
    if (mouseX < W * 0.25) targetLook = -1;
    else if (mouseX > W * 0.75) targetLook = 1;
    else targetLook = 0;
    lookAngle += (targetLook - lookAngle) * dt * 5;
  }

  // Static de cámara
  if (camStaticTimer > 0) camStaticTimer -= dt;

  // Clicks en juego
  if (justClicked) handleGameClick();
  justClicked = false;

  // Actualizar animatrónicos
  enemies.forEach(e => updateEnemy(e, dt));

  // Power out = game over después de unos segundos
  if (power <= 0) {
    gameTime += dt;
    if (gameTime > 999) { /* ya se maneja arriba */ }
    // Buscar enemigo activo para atacar
    const attacker = enemies.find(e => e.active);
    if (attacker) { attacker.attackTimer += dt * 2; if (attacker.attackTimer > 3) gameOver(attacker); }
  }
}

function updateEnemy(e, dt) {
  if (!e.active || e.atDoor) {
    if (e.atDoor) {
      const blocked = e.doorSide === 'left' ? doorLeft : doorRight;
      if (blocked) {
        e.attackTimer += dt;
        if (e.attackTimer > e.attackTime * 1.5) {
          e.atDoor = false; e.pos = Math.max(0, e.pos - 2); e.attackTimer = 0;
        }
      } else {
        e.attackTimer += dt;
        if (e.attackTimer >= e.attackTime) gameOver(e);
      }
    }
    return;
  }
  e.moveTimer += dt;
  if (e.moveTimer >= e.moveInterval) {
    e.moveTimer = 0;
    if (Math.random() * 20 < e.aggr) {
      e.pos++;
      if (e.pos >= e.route.length - 1) { e.atDoor = true; e.attackTimer = 0; }
      camStaticTimer = 0.3;
    }
  }
}

function gameOver(enemy) {
  scene = 'gameover';
  // Guardar quién te mató para el jumpscare
  window._killer = enemy;
}

function winNight() {
  scene = 'win';
  if (night >= maxNightUnlocked) {
    maxNightUnlocked = night + 1;
    localStorage.setItem('nt_maxNight', maxNightUnlocked.toString());
  }
}

// ===== CLICKS =====
function handleMenuClick() {
  // Botón "Jugar" en menú
  if (scene === 'menu') {
    if (clickY > 350 && clickY < 410) { startNight(maxNightUnlocked > 6 ? 6 : maxNightUnlocked); }
    // Noches individuales (solo desbloqueadas)
    for (let i = 0; i < 6; i++) {
      const bx = 240 + i * 140, by = 460, bw = 120, bh = 50;
      if (clickX > bx && clickX < bx + bw && clickY > by && clickY < by + bh) {
        if (i + 1 <= maxNightUnlocked) startNight(i + 1);
      }
    }
  }
  if (scene === 'gameover' || scene === 'win') {
    if (clickY > 500) {
      if (scene === 'win' && night < 6) startNight(night + 1);
      else scene = 'menu';
    }
  }
}

function handleGameClick() {
  if (power <= 0) return;

  // Botón cámara (abajo centro)
  if (clickY > H - 80 && clickX > W / 2 - 100 && clickX < W / 2 + 100) {
    cameraOpen = !cameraOpen;
    camStaticTimer = 0.4;
    return;
  }

  if (cameraOpen) {
    // Click en cámaras del mapa
    cams.forEach((cam, i) => {
      const mx = cam.x + 430, my = cam.y + 50; // offset del panel
      if (clickX > mx && clickX < mx + cam.w && clickY > my && clickY < my + cam.h) {
        if (currentCam !== i) camStaticTimer = 0.3;
        currentCam = i;
      }
    });
    return;
  }

  // Puerta izquierda (zona izquierda de pantalla)
  if (clickX < 120 && clickY > 200 && clickY < 500) {
    doorLeft = !doorLeft;
    return;
  }
  // Puerta derecha
  if (clickX > W - 120 && clickY > 200 && clickY < 500) {
    doorRight = !doorRight;
    return;
  }
  // Luz izquierda
  if (clickX < 120 && clickY > 500) { lightLeft = true; return; }
  // Luz derecha
  if (clickX > W - 120 && clickY > 500) { lightRight = true; return; }
}

// ===== RENDER =====
function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  switch (scene) {
    case 'menu': renderMenu(); break;
    case 'game':
      if (cameraOpen) renderCameras();
      else renderOffice();
      renderHUD();
      break;
    case 'gameover': renderGameOver(); break;
    case 'win': renderWin(); break;
  }
}

// ===== MENÚ =====
function renderMenu() {
  // Fondo
  ctx.fillStyle = '#0a0515';
  ctx.fillRect(0, 0, W, H);
  // Efecto de ojos en el fondo
  for (let i = 0; i < 8; i++) {
    const ex = 100 + i * 150, ey = 100 + Math.sin(gameTime + i) * 20;
    ctx.fillStyle = `rgba(255, 0, 150, ${0.1 + Math.sin(gameTime * 0.5 + i) * 0.05})`;
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Título
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 64px Courier New';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 20;
  ctx.fillText('NIGHTMARE TIME', W / 2, 200);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#666';
  ctx.font = '18px Courier New';
  ctx.fillText('Five Nights at the Tree House', W / 2, 250);

  // Botón jugar
  ctx.fillStyle = '#1a0a30';
  ctx.fillRect(W / 2 - 120, 350, 240, 55);
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 120, 350, 240, 55);
  ctx.fillStyle = '#d4b0ff';
  ctx.font = 'bold 20px Courier New';
  ctx.fillText(`JUGAR (Noche ${Math.min(maxNightUnlocked, 6)})`, W / 2, 385);

  // Selector de noches
  ctx.fillStyle = '#888';
  ctx.font = '14px Courier New';
  ctx.fillText('Seleccionar noche:', W / 2, 445);
  for (let i = 0; i < 6; i++) {
    const bx = 240 + i * 140, by = 460, bw = 120, bh = 50;
    const unlocked = i + 1 <= maxNightUnlocked;
    ctx.fillStyle = unlocked ? '#1a0a30' : '#0a0a0a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = unlocked ? '#7c3aed' : '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = unlocked ? '#d4b0ff' : '#444';
    ctx.font = '14px Courier New';
    ctx.fillText(unlocked ? `Noche ${i + 1}` : '🔒', bx + bw / 2, by + 30);
  }

  // Instrucciones
  ctx.fillStyle = '#555';
  ctx.font = '12px Courier New';
  ctx.fillText('Ratón: mirar | Click izq/der: puertas | Click abajo: luces | Centro abajo: cámaras', W / 2, H - 30);
}

// ===== OFICINA (PRIMERA PERSONA) =====
function renderOffice() {
  const off = lookAngle * 200; // parallax

  // Techo
  ctx.fillStyle = '#0a0515';
  ctx.fillRect(0, 0, W, 120);

  // Pared de fondo
  ctx.fillStyle = '#120820';
  ctx.fillRect(0, 80, W, 440);

  // Ventana central (se ve la luna)
  ctx.fillStyle = '#050015';
  ctx.fillRect(440 + off, 120, 400, 220);
  ctx.strokeStyle = '#2a1545'; ctx.lineWidth = 4;
  ctx.strokeRect(440 + off, 120, 400, 220);
  ctx.fillStyle = '#1a0a40';
  ctx.beginPath(); ctx.arc(640 + off, 200, 35, 0, Math.PI * 2); ctx.fill();

  // Poster Finn & Jake corrupto (izquierda)
  ctx.fillStyle = '#1a2a4a';
  ctx.fillRect(150 + off, 140, 120, 160);
  ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 2;
  ctx.strokeRect(150 + off, 140, 120, 160);
  ctx.fillStyle = '#aaa'; ctx.font = '11px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('FINN & JAKE', 210 + off, 200);
  ctx.fillStyle = '#f44'; ctx.fillText('CORRUPTOS', 210 + off, 220);
  // Mini dibujo
  drawMiniChar(ctx, 190 + off, 260, 'finn', 0.4);
  drawMiniChar(ctx, 225 + off, 265, 'jake', 0.35);

  // Poster Rey Hielo (derecha)
  ctx.fillStyle = '#1a3a5a';
  ctx.fillRect(1000 + off, 150, 100, 140);
  ctx.strokeStyle = '#3a5a7a'; ctx.lineWidth = 2;
  ctx.strokeRect(1000 + off, 150, 100, 140);
  drawMiniChar(ctx, 1050 + off, 240, 'rey', 0.4);

  // Mesa/escritorio
  ctx.fillStyle = '#1a0a25';
  ctx.fillRect(200 + off, 480, 880, 25);
  ctx.fillStyle = '#0f0818';
  ctx.fillRect(250 + off, 505, 780, 180);

  // Monitor apagado en la mesa
  ctx.fillStyle = '#111';
  ctx.fillRect(530 + off, 410, 220, 70);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.strokeRect(530 + off, 410, 220, 70);
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(535 + off, 415, 210, 60);
  ctx.fillStyle = '#1a3a1a'; ctx.font = '10px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('CÁMARAS', 640 + off, 450);

  // Suelo
  ctx.fillStyle = '#080510';
  ctx.fillRect(0, 600, W, 120);
  // Baldosas
  ctx.strokeStyle = '#1a1025'; ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.moveTo(i * 70 + off * 0.5, 600); ctx.lineTo(i * 70 + off * 0.3, 720); ctx.stroke(); }

  // === PUERTA IZQUIERDA ===
  ctx.fillStyle = doorLeft ? '#2a0505' : '#1a1025';
  ctx.fillRect(0, 130, 90 + off * 0.3, 470);
  ctx.strokeStyle = doorLeft ? '#ff2222' : '#3a2050';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 130, 90 + off * 0.3, 470);
  // Texto puerta
  ctx.save(); ctx.translate(45, 360); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = doorLeft ? '#ff4444' : '#8866aa';
  ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(doorLeft ? '🚫 CERRADA' : '🚪 PUERTA', 0, 0);
  ctx.restore();

  // === PUERTA DERECHA ===
  ctx.fillStyle = doorRight ? '#2a0505' : '#1a1025';
  ctx.fillRect(W - 90 + off * 0.3, 130, 90, 470);
  ctx.strokeStyle = doorRight ? '#ff2222' : '#3a2050';
  ctx.lineWidth = 3;
  ctx.strokeRect(W - 90 + off * 0.3, 130, 90, 470);
  ctx.save(); ctx.translate(W - 45, 360); ctx.rotate(Math.PI / 2);
  ctx.fillStyle = doorRight ? '#ff4444' : '#8866aa';
  ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(doorRight ? '🚫 CERRADA' : '🚪 PUERTA', 0, 0);
  ctx.restore();

  // === LUZ IZQUIERDA ===
  if (lightLeft) {
    ctx.fillStyle = 'rgba(255,255,180,0.08)';
    ctx.fillRect(0, 130, 200, 470);
    // Mostrar enemigo si está en puerta izquierda
    const atLeft = enemies.find(e => e.atDoor && e.doorSide === 'left');
    if (atLeft) {
      drawAnimatronic(ctx, atLeft.id, 70, 250, 2.2);
    }
  }
  // Botón luz izq
  ctx.fillStyle = lightLeft ? '#443300' : '#1a1025';
  ctx.fillRect(10, 610, 80, 40);
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(10, 610, 80, 40);
  ctx.fillStyle = '#aaa'; ctx.font = '11px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('💡 LUZ', 50, 635);

  // === LUZ DERECHA ===
  if (lightRight) {
    ctx.fillStyle = 'rgba(255,255,180,0.08)';
    ctx.fillRect(W - 200, 130, 200, 470);
    const atRight = enemies.find(e => e.atDoor && e.doorSide === 'right');
    if (atRight) {
      drawAnimatronic(ctx, atRight.id, W - 130, 250, 2.2);
    }
  }
  // Botón luz der
  ctx.fillStyle = lightRight ? '#443300' : '#1a1025';
  ctx.fillRect(W - 90, 610, 80, 40);
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(W - 90, 610, 80, 40);
  ctx.fillStyle = '#aaa'; ctx.font = '11px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('💡 LUZ', W - 50, 635);

  // Botón CÁMARAS (abajo centro)
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(W / 2 - 90, H - 65, 180, 50);
  ctx.strokeStyle = '#2a6a2a'; ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 90, H - 65, 180, 50);
  ctx.fillStyle = '#4f4'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('📹 CÁMARAS', W / 2, H - 35);

  // Oscuridad ambiental
  const grd = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 700);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

// ===== CÁMARAS =====
function renderCameras() {
  // Fondo oscuro
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  // Feed de la cámara seleccionada (lado izquierdo)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(20, 20, 780, 540);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 780, 540);

  // Dibujar habitación de la cámara
  renderCamRoom(currentCam);

  // Dibujar animatrónicos en esta cámara
  enemies.forEach(e => {
    if (!e.active || e.atDoor) return;
    const camIdx = e.route[e.pos];
    if (typeof camIdx === 'number' && camIdx === currentCam) {
      const ex = 200 + enemies.indexOf(e) * 150;
      drawAnimatronic(ctx, e.id, ex, 320, 2.5);
      // Nombre debajo
      ctx.fillStyle = '#f44';
      ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
      ctx.fillText(e.name, ex, 440);
    }
  });

  // Static
  if (camStaticTimer > 0) {
    ctx.fillStyle = `rgba(100,100,100,${camStaticTimer})`;
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(20 + Math.random() * 780, 20 + Math.random() * 540, Math.random() * 30, 2);
    }
  }

  // Líneas de escaneo
  ctx.strokeStyle = 'rgba(0,255,0,0.02)'; ctx.lineWidth = 1;
  for (let i = 0; i < 540; i += 3) {
    ctx.beginPath(); ctx.moveTo(20, 20 + i); ctx.lineTo(800, 20 + i); ctx.stroke();
  }

  // REC
  ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(60, 45, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f00'; ctx.font = '12px Courier New'; ctx.textAlign = 'left';
  ctx.fillText('REC', 72, 50);

  // Nombre de cámara
  ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'left';
  ctx.fillText(`CAM ${currentCam + 1} - ${cams[currentCam].name}`, 60, 545);

  // === MAPA DE CÁMARAS (lado derecho) ===
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(820, 20, 440, 540);
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
  ctx.strokeRect(820, 20, 440, 540);

  ctx.fillStyle = '#0f0'; ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('MAPA', 1040, 45);

  // Dibujar conexiones
  ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 2;
  camLinks.forEach(([a, b]) => {
    const ca = cams[a], cb = cams[b];
    ctx.beginPath();
    ctx.moveTo(ca.x + 430 + ca.w / 2, ca.y + 50 + ca.h / 2);
    ctx.lineTo(cb.x + 430 + cb.w / 2, cb.y + 50 + cb.h / 2);
    ctx.stroke();
  });

  // Dibujar cámaras en el mapa
  cams.forEach((cam, i) => {
    const cx = cam.x + 430, cy = cam.y + 50;
    const selected = i === currentCam;
    // Fondo
    ctx.fillStyle = selected ? '#0a2a0a' : '#0a0a0a';
    ctx.fillRect(cx, cy, cam.w, cam.h);
    ctx.strokeStyle = selected ? '#0f0' : '#2a2a2a';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(cx, cy, cam.w, cam.h);
    // Nombre
    ctx.fillStyle = selected ? '#0f0' : '#555';
    ctx.font = '10px Courier New'; ctx.textAlign = 'center';
    ctx.fillText(cam.name, cx + cam.w / 2, cy + cam.h / 2 + 4);

    // Indicar enemigos presentes
    enemies.forEach(e => {
      if (!e.active || e.atDoor) return;
      if (typeof e.route[e.pos] === 'number' && e.route[e.pos] === i) {
        ctx.fillStyle = '#f00';
        ctx.beginPath(); ctx.arc(cx + cam.w - 10, cy + 10, 5, 0, Math.PI * 2); ctx.fill();
      }
    });
  });

  // Oficina en el mapa
  ctx.fillStyle = '#1a1a0a';
  ctx.fillRect(880, 500, 140, 45);
  ctx.strokeStyle = '#4a4a0a'; ctx.lineWidth = 2;
  ctx.strokeRect(880, 500, 140, 45);
  ctx.fillStyle = '#aa8'; ctx.font = '11px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('TU OFICINA', 950, 527);
  // Conexiones a oficina
  ctx.strokeStyle = '#2a2a0a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cams[5].x+430+cams[5].w/2, cams[5].y+50+cams[5].h); ctx.lineTo(900, 500); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cams[6].x+430+cams[6].w/2, cams[6].y+50+cams[6].h); ctx.lineTo(1000, 500); ctx.stroke();

  // Botón CERRAR CÁMARAS
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(W / 2 - 100, H - 65, 200, 50);
  ctx.strokeStyle = '#6a2a2a'; ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 100, H - 65, 200, 50);
  ctx.fillStyle = '#f66'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('❌ CERRAR', W / 2, H - 35);
}

function renderCamRoom(camIdx) {
  ctx.save();
  ctx.beginPath(); ctx.rect(22, 22, 776, 536); ctx.clip();
  const ox = 22, oy = 22;
  switch (camIdx) {
    case 0: // Escenario
      ctx.fillStyle = '#0f0818'; ctx.fillRect(ox, oy, 776, 536);
      // Escenario con cortinas
      ctx.fillStyle = '#3a0a2a'; ctx.fillRect(ox+100, oy+50, 576, 350);
      ctx.fillStyle = '#5a1040';
      ctx.fillRect(ox+100, oy+50, 60, 350); ctx.fillRect(ox+616, oy+50, 60, 350);
      // Estrellas decorativas
      ctx.fillStyle = '#ff0'; ctx.font = '20px serif'; ctx.textAlign = 'center';
      ctx.fillText('★', ox+250, oy+100); ctx.fillText('★', ox+500, oy+100);
      break;
    case 1: // Comedor
      ctx.fillStyle = '#0a0812'; ctx.fillRect(ox, oy, 776, 536);
      // Mesas
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(ox+100, oy+250, 150, 80);
      ctx.fillRect(ox+400, oy+280, 150, 80);
      ctx.fillRect(ox+600, oy+240, 120, 80);
      // Sillas
      ctx.fillStyle = '#150a1a';
      for (let i = 0; i < 6; i++) ctx.fillRect(ox+80+i*120, oy+340, 30, 50);
      break;
    case 2: // Cocina
      ctx.fillStyle = '#120810'; ctx.fillRect(ox, oy, 776, 536);
      // Encimera
      ctx.fillStyle = '#2a1a2a'; ctx.fillRect(ox+50, oy+300, 680, 30);
      // Nevera
      ctx.fillStyle = '#333'; ctx.fillRect(ox+600, oy+100, 100, 280);
      ctx.strokeStyle = '#555'; ctx.strokeRect(ox+600, oy+100, 100, 280);
      // Ollas
      ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(ox+200, oy+290, 20, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(ox+300, oy+285, 25, Math.PI, 0); ctx.fill();
      break;
    case 3: // Pasillo izq
      ctx.fillStyle = '#080510'; ctx.fillRect(ox, oy, 776, 536);
      // Paredes del pasillo
      ctx.fillStyle = '#100818'; ctx.fillRect(ox+200, oy, 376, 536);
      // Cuadros en la pared
      ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2;
      ctx.strokeRect(ox+280, oy+100, 60, 80);
      ctx.strokeRect(ox+420, oy+120, 50, 70);
      // Luz tenue
      ctx.fillStyle = 'rgba(100,50,150,0.05)';
      ctx.fillRect(ox+300, oy+200, 200, 300);
      break;
    case 4: // Pasillo der
      ctx.fillStyle = '#080510'; ctx.fillRect(ox, oy, 776, 536);
      ctx.fillStyle = '#100818'; ctx.fillRect(ox+200, oy, 376, 536);
      ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2;
      ctx.strokeRect(ox+300, oy+80, 70, 90);
      ctx.strokeRect(ox+450, oy+100, 55, 75);
      break;
    case 5: // Esquina izq (cerca de tu puerta)
      ctx.fillStyle = '#060408'; ctx.fillRect(ox, oy, 776, 536);
      ctx.fillStyle = '#0a0610';
      ctx.fillRect(ox+250, oy+50, 300, 450);
      // Puerta visible al fondo
      ctx.fillStyle = '#1a0a1a'; ctx.fillRect(ox+350, oy+150, 100, 250);
      ctx.strokeStyle = '#3a1a4a'; ctx.strokeRect(ox+350, oy+150, 100, 250);
      ctx.fillStyle = '#666'; ctx.font = '10px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('→ OFICINA', ox+400, oy+420);
      break;
    case 6: // Esquina der
      ctx.fillStyle = '#060408'; ctx.fillRect(ox, oy, 776, 536);
      ctx.fillStyle = '#0a0610';
      ctx.fillRect(ox+250, oy+50, 300, 450);
      ctx.fillStyle = '#1a0a1a'; ctx.fillRect(ox+350, oy+150, 100, 250);
      ctx.strokeStyle = '#3a1a4a'; ctx.strokeRect(ox+350, oy+150, 100, 250);
      ctx.fillStyle = '#666'; ctx.font = '10px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('→ OFICINA', ox+400, oy+420);
      break;
  }
  ctx.restore();
}

// ===== HUD =====
function renderHUD() {
  const hours = ['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'];
  // Hora (arriba derecha)
  ctx.fillStyle = '#ddd'; ctx.font = 'bold 28px Courier New'; ctx.textAlign = 'right';
  ctx.fillText(hours[hour], W - 30, 40);
  // Noche
  ctx.fillStyle = '#aaa'; ctx.font = '16px Courier New'; ctx.textAlign = 'left';
  ctx.fillText(`Noche ${night}`, 30, 35);
  // Energía
  ctx.fillStyle = power > 30 ? '#4f4' : power > 15 ? '#ff0' : '#f44';
  ctx.font = 'bold 18px Courier New'; ctx.textAlign = 'left';
  ctx.fillText(`Energía: ${Math.round(power)}%`, 30, 65);
  // Barra de energía
  ctx.fillStyle = '#111'; ctx.fillRect(30, 72, 200, 8);
  ctx.fillStyle = power > 30 ? '#2a6a2a' : power > 15 ? '#6a6a0a' : '#6a1a1a';
  ctx.fillRect(30, 72, power * 2, 8);
}

// ===== GAME OVER =====
function renderGameOver() {
  ctx.fillStyle = '#0a0000'; ctx.fillRect(0, 0, W, H);
  // Jumpscare del enemigo
  const killer = window._killer;
  if (killer) {
    drawAnimatronic(ctx, killer.id, W / 2, 280, 5);
    ctx.fillStyle = 'rgba(255,0,0,0.15)'; ctx.fillRect(0, 0, W, H);
  }
  // Static
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.1})`;
    ctx.fillRect(Math.random()*W, Math.random()*H, Math.random()*20, 2);
  }
  ctx.fillStyle = '#f00'; ctx.font = 'bold 60px Courier New'; ctx.textAlign = 'center';
  ctx.shadowColor = '#f00'; ctx.shadowBlur = 20;
  ctx.fillText('GAME OVER', W / 2, 520);
  ctx.shadowBlur = 0;
  if (killer) {
    ctx.fillStyle = '#a00'; ctx.font = '20px Courier New';
    ctx.fillText(`${killer.name} te atrapó`, W / 2, 570);
  }
  ctx.fillStyle = '#888'; ctx.font = '16px Courier New';
  ctx.fillText('Click para continuar', W / 2, 650);
}

// ===== WIN =====
function renderWin() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4f4'; ctx.font = 'bold 80px Courier New'; ctx.textAlign = 'center';
  ctx.shadowColor = '#4f4'; ctx.shadowBlur = 30;
  ctx.fillText('6 AM', W / 2, 280);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#8f8'; ctx.font = '24px Courier New';
  ctx.fillText(`¡Has sobrevivido la Noche ${night}!`, W / 2, 360);
  if (night < 6) {
    ctx.fillStyle = '#aaa'; ctx.font = '16px Courier New';
    ctx.fillText('Click para siguiente noche', W / 2, 550);
  } else {
    ctx.fillStyle = '#ff0'; ctx.font = '20px Courier New';
    ctx.fillText('¡HAS COMPLETADO TODAS LAS NOCHES!', W / 2, 430);
    ctx.fillStyle = '#aaa'; ctx.font = '16px Courier New';
    ctx.fillText('Click para volver al menú', W / 2, 550);
  }
}

// ===== DIBUJAR ANIMATRÓNICOS =====
function drawAnimatronic(ctx, id, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (id) {
    case 'finn': drawFinn(ctx); break;
    case 'jake': drawJake(ctx); break;
    case 'chicle': drawChicle(ctx); break;
    case 'rey': drawRey(ctx); break;
  }
  ctx.restore();
}
function drawMiniChar(ctx, x, y, id, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (id) {
    case 'finn': drawFinn(ctx); break;
    case 'jake': drawJake(ctx); break;
    case 'chicle': drawChicle(ctx); break;
    case 'rey': drawRey(ctx); break;
  }
  ctx.restore();
}

function drawFinn(c) {
  // Cuerpo azul
  c.fillStyle = '#1a4a7a'; c.fillRect(-15, 5, 30, 45);
  // Shorts
  c.fillStyle = '#1a4a2a'; c.fillRect(-13, 46, 26, 16);
  // Piernas
  c.fillStyle = '#ddd'; c.fillRect(-10, 60, 8, 20); c.fillRect(2, 60, 8, 20);
  // Zapatos
  c.fillStyle = '#111'; c.fillRect(-11, 78, 10, 6); c.fillRect(1, 78, 10, 6);
  // Brazos
  c.fillStyle = '#ddd'; c.fillRect(-22, 10, 9, 30); c.fillRect(13, 10, 9, 30);
  // Gorro blanco
  c.fillStyle = '#f0f0f0';
  c.beginPath(); c.arc(0, -12, 20, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(-14, -28, 8, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(14, -28, 8, 0, Math.PI * 2); c.fill();
  // Cara
  c.fillStyle = '#ffddaa';
  c.beginPath(); c.arc(0, -7, 12, 0, Math.PI * 2); c.fill();
  // Ojos rojos
  c.fillStyle = '#ff0000'; c.shadowColor = '#ff0000'; c.shadowBlur = 8;
  c.beginPath(); c.arc(-4, -10, 3.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(4, -10, 3.5, 0, Math.PI * 2); c.fill();
  c.shadowBlur = 0;
  // Pupilas
  c.fillStyle = '#000';
  c.beginPath(); c.arc(-4, -10, 1.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(4, -10, 1.5, 0, Math.PI * 2); c.fill();
  // Sonrisa siniestra
  c.strokeStyle = '#440000'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, -2, 7, 0.2, Math.PI - 0.2); c.stroke();
  // Espada morada
  c.fillStyle = '#6a0dad'; c.fillRect(19, -5, 4, 45);
  c.fillStyle = '#9b30ff'; c.fillRect(16, -8, 10, 5);
  // Corrupción
  c.strokeStyle = 'rgba(150,0,200,0.4)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-8,10); c.lineTo(-12,40); c.moveTo(8,10); c.lineTo(12,42); c.stroke();
}

function drawJake(c) {
  // Cuerpo amarillo
  c.fillStyle = '#CC9900';
  c.beginPath(); c.ellipse(0, 20, 24, 18, 0, 0, Math.PI * 2); c.fill();
  // Cabeza
  c.fillStyle = '#DDAA00';
  c.beginPath(); c.arc(0, -10, 18, 0, Math.PI * 2); c.fill();
  // Hocico
  c.fillStyle = '#EECC44';
  c.beginPath(); c.ellipse(0, -3, 9, 6, 0, 0, Math.PI * 2); c.fill();
  // Ojos
  c.fillStyle = '#000';
  c.beginPath(); c.arc(-7, -14, 6, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(7, -14, 6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffff00'; c.shadowColor = '#ffff00'; c.shadowBlur = 6;
  c.beginPath(); c.arc(-7, -14, 3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(7, -14, 3, 0, Math.PI * 2); c.fill();
  c.shadowBlur = 0;
  // Sonrisa enorme
  c.strokeStyle = '#330000'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, -2, 11, 0.1, Math.PI - 0.1); c.stroke();
  c.fillStyle = '#fff';
  for (let i = -4; i <= 4; i++) c.fillRect(-9 + (i+4)*2.2, -2, 2, 4);
  // Orejas
  c.fillStyle = '#CC9900';
  c.beginPath(); c.ellipse(-13, -24, 5, 10, -0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(13, -24, 5, 10, 0.3, 0, Math.PI * 2); c.fill();
  // Patas
  c.fillRect(-18, 35, 8, 25); c.fillRect(-6, 35, 8, 22);
  c.fillRect(2, 35, 8, 24); c.fillRect(12, 35, 8, 20);
}

function drawChicle(c) {
  // Cuerpo rosa derretido
  c.fillStyle = '#CC3388';
  c.beginPath();
  c.moveTo(-18, 70); c.quadraticCurveTo(-20, 15, 0, -20);
  c.quadraticCurveTo(20, 15, 18, 70); c.closePath(); c.fill();
  // Goteo
  c.fillStyle = '#AA2266';
  for (let i = -2; i <= 2; i++) {
    c.beginPath(); c.ellipse(i*7, 75 + Math.abs(i)*4, 3, 8+Math.abs(i)*3, 0, 0, Math.PI*2); c.fill();
  }
  // Corona
  c.fillStyle = '#FFD700';
  c.beginPath();
  c.moveTo(-11,-24); c.lineTo(-9,-38); c.lineTo(-4,-28); c.lineTo(0,-42);
  c.lineTo(4,-28); c.lineTo(9,-38); c.lineTo(11,-24); c.closePath(); c.fill();
  c.fillStyle = '#ff00aa'; c.beginPath(); c.arc(0,-30, 3, 0, Math.PI*2); c.fill();
  // Cara
  c.fillStyle = '#ffccdd';
  c.beginPath(); c.arc(0, -5, 13, 0, Math.PI * 2); c.fill();
  // Ojos
  c.fillStyle = '#000';
  c.beginPath(); c.arc(-5, -8, 4.5, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(5, -6, 3.5, 0, Math.PI*2); c.fill();
  c.fillStyle = '#ff00ff'; c.shadowColor = '#ff00ff'; c.shadowBlur = 5;
  c.beginPath(); c.arc(-5, -8, 2, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(5, -6, 1.5, 0, Math.PI*2); c.fill();
  c.shadowBlur = 0;
  // Boca
  c.strokeStyle = '#660033'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-7, 2); c.quadraticCurveTo(0, 9, 7, 1); c.stroke();
}

function drawRey(c) {
  // Túnica
  c.fillStyle = '#1a3a6b';
  c.beginPath(); c.moveTo(-18, 15); c.lineTo(-22, 80); c.lineTo(22, 80); c.lineTo(18, 15); c.closePath(); c.fill();
  // Cuerpo
  c.fillStyle = '#4488cc';
  c.beginPath(); c.ellipse(0, 8, 16, 20, 0, 0, Math.PI*2); c.fill();
  // Cabeza
  c.fillStyle = '#6699cc';
  c.beginPath(); c.arc(0, -18, 16, 0, Math.PI*2); c.fill();
  // Corona
  c.fillStyle = '#FFD700';
  c.beginPath();
  c.moveTo(-11,-32); c.lineTo(-9,-44); c.lineTo(-4,-36); c.lineTo(0,-48);
  c.lineTo(4,-36); c.lineTo(9,-44); c.lineTo(11,-32); c.closePath(); c.fill();
  c.fillStyle = '#f00'; c.beginPath(); c.arc(0,-38, 3, 0, Math.PI*2); c.fill();
  // Nariz
  c.fillStyle = '#5588bb';
  c.beginPath(); c.moveTo(0,-16); c.lineTo(-3, 0); c.lineTo(3, 0); c.closePath(); c.fill();
  // Ojos
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(-6,-20, 4.5, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(6,-20, 4.5, 0, Math.PI*2); c.fill();
  c.fillStyle = '#00ccff'; c.shadowColor = '#00ccff'; c.shadowBlur = 6;
  c.beginPath(); c.arc(-6,-20, 2, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(6,-20, 2, 0, Math.PI*2); c.fill();
  c.shadowBlur = 0;
  // Barba
  c.fillStyle = '#ddeeff';
  c.beginPath(); c.moveTo(-10,-8); c.quadraticCurveTo(-7,12,-4,25);
  c.lineTo(4,25); c.quadraticCurveTo(7,12,10,-8); c.closePath(); c.fill();
  // Manos + bola hielo
  c.fillStyle = '#4488cc';
  c.beginPath(); c.arc(-20, 28, 7, 0, Math.PI*2); c.fill();
  c.beginPath(); c.arc(20, 28, 7, 0, Math.PI*2); c.fill();
  c.fillStyle = 'rgba(100,200,255,0.5)';
  c.beginPath(); c.arc(20, 22, 10, 0, Math.PI*2); c.fill();
}

// ===== GAME LOOP =====
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  update(dt);
  render();
  justClicked = false;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
