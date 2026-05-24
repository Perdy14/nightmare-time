// ============================================
// NIGHTMARE TIME - IA de Princesa Chicle Derretida
// ============================================
// Controla zonas bloqueando rutas con masa rosa.
// Susurra "dulce..." cuando está cerca.
// Solo visible con linterna.

const AIChicle = {
  x: 400,
  y: 540,
  w: 40,
  h: 64,
  speed: 60,

  // Estados: dormant, spreading, blocking, retreating
  state: 'dormant',
  active: false,
  zone: 'cocina',
  visible: false,

  // Masa rosa (hazards que crea)
  masses: [],
  maxMasses: 4,
  spreadTimer: 0,
  spreadInterval: 10,

  // Detección
  proximityRange: 200,
  
  // Personalidad
  whisperTimer: 0,
  whisperInterval: 6,
  drippingAnim: 0,

  // Solo visible con linterna
  revealedByLight: false,

  init(zone) {
    this.zone = zone || 'cocina';
    this.state = 'dormant';
    this.active = true;
    this.masses = [];
    this.visible = false;
    
    const zoneData = GameMap.zones[this.zone];
    if (zoneData) {
      this.x = zoneData.width * 0.5;
      this.y = zoneData.platforms[0].y - this.h;
    }
  },

  update(dt) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) return;

    // Solo visible con linterna
    this.revealedByLight = Flashlight.isPointLit(this.x + this.w / 2, this.y + this.h / 2);
    this.visible = this.revealedByLight;

    // Personalidad: susurros
    this.whisperTimer += dt;
    if (this.whisperTimer >= this.whisperInterval) {
      this.whisperTimer = 0;
      const dist = distance(this.x, this.y, Player.x, Player.y);
      if (dist < this.proximityRange * 1.5) {
        AudioSystem.playChicleSquish();
      }
    }

    // Animación de goteo
    this.drippingAnim += dt;

    switch (this.state) {
      case 'dormant':
        this.updateDormant(dt);
        break;
      case 'spreading':
        this.updateSpreading(dt);
        break;
      case 'blocking':
        this.updateBlocking(dt);
        break;
      case 'retreating':
        this.updateRetreating(dt);
        break;
    }

    // Comprobar si el jugador pisa masa
    this.checkMassCollision();

    // Reaccionar a la runa purificadora
    // (se maneja externamente)
  },

  updateDormant(dt) {
    // Esperar hasta que el jugador esté cerca
    const dist = distance(this.x, this.y, Player.x, Player.y);
    if (dist < this.proximityRange) {
      this.state = 'spreading';
      this.spreadTimer = this.spreadInterval;
    }
  },

  updateSpreading(dt) {
    this.spreadTimer -= dt;

    // Moverse lentamente hacia rutas del jugador
    const dir = Player.x > this.x ? 1 : -1;
    this.x += dir * this.speed * 0.3 * dt;

    if (this.spreadTimer <= 0 && this.masses.length < this.maxMasses) {
      this.createMass();
      this.spreadTimer = this.spreadInterval;
    }

    // Si el jugador se aleja mucho
    const dist = distance(this.x, this.y, Player.x, Player.y);
    if (dist > this.proximityRange * 2) {
      this.state = 'dormant';
    }

    // Si tiene suficientes masas, bloquear
    if (this.masses.length >= this.maxMasses) {
      this.state = 'blocking';
    }
  },

  updateBlocking(dt) {
    // Quedarse quieta bloqueando rutas
    // Las masas ya están colocadas
    
    // Si el jugador usa runa, retirarse
    const dist = distance(this.x, this.y, Player.x, Player.y);
    if (dist > this.proximityRange * 3) {
      this.state = 'retreating';
    }
  },

  updateRetreating(dt) {
    // Alejarse del jugador
    const dir = Player.x > this.x ? -1 : 1;
    this.x += dir * this.speed * dt;

    // Eliminar masas gradualmente
    if (this.masses.length > 0 && Math.random() < dt * 0.3) {
      this.masses.pop();
    }

    if (this.masses.length === 0) {
      this.state = 'dormant';
    }
  },

  createMass() {
    // Crear masa rosa en una posición estratégica (entre jugador y salida)
    const doorPositions = GameMap.doors.map(d => d.x);
    let massX = this.x;
    
    if (doorPositions.length > 0) {
      // Poner masa cerca de una puerta
      const targetDoor = doorPositions[randomInt(0, doorPositions.length - 1)];
      massX = targetDoor + randomRange(-50, 50);
    } else {
      massX = Player.x + randomRange(-100, 100);
    }

    const zoneData = GameMap.zones[this.zone];
    const massY = zoneData ? zoneData.platforms[0].y - 30 : 570;

    this.masses.push({
      x: massX,
      y: massY,
      w: randomRange(80, 150),
      h: 30,
      life: 30, // Segundos antes de desaparecer
      opacity: 1
    });

    AudioSystem.playChicleSquish();
  },

  checkMassCollision() {
    const playerRect = { x: Player.x, y: Player.y, w: Player.w, h: Player.h };
    
    for (const mass of this.masses) {
      if (rectsCollide(playerRect, mass)) {
        // Ralentizar al jugador
        Player.x -= Player.vx * 0.02;
        // Si no tiene linterna, puede quedar atrapado
        if (!Flashlight.active) {
          StressSystem.addStress(0.02);
        }
      }
    }
  },

  // Reaccionar a runa purificadora
  reactToRune(runeX, runeY) {
    const dist = distance(this.x, this.y, runeX, runeY);
    if (dist < 200) {
      this.state = 'retreating';
      this.masses = []; // Eliminar todas las masas
      // Alejarse rápidamente
      this.x += (this.x > runeX ? 200 : -200);
    }
  },

  // Reaccionar al flash
  reactToFlash() {
    if (Flashlight.flashActive) {
      const dist = distance(this.x, this.y, Player.x, Player.y);
      if (dist < 250) {
        this.state = 'retreating';
      }
    }
  },

  render(ctx) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) return;

    const camX = GameMap.camera.x;

    // Renderizar masas rosa (siempre visibles)
    this.masses.forEach(mass => {
      ctx.fillStyle = `rgba(200, 50, 150, ${mass.opacity * 0.7})`;
      ctx.beginPath();
      // Forma orgánica
      ctx.moveTo(mass.x - camX, mass.y + mass.h);
      ctx.quadraticCurveTo(
        mass.x - camX + mass.w * 0.25, mass.y - 5 + Math.sin(GameState.gameTime + mass.x) * 3,
        mass.x - camX + mass.w * 0.5, mass.y
      );
      ctx.quadraticCurveTo(
        mass.x - camX + mass.w * 0.75, mass.y - 5 + Math.cos(GameState.gameTime + mass.x) * 3,
        mass.x - camX + mass.w, mass.y + mass.h
      );
      ctx.closePath();
      ctx.fill();

      // Ojos en la masa
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(mass.x - camX + mass.w * 0.3, mass.y + 10, 4, 0, Math.PI * 2);
      ctx.arc(mass.x - camX + mass.w * 0.7, mass.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(mass.x - camX + mass.w * 0.3, mass.y + 10, 2, 0, Math.PI * 2);
      ctx.arc(mass.x - camX + mass.w * 0.7, mass.y + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Chicle solo visible con linterna
    if (!this.visible) return;

    const drawX = this.x - camX;
    const drawY = this.y;

    ctx.save();
    ctx.translate(drawX + this.w / 2, drawY + this.h / 2);

    // Cuerpo derretido (rosa oscuro)
    ctx.fillStyle = '#8B2252';
    
    // Forma derretida
    ctx.beginPath();
    ctx.moveTo(-this.w / 2, this.h / 2);
    ctx.quadraticCurveTo(-this.w / 2, -this.h / 3, 0, -this.h / 2);
    ctx.quadraticCurveTo(this.w / 2, -this.h / 3, this.w / 2, this.h / 2);
    ctx.closePath();
    ctx.fill();

    // Goteo
    const dripCount = 3;
    for (let i = 0; i < dripCount; i++) {
      const dripX = -this.w / 3 + i * (this.w / 3);
      const dripLen = 10 + Math.sin(this.drippingAnim * 2 + i) * 8;
      ctx.fillStyle = 'rgba(200, 50, 150, 0.8)';
      ctx.beginPath();
      ctx.ellipse(dripX, this.h / 2 + dripLen / 2, 3, dripLen / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corona derretida
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-10, -this.h / 2 - 5);
    ctx.lineTo(-8, -this.h / 2 - 15);
    ctx.lineTo(-3, -this.h / 2 - 8);
    ctx.lineTo(0, -this.h / 2 - 18);
    ctx.lineTo(3, -this.h / 2 - 8);
    ctx.lineTo(8, -this.h / 2 - 15);
    ctx.lineTo(10, -this.h / 2 - 5);
    ctx.closePath();
    ctx.fill();

    // Ojos
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-6, -this.h / 6, 5, 0, Math.PI * 2);
    ctx.arc(6, -this.h / 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-6, -this.h / 6, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -this.h / 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
};
