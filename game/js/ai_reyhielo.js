// ============================================
// NIGHTMARE TIME - IA del Rey Hielo Desquiciado
// ============================================
// Manipula el clima, congela puertas, ralentiza al jugador.
// Canta melodías distorsionadas. Se ríe cuando te resbalas.

const AIReyHielo = {
  x: 600,
  y: 480,
  w: 38,
  h: 68,
  speed: 90,
  
  // Estados: singing, freezing, chasing, laughing
  state: 'singing',
  active: false,
  zone: 'camara_fria',
  
  // Congelación
  freezeTimer: 0,
  freezeInterval: 12,
  frozenDoors: [],
  icePatches: [],
  maxIcePatches: 5,

  // Detección
  detectionRange: 350,
  
  // Canto
  singTimer: 0,
  singInterval: 8,
  isSinging: false,

  // Risa
  laughTimer: 0,
  playerSlipped: false,

  // Persecución
  chaseTimer: 0,
  maxChaseTime: 5,

  // Personalidad
  phrases: [
    '♪ Gunter... ven aquí... ♪',
    '♪ Princesa... te encontraré... ♪',
    'Jajaja... ¡resbalaste!',
    '♪ Hielo... hielo... todo es hielo... ♪'
  ],

  // Visual
  floatOffset: 0,
  beardWave: 0,

  init(zone) {
    this.zone = zone || 'camara_fria';
    this.state = 'singing';
    this.active = true;
    this.icePatches = [];
    this.frozenDoors = [];
    
    const zoneData = GameMap.zones[this.zone];
    if (zoneData) {
      this.x = zoneData.width * 0.7;
      this.y = zoneData.platforms[0].y - this.h - 20; // Flota un poco
    }
  },

  update(dt) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) return;

    // Flotar
    this.floatOffset = Math.sin(GameState.gameTime * 1.5) * 8;
    this.beardWave = Math.sin(GameState.gameTime * 2) * 3;

    // Canto periódico
    this.singTimer += dt;
    if (this.singTimer >= this.singInterval) {
      this.singTimer = 0;
      this.sing();
    }

    // Congelación periódica
    this.freezeTimer += dt;
    if (this.freezeTimer >= this.freezeInterval) {
      this.freezeTimer = 0;
      this.freezeAction();
    }

    switch (this.state) {
      case 'singing':
        this.updateSinging(dt);
        break;
      case 'freezing':
        this.updateFreezing(dt);
        break;
      case 'chasing':
        this.updateChasing(dt);
        break;
      case 'laughing':
        this.updateLaughing(dt);
        break;
    }

    // Detectar jugador
    this.detectPlayer(dt);

    // Comprobar si el jugador resbala
    this.checkPlayerSlip();

    // Actualizar hielo
    this.updateIce(dt);

    // Reaccionar a calefactor
    if (Flashlight.active && Flashlight.isLow) {
      // El parpadeo de la linterna le atrae
      const dist = distance(this.x, this.y, Player.x, Player.y);
      if (dist < this.detectionRange && this.state === 'singing') {
        this.state = 'chasing';
        this.chaseTimer = this.maxChaseTime;
      }
    }
  },

  detectPlayer(dt) {
    const dist = distance(this.x, this.y, Player.x, Player.y);
    if (dist < this.detectionRange && !Player.isHiding && this.state === 'singing') {
      if (Math.random() < 0.01) { // No siempre persigue
        this.state = 'chasing';
        this.chaseTimer = this.maxChaseTime;
      }
    }
  },

  updateSinging(dt) {
    // Moverse erráticamente mientras canta
    this.x += Math.sin(GameState.gameTime * 0.8) * this.speed * 0.3 * dt;
    
    // Mantener en zona
    const zoneData = GameMap.zones[this.zone];
    if (zoneData) {
      this.x = clamp(this.x, 100, zoneData.width - 100);
    }
  },

  updateFreezing(dt) {
    // Breve pausa mientras congela
    this.state = 'singing'; // Vuelve a cantar después
  },

  updateChasing(dt) {
    const dir = Player.x > this.x ? 1 : -1;
    this.x += dir * this.speed * dt;

    this.chaseTimer -= dt;

    // Colisión
    if (rectsCollide(
      { x: this.x, y: this.y + this.floatOffset, w: this.w, h: this.h },
      { x: Player.x, y: Player.y, w: Player.w, h: Player.h }
    )) {
      if (!Player.isHiding) {
        Player.takeDamage();
      }
    }

    if (this.chaseTimer <= 0 || Player.isHiding) {
      this.state = 'singing';
    }
  },

  updateLaughing(dt) {
    this.laughTimer -= dt;
    if (this.laughTimer <= 0) {
      this.state = 'singing';
    }
  },

  sing() {
    this.isSinging = true;
    AudioSystem.playReyHieloSing();
    setTimeout(() => { this.isSinging = false; }, 1500);
  },

  freezeAction() {
    // Crear parche de hielo o congelar puerta
    if (Math.random() > 0.5 && this.icePatches.length < this.maxIcePatches) {
      this.createIcePatch();
    } else {
      this.freezeDoor();
    }
  },

  createIcePatch() {
    const zoneData = GameMap.zones[this.zone];
    if (!zoneData) return;

    const patchX = randomRange(100, zoneData.width - 200);
    const patchY = zoneData.platforms[0].y - 10;

    this.icePatches.push({
      x: patchX,
      y: patchY,
      w: randomRange(80, 150),
      h: 15,
      life: 20,
      opacity: 1
    });
  },

  freezeDoor() {
    const doors = GameMap.doors;
    if (doors.length === 0) return;
    
    const door = doors[randomInt(0, doors.length - 1)];
    if (!this.frozenDoors.includes(door)) {
      door.frozen = true;
      door.frozenTimer = 15; // Segundos congelada
      this.frozenDoors.push(door);
    }
  },

  updateIce(dt) {
    // Actualizar parches de hielo
    this.icePatches = this.icePatches.filter(patch => {
      patch.life -= dt;
      patch.opacity = Math.min(1, patch.life / 3);
      return patch.life > 0;
    });

    // Actualizar puertas congeladas
    this.frozenDoors = this.frozenDoors.filter(door => {
      if (door.frozenTimer !== undefined) {
        door.frozenTimer -= dt;
        if (door.frozenTimer <= 0) {
          door.frozen = false;
          return false;
        }
      }
      return true;
    });
  },

  checkPlayerSlip() {
    const playerRect = { x: Player.x, y: Player.y, w: Player.w, h: Player.h };
    
    for (const patch of this.icePatches) {
      if (rectsCollide(playerRect, patch)) {
        // Jugador resbala
        if (Player.isRunning) {
          Player.x += Player.vx * 0.05;
          if (!this.playerSlipped) {
            this.playerSlipped = true;
            this.state = 'laughing';
            this.laughTimer = 2;
            AudioSystem.playJakeLaugh(); // Risa
            StressSystem.addStress(0.1);
          }
        }
        return;
      }
    }
    this.playerSlipped = false;
  },

  // Reaccionar a calefactor
  reactToHeater(heaterX, heaterY) {
    const dist = distance(this.x, this.y, heaterX, heaterY);
    if (dist < 200) {
      // Se aleja del calor
      const dir = this.x > heaterX ? 1 : -1;
      this.x += dir * 150;
      // Eliminar hielo cercano
      this.icePatches = this.icePatches.filter(p => {
        return distance(p.x, p.y, heaterX, heaterY) > 150;
      });
      this.state = 'singing';
    }
  },

  render(ctx) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) return;

    const camX = GameMap.camera.x;

    // Renderizar parches de hielo
    this.icePatches.forEach(patch => {
      ctx.fillStyle = `rgba(150, 220, 255, ${patch.opacity * 0.5})`;
      ctx.fillRect(patch.x - camX, patch.y, patch.w, patch.h);
      // Cristales
      ctx.strokeStyle = `rgba(200, 240, 255, ${patch.opacity * 0.8})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const cx = patch.x - camX + patch.w * (0.2 + i * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx, patch.y);
        ctx.lineTo(cx - 3, patch.y - 5);
        ctx.lineTo(cx + 3, patch.y - 5);
        ctx.closePath();
        ctx.stroke();
      }
    });

    // Renderizar puertas congeladas
    this.frozenDoors.forEach(door => {
      if (door.frozen) {
        ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
        ctx.fillRect(door.x - camX - 5, door.y - 5, door.w + 10, door.h + 10);
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x - camX - 5, door.y - 5, door.w + 10, door.h + 10);
      }
    });

    // Rey Hielo
    const drawX = this.x - camX;
    const drawY = this.y + this.floatOffset;

    ctx.save();
    ctx.translate(drawX + this.w / 2, drawY + this.h / 2);

    // Túnica azul
    ctx.fillStyle = '#1a3a6b';
    ctx.beginPath();
    ctx.moveTo(-this.w / 2, -this.h / 4);
    ctx.lineTo(-this.w / 2 - 5, this.h / 2);
    ctx.lineTo(this.w / 2 + 5, this.h / 2);
    ctx.lineTo(this.w / 2, -this.h / 4);
    ctx.closePath();
    ctx.fill();

    // Cuerpo
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.ellipse(0, -this.h / 6, this.w / 2.5, this.h / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza
    ctx.fillStyle = '#6699cc';
    ctx.beginPath();
    ctx.arc(0, -this.h / 3, 14, 0, Math.PI * 2);
    ctx.fill();

    // Corona
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-10, -this.h / 3 - 14);
    ctx.lineTo(-8, -this.h / 3 - 24);
    ctx.lineTo(-4, -this.h / 3 - 16);
    ctx.lineTo(0, -this.h / 3 - 26);
    ctx.lineTo(4, -this.h / 3 - 16);
    ctx.lineTo(8, -this.h / 3 - 24);
    ctx.lineTo(10, -this.h / 3 - 14);
    ctx.closePath();
    ctx.fill();
    // Gema roja
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(0, -this.h / 3 - 18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Nariz larga
    ctx.fillStyle = '#5588bb';
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 3);
    ctx.lineTo(-3, -this.h / 3 + 12);
    ctx.lineTo(3, -this.h / 3 + 12);
    ctx.closePath();
    ctx.fill();

    // Ojos (desquiciados)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5, -this.h / 3 - 2, 4, 0, Math.PI * 2);
    ctx.arc(5, -this.h / 3 - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.state === 'chasing' ? '#ff0000' : '#000';
    ctx.beginPath();
    ctx.arc(-5, -this.h / 3 - 2, 2, 0, Math.PI * 2);
    ctx.arc(5, -this.h / 3 - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Barba (ondulante)
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath();
    ctx.moveTo(-8, -this.h / 3 + 10);
    ctx.quadraticCurveTo(-5, -this.h / 3 + 20 + this.beardWave, 0, -this.h / 3 + 25);
    ctx.quadraticCurveTo(5, -this.h / 3 + 20 - this.beardWave, 8, -this.h / 3 + 10);
    ctx.closePath();
    ctx.fill();

    // Efecto de frío
    if (this.isSinging) {
      ctx.strokeStyle = 'rgba(150, 220, 255, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const noteX = 20 + i * 8 + Math.sin(GameState.gameTime * 3 + i) * 5;
        const noteY = -this.h / 2 + Math.cos(GameState.gameTime * 2 + i) * 10;
        ctx.fillStyle = 'rgba(150, 220, 255, 0.6)';
        ctx.font = '10px serif';
        ctx.fillText('♪', noteX, noteY);
      }
    }

    // Aura de frío
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 40 + Math.sin(GameState.gameTime) * 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
};
