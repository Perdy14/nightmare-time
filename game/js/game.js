// ============================================
// NIGHTMARE TIME - Five Nights at the Tree House
// Estilo FNAF clásico con personajes de Adventure Time
// ============================================

const Game = {
  canvas: null, ctx: null,
  jumpCanvas: null, jumpCtx: null,
  running: false,
  night: 1,
  hour: 0, // 0=12AM, 1=1AM ... 5=5AM, 6=6AM (victoria)
  hourTimer: 0,
  hourDuration: 60, // segundos por hora (ajustable)
  power: 100,
  powerDrain: 0.1, // base drain per second
  cameraOpen: false,
  currentCam: 'cam1',
  doorLeft: false, doorRight: false,
  lightLeft: false, lightRight: false,
  gameOver: false,
  jumpscareActive: false,
  jumpscareTimer: 0,
  jumpscareEnemy: null,
  officeLookX: 0, // -1 izq, 0 centro, 1 der
  mouseX: 0,

  // Animatrónicos
  animatronics: {},

  // Cámaras y posiciones
  cameras: {
    cam1: { name: 'Entrada', enemies: [] },
    cam2: { name: 'Sala Principal', enemies: [] },
    cam3: { name: 'Cocina', enemies: [] },
    cam4: { name: 'Pasillo Izquierdo', enemies: [] },
    cam5: { name: 'Pasillo Derecho', enemies: [] },
    cam6: { name: 'Habitación de Finn', enemies: [] },
    cam7: { name: 'Conductos', enemies: [] }
  },

  // Rutas de cada animatrónico hacia la oficina
  routes: {
    finn:   ['cam6', 'cam2', 'cam4', 'door_left'],
    jake:   ['cam7', 'cam3', 'cam5', 'door_right'],
    chicle: ['cam2', 'cam3', 'cam4', 'door_left'],
    reyhielo: ['cam1', 'cam2', 'cam5', 'door_right']
  },

  // Dificultad por noche (agresividad 0-20 de cada animatrónico)
  nightDifficulty: {
    1: { finn: 3, jake: 0, chicle: 0, reyhielo: 0 },
    2: { finn: 5, jake: 2, chicle: 0, reyhielo: 0 },
    3: { finn: 7, jake: 4, chicle: 3, reyhielo: 2 },
    4: { finn: 10, jake: 6, chicle: 5, reyhielo: 4 },
    5: { finn: 14, jake: 10, chicle: 8, reyhielo: 7 },
    6: { finn: 18, jake: 15, chicle: 12, reyhielo: 12 }
  },

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.jumpCanvas = document.getElementById('jumpscareCanvas');
    this.jumpCtx = this.jumpCanvas.getContext('2d');

    // Mouse tracking para mirar oficina
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.offsetX / this.canvas.width;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.running) return;
      if (e.code === 'Space') this.toggleCamera();
      if (e.code === 'KeyQ') this.toggleDoor('left');
      if (e.code === 'KeyE') this.toggleDoor('right');
      if (e.code === 'KeyA') this.lightOn('left');
      if (e.code === 'KeyD') this.lightOn('right');
      if (e.code === 'Digit1') this.selectCam('cam1');
      if (e.code === 'Digit2') this.selectCam('cam2');
      if (e.code === 'Digit3') this.selectCam('cam3');
      if (e.code === 'Digit4') this.selectCam('cam4');
      if (e.code === 'Digit5') this.selectCam('cam5');
      if (e.code === 'Digit6') this.selectCam('cam6');
      if (e.code === 'Digit7') this.selectCam('cam7');
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') this.lightOff('left');
      if (e.code === 'KeyD') this.lightOff('right');
    });

    // Camera buttons
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectCam(btn.dataset.cam));
    });
  },

  showMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('night-select').classList.add('hidden');
    document.getElementById('jumpscare-overlay').classList.add('hidden');
    this.running = false;
  },

  showNightSelect() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('night-select').classList.remove('hidden');
    const container = document.getElementById('night-buttons');
    container.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      const btn = document.createElement('button');
      btn.textContent = i <= 5 ? `Noche ${i}` : 'Noche 6 (Pesadilla)';
      btn.onclick = () => { this.night = i; this.startNight(); };
      container.appendChild(btn);
    }
  },

  startNight() {
    // Ocultar menús
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('night-select').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('jumpscare-overlay').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('camera-panel').classList.add('hidden');

    // Reset estado
    this.hour = 0;
    this.hourTimer = 0;
    this.power = 100;
    this.cameraOpen = false;
    this.doorLeft = false;
    this.doorRight = false;
    this.lightLeft = false;
    this.lightRight = false;
    this.gameOver = false;
    this.jumpscareActive = false;
    this.officeLookX = 0;

    // Inicializar animatrónicos
    const diff = this.nightDifficulty[this.night] || this.nightDifficulty[5];
    this.animatronics = {
      finn: this.createAnimatronic('finn', 'Finn Corrupto', diff.finn),
      jake: this.createAnimatronic('jake', 'Jake Retorcido', diff.jake),
      chicle: this.createAnimatronic('chicle', 'Princesa Chicle', diff.chicle),
      reyhielo: this.createAnimatronic('reyhielo', 'Rey Hielo', diff.reyhielo)
    };

    // Actualizar HUD
    document.getElementById('hud-night').textContent = `Noche ${this.night}`;
    this.updateHUD();
    this.updateDoorButtons();

    // Iniciar loop
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  },

  createAnimatronic(id, name, aggression) {
    const route = this.routes[id];
    return {
      id, name, aggression,
      position: 0, // índice en la ruta (0 = inicio, último = en la puerta)
      moveTimer: 0,
      moveInterval: Math.max(3, 20 - aggression), // segundos entre movimientos
      atDoor: false,
      doorSide: route[route.length - 1] === 'door_left' ? 'left' : 'right',
      attackTimer: 0,
      attackDelay: Math.max(5, 15 - aggression), // tiempo en la puerta antes de atacar
      active: aggression > 0
    };
  },

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    if (this.running) requestAnimationFrame((t) => this.loop(t));
  },

  update(dt) {
    if (this.gameOver) return;

    // Jumpscare activo
    if (this.jumpscareActive) {
      this.jumpscareTimer -= dt;
      if (this.jumpscareTimer <= 0) {
        this.running = false;
        document.getElementById('jumpscare-overlay').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.remove('hidden');
        document.getElementById('gameover-text').textContent =
          `${this.jumpscareEnemy} te atrapó.`;
      }
      return;
    }

    // Tiempo
    this.hourTimer += dt;
    if (this.hourTimer >= this.hourDuration) {
      this.hourTimer = 0;
      this.hour++;
      if (this.hour >= 6) { this.winNight(); return; }
    }

    // Energía
    let drain = this.powerDrain;
    if (this.cameraOpen) drain += 0.08;
    if (this.doorLeft) drain += 0.06;
    if (this.doorRight) drain += 0.06;
    if (this.lightLeft) drain += 0.05;
    if (this.lightRight) drain += 0.05;
    this.power -= drain * dt;
    if (this.power <= 0) {
      this.power = 0;
      this.doorLeft = false; this.doorRight = false;
      this.lightLeft = false; this.lightRight = false;
      this.cameraOpen = false;
      // Sin energía: los animatrónicos atacan rápido
      this.triggerPowerOut();
      return;
    }

    // Mover animatrónicos
    Object.values(this.animatronics).forEach(a => this.updateAnimatronic(a, dt));

    // Mirar oficina con mouse
    if (!this.cameraOpen) {
      if (this.mouseX < 0.2) this.officeLookX = -1;
      else if (this.mouseX > 0.8) this.officeLookX = 1;
      else this.officeLookX = 0;
    }

    this.updateHUD();
  },

  updateAnimatronic(a, dt) {
    if (!a.active) return;
    const route = this.routes[a.id];

    if (a.atDoor) {
      // Está en la puerta, intentar atacar
      const doorClosed = a.doorSide === 'left' ? this.doorLeft : this.doorRight;
      if (doorClosed) {
        // Puerta cerrada: esperar y eventualmente irse
        a.attackTimer += dt;
        if (a.attackTimer > a.attackDelay * 2) {
          a.atDoor = false;
          a.position = Math.max(0, a.position - 2);
          a.attackTimer = 0;
        }
      } else {
        // Puerta abierta: atacar después de un delay
        a.attackTimer += dt;
        if (a.attackTimer >= a.attackDelay) {
          this.triggerJumpscare(a);
        }
      }
      return;
    }

    // Movimiento
    a.moveTimer += dt;
    if (a.moveTimer >= a.moveInterval) {
      a.moveTimer = 0;
      // Probabilidad de moverse basada en agresividad
      if (Math.random() * 20 < a.aggression) {
        a.position++;
        if (a.position >= route.length - 1) {
          // Llegó a la puerta
          a.atDoor = true;
          a.attackTimer = 0;
        }
      }
    }
  },

  triggerJumpscare(a) {
    this.jumpscareActive = true;
    this.jumpscareTimer = 2;
    this.jumpscareEnemy = a.name;
    this.gameOver = true;
    document.getElementById('jumpscare-overlay').classList.remove('hidden');
    this.renderJumpscare(a.id);
  },

  triggerPowerOut() {
    this.gameOver = true;
    // Después de 3 segundos sin energía, ataca el más cercano
    setTimeout(() => {
      if (!this.running) return;
      const closest = Object.values(this.animatronics).find(a => a.active) || this.animatronics.finn;
      this.triggerJumpscare(closest);
    }, 3000);
  },

  winNight() {
    this.running = false;
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.remove('hidden');
    document.getElementById('win-title').textContent = '6 AM';
    document.getElementById('win-text').textContent =
      `¡Has sobrevivido la Noche ${this.night}!`;
  },

  nextNight() {
    this.night = Math.min(6, this.night + 1);
    this.startNight();
  },

  retry() { this.startNight(); },

  // Controles
  toggleCamera() {
    if (this.gameOver || this.power <= 0) return;
    this.cameraOpen = !this.cameraOpen;
    document.getElementById('camera-panel').classList.toggle('hidden', !this.cameraOpen);
    document.getElementById('btn-camera').textContent = this.cameraOpen ? '❌ CERRAR' : '📹 CÁMARAS';
  },

  selectCam(camId) {
    this.currentCam = camId;
    document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-cam="${camId}"]`);
    if (btn) btn.classList.add('active');
    document.getElementById('camera-name').textContent =
      `${camId.toUpperCase()} - ${this.cameras[camId].name}`;
  },

  toggleDoor(side) {
    if (this.gameOver || this.power <= 0) return;
    if (side === 'left') this.doorLeft = !this.doorLeft;
    else this.doorRight = !this.doorRight;
    this.updateDoorButtons();
  },

  lightOn(side) {
    if (this.gameOver || this.power <= 0) return;
    if (side === 'left') this.lightLeft = true;
    else this.lightRight = true;
  },
  lightOff(side) {
    if (side === 'left') this.lightLeft = false;
    else this.lightRight = false;
  },

  updateDoorButtons() {
    document.getElementById('btn-door-left').classList.toggle('door-closed', this.doorLeft);
    document.getElementById('btn-door-left').textContent = this.doorLeft ? '🚫 IZQ CERRADA' : 'PUERTA IZQ';
    document.getElementById('btn-door-right').classList.toggle('door-closed', this.doorRight);
    document.getElementById('btn-door-right').textContent = this.doorRight ? '🚫 DER CERRADA' : 'PUERTA DER';
  },

  updateHUD() {
    const hours = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM'];
    document.getElementById('hud-time').textContent = hours[this.hour];
    document.getElementById('hud-power').textContent = `Energía: ${Math.round(this.power)}%`;
    document.getElementById('hud-power').style.color =
      this.power > 30 ? '#4f4' : this.power > 15 ? '#ff0' : '#f44';
  },

  // =================== RENDER ===================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1280, 720);

    if (this.cameraOpen) {
      this.renderCamera(ctx);
    } else {
      this.renderOffice(ctx);
    }

    // Static noise overlay
    this.renderStatic(ctx, 0.03);
  },

  renderOffice(ctx) {
    const lookOffset = this.officeLookX * 100;

    // Fondo oficina (habitación del árbol corrupta)
    ctx.fillStyle = '#0a0515';
    ctx.fillRect(0, 0, 1280, 720);

    // Paredes
    ctx.fillStyle = '#150a25';
    ctx.fillRect(0, 50, 1280, 550);

    // Ventana central
    ctx.fillStyle = '#0a0020';
    ctx.fillRect(490 + lookOffset, 120, 300, 200);
    ctx.strokeStyle = '#3a1a5a';
    ctx.lineWidth = 4;
    ctx.strokeRect(490 + lookOffset, 120, 300, 200);
    // Luna
    ctx.fillStyle = '#2a1050';
    ctx.beginPath();
    ctx.arc(640 + lookOffset, 200, 30, 0, Math.PI * 2);
    ctx.fill();

    // Mesa/escritorio
    ctx.fillStyle = '#1a0a30';
    ctx.fillRect(300 + lookOffset, 450, 680, 30);
    ctx.fillRect(350 + lookOffset, 480, 580, 150);

    // Monitor de cámaras en la mesa
    ctx.fillStyle = '#111';
    ctx.fillRect(550 + lookOffset, 380, 180, 70);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(550 + lookOffset, 380, 180, 70);
    ctx.fillStyle = '#0a2a0a';
    ctx.fillRect(555 + lookOffset, 385, 170, 60);

    // Objetos decorativos
    // Poster de Finn y Jake (corrupto)
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(200 + lookOffset, 150, 100, 130);
    ctx.strokeStyle = '#3a4a6a';
    ctx.strokeRect(200 + lookOffset, 150, 100, 130);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FINN & JAKE', 250 + lookOffset, 220);
    ctx.fillStyle = '#f00';
    ctx.fillText('CORRUPTOS', 250 + lookOffset, 240);

    // Puerta izquierda
    ctx.fillStyle = this.doorLeft ? '#2a0a0a' : '#1a1a2a';
    ctx.fillRect(30 + lookOffset, 150, 100, 400);
    ctx.strokeStyle = this.doorLeft ? '#f00' : '#4a3a6a';
    ctx.lineWidth = 3;
    ctx.strokeRect(30 + lookOffset, 150, 100, 400);
    if (this.doorLeft) {
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('CERRADA', 80 + lookOffset, 350);
    }

    // Puerta derecha
    ctx.fillStyle = this.doorRight ? '#2a0a0a' : '#1a1a2a';
    ctx.fillRect(1150 + lookOffset, 150, 100, 400);
    ctx.strokeStyle = this.doorRight ? '#f00' : '#4a3a6a';
    ctx.strokeRect(1150 + lookOffset, 150, 100, 400);
    if (this.doorRight) {
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('CERRADA', 1200 + lookOffset, 350);
    }

    // Luz izquierda - mostrar enemigo si está ahí
    if (this.lightLeft) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
      ctx.fillRect(0, 100, 200, 500);
      this.renderEnemyAtDoor(ctx, 'left', lookOffset);
    }

    // Luz derecha
    if (this.lightRight) {
      ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
      ctx.fillRect(1080, 100, 200, 500);
      this.renderEnemyAtDoor(ctx, 'right', lookOffset);
    }

    // Suelo
    ctx.fillStyle = '#0a0510';
    ctx.fillRect(0, 600, 1280, 120);

    // Efecto de oscuridad en bordes
    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
  },

  renderEnemyAtDoor(ctx, side, lookOffset) {
    // Buscar si hay un animatrónico en esta puerta
    const enemy = Object.values(this.animatronics).find(a => a.atDoor && a.doorSide === side);
    if (!enemy) return;

    const x = side === 'left' ? 60 + lookOffset : 1170 + lookOffset;
    const y = 200;
    this.drawAnimatronic(ctx, enemy.id, x, y, 1.5);
  },

  renderCamera(ctx) {
    // Fondo de cámara
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1280, 720);

    // Borde de monitor
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 30, 1120, 560);

    // Contenido de la cámara
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(82, 32, 1116, 556);

    // Dibujar la habitación de la cámara
    this.renderCameraRoom(ctx, this.currentCam);

    // Dibujar animatrónicos en esta cámara
    this.renderCameraEnemies(ctx, this.currentCam);

    // Efecto de líneas de escaneo
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 560; i += 3) {
      ctx.beginPath();
      ctx.moveTo(82, 32 + i);
      ctx.lineTo(1198, 32 + i);
      ctx.stroke();
    }

    // Nombre de cámara
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.currentCam.toUpperCase()} - ${this.cameras[this.currentCam].name}`, 100, 60);

    // REC indicator
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(1160, 55, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f00';
    ctx.font = '12px Courier New';
    ctx.fillText('REC', 1130, 60);

    // Timestamp
    ctx.fillStyle = '#0f0';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'right';
    const hours = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM'];
    ctx.fillText(hours[this.hour] || '12 AM', 1180, 580);

    // Static overlay en cámara
    this.renderStatic(ctx, 0.08);
  },

  renderCameraRoom(ctx, camId) {
    const x = 82, y = 32, w = 1116, h = 556;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    switch (camId) {
      case 'cam1': // Entrada
        ctx.fillStyle = '#0a0515';
        ctx.fillRect(x, y, w, h);
        // Puerta grande
        ctx.fillStyle = '#1a0a2a';
        ctx.fillRect(x + 400, y + 100, 300, 400);
        ctx.strokeStyle = '#4a2a6a';
        ctx.strokeRect(x + 400, y + 100, 300, 400);
        // Árboles
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(x + 100, y + 150, 40, 300);
        ctx.fillRect(x + 800, y + 180, 40, 270);
        break;
      case 'cam2': // Sala
        ctx.fillStyle = '#0f0a1a';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#1a0a30';
        ctx.fillRect(x + 200, y + 300, 200, 100); // sofá
        ctx.fillRect(x + 600, y + 250, 150, 200); // mesa
        break;
      case 'cam3': // Cocina
        ctx.fillStyle = '#1a0515';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(x + 700, y + 100, 120, 350); // nevera
        ctx.fillRect(x + 200, y + 300, 300, 20); // encimera
        break;
      case 'cam4': // Pasillo izq
        ctx.fillStyle = '#080510';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#120a20';
        ctx.fillRect(x + 300, y + 50, 500, h - 100);
        break;
      case 'cam5': // Pasillo der
        ctx.fillStyle = '#080510';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#120a20';
        ctx.fillRect(x + 300, y + 50, 500, h - 100);
        break;
      case 'cam6': // Hab Finn
        ctx.fillStyle = '#1a0808';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#2a1515';
        ctx.fillRect(x + 500, y + 300, 250, 120); // cama
        ctx.fillStyle = '#1a2a4a';
        ctx.fillRect(x + 200, y + 100, 80, 100); // poster
        break;
      case 'cam7': // Conductos
        ctx.fillStyle = '#0a1005';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#2a4a1a';
        ctx.lineWidth = 6;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 100 + i * 250, y + 50);
          ctx.lineTo(x + 100 + i * 250, y + h - 50);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  },

  renderCameraEnemies(ctx, camId) {
    Object.values(this.animatronics).forEach(a => {
      if (!a.active || a.atDoor) return;
      const route = this.routes[a.id];
      const currentCamInRoute = route[a.position];
      if (currentCamInRoute === camId) {
        // Dibujar animatrónico en la cámara
        const cx = 400 + Math.sin(a.position * 2) * 200;
        const cy = 200;
        this.drawAnimatronic(ctx, a.id, cx, cy, 2);
      }
    });
  },

  // =================== DIBUJAR ANIMATRÓNICOS ===================
  drawAnimatronic(ctx, id, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    switch (id) {
      case 'finn': this.drawFinn(ctx); break;
      case 'jake': this.drawJake(ctx); break;
      case 'chicle': this.drawChicle(ctx); break;
      case 'reyhielo': this.drawReyHielo(ctx); break;
    }

    ctx.restore();
  },

  drawFinn(ctx) {
    // === FINN CORRUPTO ===
    // Cuerpo - camiseta azul
    ctx.fillStyle = '#1a4a7a';
    ctx.fillRect(-18, 10, 36, 50);
    // Shorts verdes
    ctx.fillStyle = '#1a4a2a';
    ctx.fillRect(-16, 55, 32, 20);
    // Piernas
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-12, 72, 10, 25);
    ctx.fillRect(2, 72, 10, 25);
    // Zapatos
    ctx.fillStyle = '#111';
    ctx.fillRect(-14, 95, 14, 8);
    ctx.fillRect(0, 95, 14, 8);
    // Brazos
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-26, 15, 10, 35);
    ctx.fillRect(16, 15, 10, 35);
    // Cabeza - gorro blanco
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(0, -10, 22, 0, Math.PI * 2);
    ctx.fill();
    // Orejas del gorro
    ctx.beginPath();
    ctx.arc(-16, -28, 9, 0, Math.PI * 2);
    ctx.arc(16, -28, 9, 0, Math.PI * 2);
    ctx.fill();
    // Cara
    ctx.fillStyle = '#ffddaa';
    ctx.beginPath();
    ctx.arc(0, -5, 14, 0, Math.PI * 2);
    ctx.fill();
    // Ojos ROJOS brillantes
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-5, -8, 4, 0, Math.PI * 2);
    ctx.arc(5, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Pupilas
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -8, 2, 0, Math.PI * 2);
    ctx.arc(5, -8, 2, 0, Math.PI * 2);
    ctx.fill();
    // Sonrisa siniestra
    ctx.strokeStyle = '#440000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Espada corrupta
    ctx.fillStyle = '#6a0dad';
    ctx.fillRect(22, 0, 5, 50);
    ctx.fillStyle = '#9b30ff';
    ctx.fillRect(18, -5, 13, 7);
    // Venas de corrupción
    ctx.strokeStyle = 'rgba(150, 0, 200, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, 15); ctx.lineTo(-15, 40);
    ctx.moveTo(10, 15); ctx.lineTo(15, 45);
    ctx.moveTo(0, 10); ctx.lineTo(-5, 50);
    ctx.stroke();
  },

  drawJake(ctx) {
    // === JAKE RETORCIDO ===
    // Cuerpo amarillo (forma de perro estirada)
    ctx.fillStyle = '#CC9900';
    ctx.beginPath();
    ctx.ellipse(0, 30, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cabeza
    ctx.fillStyle = '#DDAA00';
    ctx.beginPath();
    ctx.arc(0, -10, 20, 0, Math.PI * 2);
    ctx.fill();
    // Hocico
    ctx.fillStyle = '#EECC44';
    ctx.beginPath();
    ctx.ellipse(0, -2, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ojos enormes y perturbadores
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-8, -15, 7, 0, Math.PI * 2);
    ctx.arc(8, -15, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-8, -15, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -15, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Sonrisa ENORME con dientes
    ctx.strokeStyle = '#330000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 12, 0.1, Math.PI - 0.1);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    for (let i = -4; i <= 4; i++) {
      ctx.fillRect(-10 + (i + 4) * 2.5, -2, 2, 4);
    }
    // Orejas caídas
    ctx.fillStyle = '#CC9900';
    ctx.beginPath();
    ctx.ellipse(-15, -25, 6, 12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(15, -25, 6, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Patas estiradas grotescamente
    ctx.fillStyle = '#CC9900';
    ctx.fillRect(-22, 48, 10, 35);
    ctx.fillRect(-8, 48, 10, 30);
    ctx.fillRect(4, 48, 10, 33);
    ctx.fillRect(16, 48, 10, 28);
    // Cola retorcida
    ctx.strokeStyle = '#CC9900';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-25, 30);
    ctx.quadraticCurveTo(-40, 10, -35, -10);
    ctx.stroke();
    // Manchas de corrupción
    ctx.fillStyle = 'rgba(100, 50, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(10, 25, 8, 0, Math.PI * 2);
    ctx.arc(-12, 35, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  drawChicle(ctx) {
    // === PRINCESA CHICLE DERRETIDA ===
    // Cuerpo derretido rosa
    ctx.fillStyle = '#CC3388';
    ctx.beginPath();
    ctx.moveTo(-20, 80);
    ctx.quadraticCurveTo(-22, 20, 0, -20);
    ctx.quadraticCurveTo(22, 20, 20, 80);
    ctx.closePath();
    ctx.fill();
    // Goteo
    ctx.fillStyle = '#AA2266';
    for (let i = -2; i <= 2; i++) {
      const dripLen = 15 + Math.abs(i) * 5;
      ctx.beginPath();
      ctx.ellipse(i * 8, 80 + dripLen / 2, 4, dripLen / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Corona dorada (torcida)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-12, -25);
    ctx.lineTo(-10, -40);
    ctx.lineTo(-5, -30);
    ctx.lineTo(0, -45);
    ctx.lineTo(5, -30);
    ctx.lineTo(10, -40);
    ctx.lineTo(12, -25);
    ctx.closePath();
    ctx.fill();
    // Gema
    ctx.fillStyle = '#ff00aa';
    ctx.beginPath();
    ctx.arc(0, -32, 4, 0, Math.PI * 2);
    ctx.fill();
    // Cara
    ctx.fillStyle = '#ffccdd';
    ctx.beginPath();
    ctx.arc(0, -5, 14, 0, Math.PI * 2);
    ctx.fill();
    // Ojos (uno más grande que otro - derretido)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -8, 5, 0, Math.PI * 2);
    ctx.arc(6, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-5, -8, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Boca derretida
    ctx.strokeStyle = '#660033';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(0, 10, 8, 2);
    ctx.stroke();
  },

  drawReyHielo(ctx) {
    // === REY HIELO DESQUICIADO ===
    // Túnica azul
    ctx.fillStyle = '#1a3a6b';
    ctx.beginPath();
    ctx.moveTo(-20, 20);
    ctx.lineTo(-25, 90);
    ctx.lineTo(25, 90);
    ctx.lineTo(20, 20);
    ctx.closePath();
    ctx.fill();
    // Cuerpo
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cabeza azul
    ctx.fillStyle = '#6699cc';
    ctx.beginPath();
    ctx.arc(0, -20, 18, 0, Math.PI * 2);
    ctx.fill();
    // Corona dorada
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-12, -35);
    ctx.lineTo(-10, -50);
    ctx.lineTo(-5, -40);
    ctx.lineTo(0, -55);
    ctx.lineTo(5, -40);
    ctx.lineTo(10, -50);
    ctx.lineTo(12, -35);
    ctx.closePath();
    ctx.fill();
    // Gema roja en corona
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(0, -42, 4, 0, Math.PI * 2);
    ctx.fill();
    // Nariz larga
    ctx.fillStyle = '#5588bb';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-4, -2);
    ctx.lineTo(4, -2);
    ctx.closePath();
    ctx.fill();
    // Ojos desquiciados
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-7, -22, 5, 0, Math.PI * 2);
    ctx.arc(7, -22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00ccff';
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-7, -22, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -22, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Barba blanca larga
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.quadraticCurveTo(-8, 15, -5, 30);
    ctx.lineTo(5, 30);
    ctx.quadraticCurveTo(8, 15, 12, -10);
    ctx.closePath();
    ctx.fill();
    // Manos con hielo
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.arc(-22, 30, 8, 0, Math.PI * 2);
    ctx.arc(22, 30, 8, 0, Math.PI * 2);
    ctx.fill();
    // Bola de hielo
    ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(22, 25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 230, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  // =================== JUMPSCARE ===================
  renderJumpscare(enemyId) {
    const ctx = this.jumpCtx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1280, 720);

    // Dibujar el animatrónico GRANDE en el centro
    ctx.save();
    ctx.translate(640, 360);
    ctx.scale(5, 5);

    switch (enemyId) {
      case 'finn': this.drawFinn(ctx); break;
      case 'jake': this.drawJake(ctx); break;
      case 'chicle': this.drawChicle(ctx); break;
      case 'reyhielo': this.drawReyHielo(ctx); break;
    }
    ctx.restore();

    // Flash rojo
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, 1280, 720);

    // Texto
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('TE ATRAPÓ', 640, 650);

    // Static intenso
    this.renderStatic(ctx, 0.2);
  },

  renderStatic(ctx, intensity) {
    const imageData = ctx.getImageData(0, 0, 1280, 720);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 40) {
      if (Math.random() < intensity) {
        const val = Math.random() * 50;
        data[i] = Math.min(255, data[i] + val);
        data[i + 1] = Math.min(255, data[i + 1] + val);
        data[i + 2] = Math.min(255, data[i + 2] + val);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
};

// Inicializar al cargar
window.addEventListener('load', () => Game.init());
