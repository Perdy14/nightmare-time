// ============================================
// NIGHTMARE TIME - Sistema de Esconderse Avanzado
// ============================================

const HidingSystem = {
  isHiding: false,
  currentSpot: null,
  peekActive: false,
  movementInHiding: 0, // Cuánto se mueve dentro
  discoveryRisk: 0, // 0-1, riesgo de ser descubierto
  breathHeldInHiding: false,
  hideTransitionTimer: 0,
  hideTransitionDuration: 0.3,

  // Visión limitada al espiar
  peekFOV: 120, // grados
  peekDirection: 0,

  // Sonidos amplificados
  amplifiedHearing: true,

  init() {
    this.isHiding = false;
    this.currentSpot = null;
    this.discoveryRisk = 0;
  },

  update(dt) {
    // Entrar/salir del escondite
    if (isKeyJustPressed('KeyC')) {
      if (this.isHiding) {
        this.exitHiding();
      } else {
        this.tryHide();
      }
    }

    if (!this.isHiding) return;

    // Contener respiración dentro del escondite
    if (isKeyJustPressed('KeyQ') && Player.breathCooldown <= 0) {
      this.breathHeldInHiding = true;
      Player.isHoldingBreath = true;
      Player.breathTimer = Player.breathMaxDuration;
    }

    if (Player.breathTimer <= 0 && this.breathHeldInHiding) {
      this.breathHeldInHiding = false;
    }

    // Movimiento dentro del escondite (riesgoso)
    let moved = false;
    if (Keys['KeyA'] || Keys['KeyD']) {
      this.movementInHiding += dt * 0.5;
      moved = true;
    }

    // Riesgo de descubrimiento
    if (moved) {
      this.discoveryRisk += dt * 0.15;
    } else {
      this.discoveryRisk = Math.max(0, this.discoveryRisk - dt * 0.1);
    }

    // Si el riesgo es muy alto, el enemigo te encuentra
    if (this.discoveryRisk >= 1.0) {
      this.forceExit();
    }

    // Espiar por rendija
    this.peekActive = Keys['KeyW'];

    // Actualizar estado del jugador
    Player.isHiding = true;
    Player.noiseLevel = this.breathHeldInHiding ? 0 : (moved ? 0.3 : 0.05);

    // Registrar uso
    GameState.decisions.hidingUsed++;
  },

  tryHide() {
    const playerRect = { x: Player.x - 10, y: Player.y - 10, w: Player.w + 20, h: Player.h + 20 };
    
    for (const spot of GameMap.hideSpots) {
      if (rectsCollide(playerRect, spot)) {
        this.enterHiding(spot);
        return;
      }
    }
  },

  enterHiding(spot) {
    this.isHiding = true;
    this.currentSpot = spot;
    this.discoveryRisk = 0;
    this.movementInHiding = 0;
    Player.isHiding = true;
    Player.x = spot.x + spot.w / 2 - Player.w / 2;
    Player.y = spot.y + spot.h - Player.h;
    AudioSystem.playHide();
    this.hideTransitionTimer = this.hideTransitionDuration;
  },

  exitHiding() {
    this.isHiding = false;
    this.currentSpot = null;
    this.peekActive = false;
    this.breathHeldInHiding = false;
    Player.isHiding = false;
    Player.noiseLevel = 0.2; // Pequeño ruido al salir
  },

  forceExit() {
    this.exitHiding();
    // El enemigo te encontró
    StressSystem.addStress(0.5);
  },

  // Comprobar si un enemigo puede descubrir al jugador
  canEnemyDiscover(enemyX, enemyY, enemyDetectionRange) {
    if (!this.isHiding) return false;
    if (!this.currentSpot) return false;

    const dist = distance(enemyX, enemyY, this.currentSpot.x + this.currentSpot.w / 2, this.currentSpot.y + this.currentSpot.h / 2);
    
    // Si el enemigo está muy cerca y el jugador se mueve
    if (dist < enemyDetectionRange && this.discoveryRisk > 0.5) {
      return true;
    }

    // Si el jugador no contiene la respiración y el enemigo está cerca
    if (dist < enemyDetectionRange * 0.5 && !this.breathHeldInHiding) {
      return Math.random() < this.discoveryRisk;
    }

    return false;
  },

  render(ctx) {
    if (!this.isHiding) return;

    const camX = GameMap.camera.x;

    // Efecto visual de estar escondido
    if (!this.peekActive) {
      // Pantalla muy oscura con rendijas de luz
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Rendijas horizontales
      ctx.fillStyle = 'rgba(30, 10, 50, 0.5)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, 200 + i * 80, GAME_WIDTH, 3);
      }
    } else {
      // Visión de espiar: limitada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Apertura de visión
      const spotX = this.currentSpot.x - camX + this.currentSpot.w / 2;
      const spotY = this.currentSpot.y + this.currentSpot.h / 2;
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, 200, 60, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Indicador de riesgo
    if (this.discoveryRisk > 0.3) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.discoveryRisk * 0.5})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Texto de ayuda
    ctx.fillStyle = 'rgba(200, 180, 255, 0.6)';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('C: Salir | W: Espiar | Q: Contener respiración', GAME_WIDTH / 2, GAME_HEIGHT - 30);
  }
};
