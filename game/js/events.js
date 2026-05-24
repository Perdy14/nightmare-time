// ============================================
// NIGHTMARE TIME - Eventos Aleatorios
// ============================================

const RandomEvents = {
  events: [],
  cooldown: 0,
  minInterval: 8,
  maxInterval: 20,
  activeEvent: null,
  eventTimer: 0,

  init() {
    this.cooldown = randomRange(this.minInterval, this.maxInterval);
    this.events = [];
    this.activeEvent = null;
  },

  update(dt) {
    this.cooldown -= dt;

    if (this.cooldown <= 0 && !this.activeEvent) {
      this.triggerRandom();
      this.cooldown = randomRange(this.minInterval, this.maxInterval);
    }

    if (this.activeEvent) {
      this.eventTimer -= dt;
      if (this.eventTimer <= 0) {
        this.activeEvent = null;
      }
    }
  },

  triggerRandom() {
    const possibleEvents = [
      'light_flicker',
      'object_fall',
      'distant_voice',
      'shadow_cross',
      'door_creak',
      'jake_laugh',
      'finn_whisper',
      'cold_breath',
      'footsteps_above',
      'glass_break'
    ];

    const event = possibleEvents[randomInt(0, possibleEvents.length - 1)];
    this.activeEvent = event;
    this.eventTimer = randomRange(2, 5);

    // Ejecutar efecto
    switch (event) {
      case 'light_flicker':
        this.flickerLights();
        break;
      case 'object_fall':
        this.objectFall();
        break;
      case 'distant_voice':
        AudioSystem.playRandomWhisper();
        break;
      case 'shadow_cross':
        // Se renderiza en render()
        break;
      case 'door_creak':
        AudioSystem.playRandomCreak();
        break;
      case 'jake_laugh':
        AudioSystem.playJakeLaugh();
        break;
      case 'finn_whisper':
        AudioSystem.playFinnWhisper();
        break;
      case 'cold_breath':
        // Visual en render()
        break;
      case 'footsteps_above':
        this.playFootstepsAbove();
        break;
      case 'glass_break':
        AudioSystem.playTone(randomRange(2000, 4000), 0.1, 'sawtooth');
        break;
    }

    // Añadir estrés leve
    StressSystem.addStress(0.05);
  },

  flickerLights() {
    // Parpadeo temporal de la linterna
    if (Flashlight.active) {
      const originalActive = Flashlight.active;
      Flashlight.active = false;
      setTimeout(() => {
        Flashlight.active = false;
        setTimeout(() => {
          Flashlight.active = originalActive;
          setTimeout(() => {
            Flashlight.active = false;
            setTimeout(() => {
              Flashlight.active = originalActive;
            }, 100);
          }, 150);
        }, 100);
      }, 200);
    }
  },

  objectFall() {
    AudioSystem.playTone(randomRange(100, 200), 0.3, 'triangle');
    setTimeout(() => {
      AudioSystem.playTone(randomRange(60, 100), 0.2, 'triangle');
    }, 300);
  },

  playFootstepsAbove() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        AudioSystem.playFootstep(false);
      }, i * 400);
    }
  },

  render(ctx) {
    if (!this.activeEvent) return;

    const camX = GameMap.camera.x;

    switch (this.activeEvent) {
      case 'shadow_cross':
        this.renderShadowCross(ctx, camX);
        break;
      case 'cold_breath':
        this.renderColdBreath(ctx);
        break;
      case 'light_flicker':
        // Flash blanco breve
        if (this.eventTimer > 1.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(this.eventTimer - 1.5) * 0.3})`;
          ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        break;
    }
  },

  renderShadowCross(ctx, camX) {
    // Sombra que cruza el fondo
    const progress = 1 - (this.eventTimer / 3);
    const shadowX = progress * GAME_WIDTH * 1.5 - 200;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.ellipse(shadowX, 500, 40, 80, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  renderColdBreath(ctx) {
    // Aliento frío visible
    const px = Player.x - GameMap.camera.x + Player.w / 2;
    const py = Player.y;
    
    ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
    for (let i = 0; i < 3; i++) {
      const offset = Math.sin(GameState.gameTime * 2 + i) * 10;
      ctx.beginPath();
      ctx.arc(px + 20 + i * 8 + offset, py - 5 + i * 3, 4 - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
