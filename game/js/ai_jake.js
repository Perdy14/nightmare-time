// ============================================
// NIGHTMARE TIME - IA de Jake Retorcido
// ============================================
// Acechador silencioso. Detecta ruido. Aparece por conductos.
// Ríe desde los conductos. Imita pasos.

const AIJake = {
  x: 400,
  y: 500,
  w: 44,
  h: 50,
  speed: 100,
  chaseSpeed: 200,

  // Estados: lurking, moving, emerging, chase, retreating
  state: 'lurking',
  active: false,
  zone: 'conducto_jake',
  visible: false,

  // Detección por sonido
  hearingRange: 500,
  noiseThreshold: 0.5, // Nivel de ruido que lo activa
  alertLevel: 0, // Se acumula con ruido

  // Conductos
  inVent: true,
  ventPositions: [],
  currentVent: 0,
  emergeTimer: 0,
  emergeDuration: 1.5,

  // Persecución
  chaseTimer: 0,
  maxChaseTime: 6,

  // Retiro
  retreatTimer: 0,
  retreatDuration: 3,

  // Personalidad
  laughTimer: 0,
  laughInterval: 12,
  imitateSteps: false,
  imitateTimer: 0,
  phrases: [
    'te encontré...',
    'jeje...',
    'aquí estoy...',
    'no te escondas...'
  ],

  // Animación
  stretchFactor: 1,
  animFrame: 0,

  init(zone) {
    this.zone = zone || 'conducto_jake';
    this.state = 'lurking';
    this.active = true;
    this.inVent = true;
    this.visible = false;
    this.alertLevel = 0;
    this.setupVents();
  },

  setupVents() {
    const zoneData = GameMap.zones[this.zone];
    if (!zoneData) return;
    
    this.ventPositions = [
      { x: 150, y: zoneData.platforms[0].y - 50 },
      { x: zoneData.width * 0.3, y: zoneData.platforms[0].y - 50 },
      { x: zoneData.width * 0.6, y: zoneData.platforms[0].y - 50 },
      { x: zoneData.width * 0.85, y: zoneData.platforms[0].y - 50 }
    ];
    this.currentVent = 0;
    this.x = this.ventPositions[0].x;
    this.y = this.ventPositions[0].y;
  },

  update(dt) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) {
      // Jake puede escuchar desde zonas adyacentes
      this.listenFromAfar(dt);
      return;
    }

    // Personalidad: risas
    this.laughTimer += dt;
    if (this.laughTimer >= this.laughInterval) {
      this.laughTimer = 0;
      if (this.inVent) {
        AudioSystem.playJakeLaugh();
      }
    }

    // Detectar ruido del jugador
    this.detectNoise(dt);

    switch (this.state) {
      case 'lurking':
        this.updateLurking(dt);
        break;
      case 'moving':
        this.updateMoving(dt);
        break;
      case 'emerging':
        this.updateEmerging(dt);
        break;
      case 'chase':
        this.updateChase(dt);
        break;
      case 'retreating':
        this.updateRetreating(dt);
        break;
    }

    // Imitar pasos
    if (this.imitateSteps) {
      this.imitateTimer -= dt;
      if (this.imitateTimer <= 0) {
        this.imitateSteps = false;
      }
    }
  },

  detectNoise(dt) {
    if (Player.isHiding && Player.noiseLevel < 0.1) return;

    const dist = distance(this.x, this.y, Player.x, Player.y);
    if (dist > this.hearingRange) return;

    const effectiveNoise = Player.noiseLevel * (1 - dist / this.hearingRange);
    
    if (effectiveNoise > this.noiseThreshold) {
      this.alertLevel += effectiveNoise * dt * 2;
    } else {
      this.alertLevel = Math.max(0, this.alertLevel - dt * 0.3);
    }

    // Si el nivel de alerta es alto, emerge
    if (this.alertLevel >= 1 && this.state === 'lurking') {
      this.state = 'emerging';
      this.emergeTimer = this.emergeDuration;
      // Elegir conducto más cercano al jugador
      this.chooseClosestVent();
    }
  },

  chooseClosestVent() {
    let closest = 0;
    let minDist = Infinity;
    this.ventPositions.forEach((v, i) => {
      const d = Math.abs(v.x - Player.x);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    this.currentVent = closest;
    this.x = this.ventPositions[closest].x;
    this.y = this.ventPositions[closest].y;
  },

  listenFromAfar(dt) {
    // Puede escuchar ruido fuerte desde otra zona
    if (Player.noiseLevel > 0.8) {
      this.alertLevel += dt * 0.5;
      if (this.alertLevel >= 2) {
        // Cambiar a la zona del jugador
        this.zone = GameState.currentZone;
        this.setupVents();
        this.alertLevel = 0;
      }
    }
  },

  updateLurking(dt) {
    this.visible = false;
    this.inVent = true;
    
    // Moverse silenciosamente entre conductos
    this.currentVent = (this.currentVent + (Math.random() > 0.5 ? 1 : -1) + this.ventPositions.length) % this.ventPositions.length;
  },

  updateMoving(dt) {
    // Moverse dentro de los conductos hacia el jugador
    const targetVent = this.ventPositions[this.currentVent];
    const dist = Math.abs(this.x - targetVent.x);
    
    if (dist > 10) {
      const dir = targetVent.x > this.x ? 1 : -1;
      this.x += dir * this.speed * dt;
    }
  },

  updateEmerging(dt) {
    this.emergeTimer -= dt;
    this.visible = true;
    
    // Animación de emerger (estirarse desde el conducto)
    this.stretchFactor = 1 + (1 - this.emergeTimer / this.emergeDuration) * 0.5;
    
    if (this.emergeTimer <= 0) {
      this.inVent = false;
      this.state = 'chase';
      this.chaseTimer = this.maxChaseTime;
      AudioSystem.playJakeLaugh();
    }
  },

  updateChase(dt) {
    this.visible = true;
    this.inVent = false;

    // Perseguir al jugador
    const dir = Player.x > this.x ? 1 : -1;
    this.x += dir * this.chaseSpeed * dt;

    this.chaseTimer -= dt;

    // Comprobar colisión
    if (rectsCollide(
      { x: this.x, y: this.y, w: this.w, h: this.h },
      { x: Player.x, y: Player.y, w: Player.w, h: Player.h }
    )) {
      if (!Player.isHiding) {
        Player.takeDamage();
      }
    }

    // Comprobar si el jugador está escondido
    if (Player.isHiding) {
      const canDiscover = HidingSystem.canEnemyDiscover(this.x, this.y, 80);
      if (canDiscover) {
        HidingSystem.forceExit();
      } else {
        // Buscar un poco y retirarse
        this.chaseTimer -= dt * 2;
      }
    }

    if (this.chaseTimer <= 0) {
      this.state = 'retreating';
      this.retreatTimer = this.retreatDuration;
    }
  },

  updateRetreating(dt) {
    this.retreatTimer -= dt;
    
    // Volver al conducto más cercano
    const targetVent = this.ventPositions[this.currentVent];
    const dist = Math.abs(this.x - targetVent.x);
    
    if (dist > 10) {
      const dir = targetVent.x > this.x ? 1 : -1;
      this.x += dir * this.speed * 1.5 * dt;
    }

    if (this.retreatTimer <= 0 || dist <= 10) {
      this.state = 'lurking';
      this.visible = false;
      this.inVent = true;
      this.alertLevel = 0;
      this.stretchFactor = 1;
    }
  },

  // Reaccionar a señuelo
  reactToDecoy(decoyX, decoyY) {
    if (this.state === 'lurking' || this.state === 'moving') {
      this.alertLevel = 1;
      // Ir hacia el señuelo en vez del jugador
      this.chooseClosestVent();
      this.state = 'emerging';
      this.emergeTimer = this.emergeDuration;
    }
  },

  // Reaccionar al cambio de pila
  reactToBatteryChange(playerX) {
    if (this.zone === GameState.currentZone) {
      this.alertLevel += 0.6;
    }
  },

  render(ctx) {
    if (!this.active || !this.visible) return;
    if (this.zone !== GameState.currentZone) return;

    const camX = GameMap.camera.x;
    const drawX = this.x - camX;
    const drawY = this.y;

    ctx.save();
    ctx.translate(drawX + this.w / 2, drawY + this.h / 2);

    // Jake se estira (efecto de goma)
    ctx.scale(1 / this.stretchFactor, this.stretchFactor);

    // Cuerpo de Jake (amarillo corrupto)
    const bodyColor = this.state === 'chase' ? '#8B7500' : '#6B5B00';
    ctx.fillStyle = bodyColor;
    
    // Forma de perro estirada
    ctx.beginPath();
    ctx.ellipse(0, 0, this.w / 2, this.h / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza
    ctx.fillStyle = '#9B8500';
    ctx.beginPath();
    ctx.arc(this.w / 3, -this.h / 4, 14, 0, Math.PI * 2);
    ctx.fill();

    // Ojos (grandes y perturbadores)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.w / 3 - 4, -this.h / 4 - 2, 5, 0, Math.PI * 2);
    ctx.arc(this.w / 3 + 4, -this.h / 4 - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(this.w / 3 - 4, -this.h / 4 - 2, 2, 0, Math.PI * 2);
    ctx.arc(this.w / 3 + 4, -this.h / 4 - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa demasiado grande
    ctx.strokeStyle = '#330000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.w / 3, -this.h / 4 + 5, 8, 0, Math.PI);
    ctx.stroke();

    // Patas estiradas
    ctx.fillStyle = bodyColor;
    const legWave = Math.sin(GameState.gameTime * 5) * 3;
    ctx.fillRect(-this.w / 3, this.h / 4, 6, 15 + legWave);
    ctx.fillRect(-this.w / 6, this.h / 4, 6, 15 - legWave);
    ctx.fillRect(this.w / 6, this.h / 4, 6, 15 + legWave);
    ctx.fillRect(this.w / 3, this.h / 4, 6, 15 - legWave);

    // Efecto de estiramiento corrupto
    if (this.state === 'emerging' || this.state === 'chase') {
      ctx.strokeStyle = 'rgba(200, 200, 0, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const offset = Math.sin(GameState.gameTime * 3 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(-this.w / 2 - 5, -this.h / 2 + i * 15 + offset);
        ctx.lineTo(this.w / 2 + 5, -this.h / 2 + i * 15 - offset);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
};
