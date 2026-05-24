// ============================================
// NIGHTMARE TIME - Sistema de Estrés Visual
// ============================================

const StressSystem = {
  level: 0, // 0 = calma, 1 = máximo estrés
  targetLevel: 0,
  shakeIntensity: 0,
  shakeX: 0,
  shakeY: 0,
  breathRate: 1,
  vignetteEl: null,

  init() {
    this.level = 0;
    this.targetLevel = 0;
    this.vignetteEl = document.getElementById('stress-vignette');
  },

  update(dt) {
    // Calcular estrés basado en proximidad de enemigos
    this.targetLevel = this.calculateStress();

    // Suavizar transición
    this.level = lerp(this.level, this.targetLevel, dt * 2);

    // Shake de cámara
    if (this.level > 0.5) {
      this.shakeIntensity = (this.level - 0.5) * 6;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Respiración acelerada
    this.breathRate = lerp(1, 3, this.level);

    // Actualizar viñeta
    if (this.vignetteEl) {
      if (this.level > 0.2) {
        this.vignetteEl.classList.add('active');
        this.vignetteEl.style.opacity = this.level * 0.8;
      } else {
        this.vignetteEl.classList.remove('active');
      }
    }

    // Actualizar audio
    AudioSystem.updateTension(this.level);
  },

  calculateStress() {
    let stress = 0;
    const px = Player.x + Player.w / 2;
    const py = Player.y + Player.h / 2;

    // Estrés por Finn
    if (AIFinn.active && AIFinn.zone === GameState.currentZone) {
      const dist = distance(px, py, AIFinn.x, AIFinn.y);
      if (dist < 400) {
        stress += (1 - dist / 400) * 0.7;
      }
      if (AIFinn.state === 'chase') {
        stress += 0.4;
      }
    }

    // Estrés por Jake
    if (AIJake.active && AIJake.zone === GameState.currentZone) {
      const dist = distance(px, py, AIJake.x, AIJake.y);
      if (dist < 300) {
        stress += (1 - dist / 300) * 0.5;
      }
    }

    // Estrés por Rey Hielo
    if (AIReyHielo.active && AIReyHielo.zone === GameState.currentZone) {
      const dist = distance(px, py, AIReyHielo.x, AIReyHielo.y);
      if (dist < 350) {
        stress += (1 - dist / 350) * 0.4;
      }
    }

    // Estrés por oscuridad (sin linterna)
    if (!Flashlight.active) {
      stress += 0.1;
    }

    // Estrés por batería baja
    if (Flashlight.isLow) {
      stress += 0.15;
    }

    return clamp(stress, 0, 1);
  },

  addStress(amount) {
    this.targetLevel = clamp(this.targetLevel + amount, 0, 1);
  },

  render(ctx) {
    if (this.level < 0.1) return;

    // Aplicar shake
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Efecto de distorsión en bordes
    const intensity = this.level;
    
    // Bordes oscuros pulsantes
    const gradient = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.3,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.7
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(20, 0, 30, ${intensity * 0.6})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Efecto de respiración (pantalla pulsa)
    const breathPulse = Math.sin(GameState.gameTime * this.breathRate * Math.PI) * intensity * 0.03;
    ctx.fillStyle = `rgba(80, 0, 0, ${breathPulse > 0 ? breathPulse : 0})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.restore();
  }
};
