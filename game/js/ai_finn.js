// ============================================
// NIGHTMARE TIME - IA de Finn Corrupto
// ============================================
// Cazador directo. Persigue por visión.
// Susurra frases rotas. Golpea paredes cuando te pierde.

const AIFinn = {
  x: 500,
  y: 500,
  w: 36,
  h: 60,
  speed: 140,
  chaseSpeed: 260,
  
  // Estados: patrol, alert, chase, search, stunned
  state: 'patrol',
  active: false,
  zone: 'sala_principal',
  
  // Patrulla
  patrolPoints: [],
  patrolIndex: 0,
  patrolWaitTimer: 0,
  patrolWaitDuration: 2,

  // Detección
  visionRange: 300,
  visionAngle: 90, // grados
  facingRight: true,
  
  // Persecución
  chaseTimer: 0,
  maxChaseTime: 8,
  lastSeenX: 0,
  lastSeenY: 0,

  // Búsqueda
  searchTimer: 0,
  searchDuration: 5,

  // Stun (por flash)
  stunTimer: 0,
  stunDuration: 2,

  // Personalidad
  whisperTimer: 0,
  whisperInterval: 8,
  wallHitTimer: 0,
  phrases: [
    '...ven aquí...',
    '...te veo...',
    '...no puedes huir...',
    '...soy tu héroe...',
    '...¿por qué corres?...'
  ],

  // Animación
  animFrame: 0,
  animTimer: 0,

  init(zone) {
    this.zone = zone || 'sala_principal';
    this.state = 'patrol';
    this.active = true;
    this.setupPatrol();
  },

  setupPatrol() {
    const zoneData = GameMap.zones[this.zone];
    if (!zoneData) return;
    
    // Puntos de patrulla basados en la zona
    this.patrolPoints = [
      { x: 200, y: zoneData.platforms[0].y - 60 },
      { x: zoneData.width * 0.4, y: zoneData.platforms[0].y - 60 },
      { x: zoneData.width * 0.7, y: zoneData.platforms[0].y - 60 },
      { x: zoneData.width * 0.3, y: zoneData.platforms[0].y - 60 }
    ];
    this.patrolIndex = 0;
    this.x = this.patrolPoints[0].x;
    this.y = this.patrolPoints[0].y;
  },

  update(dt) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) return;

    // Personalidad: susurros
    this.whisperTimer += dt;
    if (this.whisperTimer >= this.whisperInterval) {
      this.whisperTimer = 0;
      if (this.state !== 'patrol') {
        AudioSystem.playFinnWhisper();
      }
    }

    switch (this.state) {
      case 'patrol':
        this.updatePatrol(dt);
        break;
      case 'alert':
        this.updateAlert(dt);
        break;
      case 'chase':
        this.updateChase(dt);
        break;
      case 'search':
        this.updateSearch(dt);
        break;
      case 'stunned':
        this.updateStunned(dt);
        break;
    }

    // Comprobar si ve al jugador
    if (this.state !== 'stunned' && this.state !== 'chase') {
      if (this.canSeePlayer()) {
        this.state = 'chase';
        this.chaseTimer = this.maxChaseTime;
        this.lastSeenX = Player.x;
        this.lastSeenY = Player.y;
        AudioSystem.playFinnWhisper();
      }
    }

    // Comprobar flash
    if (Flashlight.flashActive && Flashlight.mode === 'parpadeo') {
      const dist = distance(this.x, this.y, Player.x, Player.y);
      if (dist < 200) {
        this.stun();
      }
    }

    // Animación
    this.animTimer += dt;
    if (this.animTimer > 0.2) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTimer = 0;
    }
  },

  updatePatrol(dt) {
    const target = this.patrolPoints[this.patrolIndex];
    if (!target) return;

    const dist = Math.abs(this.x - target.x);
    
    if (dist < 10) {
      this.patrolWaitTimer += dt;
      if (this.patrolWaitTimer >= this.patrolWaitDuration) {
        this.patrolWaitTimer = 0;
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
      }
    } else {
      const dir = target.x > this.x ? 1 : -1;
      this.x += dir * this.speed * dt;
      this.facingRight = dir > 0;
    }
  },

  updateAlert(dt) {
    // Breve pausa antes de perseguir
    this.chaseTimer -= dt;
    if (this.chaseTimer <= 0) {
      this.state = 'chase';
      this.chaseTimer = this.maxChaseTime;
    }
  },

  updateChase(dt) {
    // Perseguir al jugador
    if (this.canSeePlayer()) {
      this.lastSeenX = Player.x;
      this.lastSeenY = Player.y;
      this.chaseTimer = this.maxChaseTime;
    }

    const dir = this.lastSeenX > this.x ? 1 : -1;
    this.x += dir * this.chaseSpeed * dt;
    this.facingRight = dir > 0;

    this.chaseTimer -= dt;

    // Comprobar si alcanza al jugador
    if (rectsCollide(
      { x: this.x, y: this.y, w: this.w, h: this.h },
      { x: Player.x, y: Player.y, w: Player.w, h: Player.h }
    )) {
      if (!Player.isHiding) {
        Player.takeDamage();
      }
    }

    // Perdió al jugador
    if (this.chaseTimer <= 0) {
      this.state = 'search';
      this.searchTimer = this.searchDuration;
      // Golpea la pared (personalidad)
      this.wallHit();
    }
  },

  updateSearch(dt) {
    // Buscar en la última posición conocida
    const dist = Math.abs(this.x - this.lastSeenX);
    if (dist > 20) {
      const dir = this.lastSeenX > this.x ? 1 : -1;
      this.x += dir * this.speed * 0.7 * dt;
      this.facingRight = dir > 0;
    } else {
      // Mirar alrededor
      this.facingRight = Math.sin(GameState.gameTime * 2) > 0;
    }

    this.searchTimer -= dt;
    if (this.searchTimer <= 0) {
      this.state = 'patrol';
    }
  },

  updateStunned(dt) {
    this.stunTimer -= dt;
    if (this.stunTimer <= 0) {
      this.state = 'search';
      this.searchTimer = this.searchDuration;
    }
  },

  canSeePlayer() {
    if (Player.isHiding) return false;
    
    const dist = distance(this.x, this.y, Player.x, Player.y);
    if (dist > this.visionRange) return false;

    // Comprobar dirección
    const dx = Player.x - this.x;
    if (this.facingRight && dx < 0) return false;
    if (!this.facingRight && dx > 0) return false;

    // La linterna encendida aumenta la detección
    if (Flashlight.active) {
      return dist < this.visionRange * 1.3;
    }

    return true;
  },

  stun() {
    this.state = 'stunned';
    this.stunTimer = this.stunDuration;
  },

  wallHit() {
    AudioSystem.playTone(80, 0.3, 'square');
    this.wallHitTimer = 1;
  },

  // Reaccionar a señuelo
  reactToDecoy(decoyX, decoyY) {
    if (this.state === 'stunned') return;
    this.lastSeenX = decoyX;
    this.lastSeenY = decoyY;
    this.state = 'search';
    this.searchTimer = this.searchDuration;
  },

  render(ctx) {
    if (!this.active) return;
    if (this.zone !== GameState.currentZone) return;

    const camX = GameMap.camera.x;
    const drawX = this.x - camX;
    const drawY = this.y;

    ctx.save();
    ctx.translate(drawX + this.w / 2, drawY + this.h / 2);
    if (!this.facingRight) ctx.scale(-1, 1);

    // Cuerpo de Finn corrupto
    const isStunned = this.state === 'stunned';
    
    // Cuerpo
    ctx.fillStyle = isStunned ? '#333' : '#1a3a5c';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

    // Gorro (estilo AT pero corrupto)
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(0, -this.h / 2, 14, Math.PI, 0);
    ctx.fill();
    // Orejas del gorro
    ctx.fillRect(-14, -this.h / 2 - 5, 6, 15);
    ctx.fillRect(8, -this.h / 2 - 5, 6, 15);

    // Cara corrupta
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(0, -this.h / 2 + 18, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ojos rojos
    ctx.fillStyle = this.state === 'chase' ? '#ff0000' : '#880000';
    ctx.beginPath();
    ctx.arc(-4, -this.h / 2 + 16, 3, 0, Math.PI * 2);
    ctx.arc(4, -this.h / 2 + 16, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa torcida
    ctx.strokeStyle = '#440000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -this.h / 2 + 22, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Espada corrupta
    ctx.fillStyle = '#4a0080';
    ctx.fillRect(this.w / 2 - 4, -10, 4, 30);
    ctx.fillStyle = '#8800ff';
    ctx.fillRect(this.w / 2 - 6, -14, 8, 6);

    // Efecto de corrupción
    if (this.state === 'chase') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 25 + i * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Indicador de estado (debug visual sutil)
    if (this.state === 'chase') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(drawX + this.w / 2, drawY - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
