// ============================================
// NIGHTMARE TIME - Sistema del Jugador
// ============================================

const Player = {
  x: 200,
  y: 500,
  w: 32,
  h: 56,
  vx: 0,
  vy: 0,
  speed: 180,
  runSpeed: 320,
  sneakSpeed: 80,
  
  // Estados
  isRunning: false,
  isSneaking: false,
  isHiding: false,
  isHoldingBreath: false,
  isChangingBattery: false,
  isInteracting: false,
  facingRight: true,
  grounded: false,
  alive: true,

  // Mecánicas
  noiseLevel: 0, // 0 = silencio, 1 = máximo ruido
  breathTimer: 0,
  breathCooldown: 0,
  breathMaxDuration: 3,
  breathCooldownMax: 5,

  // Inventario
  inventory: {
    señuelos: 0,
    compuertas: 0,
    calefactores: 0,
    runas: 0,
    batteries: 3
  },

  // Animación
  animFrame: 0,
  animTimer: 0,
  stepTimer: 0,

  init(x, y) {
    this.x = x || 200;
    this.y = y || 500;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
    this.isHiding = false;
    this.noiseLevel = 0;
  },

  update(dt) {
    if (!this.alive || this.isHiding) return;
    if (this.isChangingBattery) return;

    // Movimiento horizontal
    let moveX = 0;
    if (Keys['KeyA'] || Keys['ArrowLeft']) moveX = -1;
    if (Keys['KeyD'] || Keys['ArrowRight']) moveX = 1;

    // Determinar velocidad y ruido
    this.isRunning = Keys['ShiftLeft'] || Keys['ShiftRight'];
    this.isSneaking = Keys['ControlLeft'] || Keys['ControlRight'];

    let currentSpeed = this.speed;
    this.noiseLevel = 0.3; // ruido base al moverse

    if (this.isRunning && moveX !== 0) {
      currentSpeed = this.runSpeed;
      this.noiseLevel = 1.0;
    } else if (this.isSneaking) {
      currentSpeed = this.sneakSpeed;
      this.noiseLevel = 0.05;
    }

    if (moveX === 0) {
      this.noiseLevel = 0;
    }

    // Contener respiración
    if (this.isHoldingBreath) {
      this.noiseLevel = 0;
      this.breathTimer -= dt;
      if (this.breathTimer <= 0) {
        this.isHoldingBreath = false;
        this.breathCooldown = this.breathCooldownMax;
      }
    }

    if (this.breathCooldown > 0) {
      this.breathCooldown -= dt;
    }

    // Input: contener respiración
    if (isKeyJustPressed('KeyQ') && !this.isHoldingBreath && this.breathCooldown <= 0) {
      this.isHoldingBreath = true;
      this.breathTimer = this.breathMaxDuration;
    }

    // Aplicar movimiento
    this.vx = moveX * currentSpeed;
    this.x += this.vx * dt;

    // Facing
    if (moveX > 0) this.facingRight = true;
    if (moveX < 0) this.facingRight = false;

    // Gravedad simple
    this.vy += 800 * dt;
    this.y += this.vy * dt;

    // Colisión con plataformas
    this.grounded = false;
    const zone = GameMap.currentZone;
    if (zone) {
      zone.platforms.forEach(p => {
        if (this.x + this.w > p.x && this.x < p.x + p.w &&
            this.y + this.h > p.y && this.y + this.h < p.y + p.h + 20 &&
            this.vy >= 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.grounded = true;
        }
      });
    }

    // Limitar a zona
    if (zone) {
      this.x = clamp(this.x, 0, zone.width - this.w);
    }

    // Hazards
    GameMap.hazards.forEach(h => {
      if (rectsCollide({ x: this.x, y: this.y, w: this.w, h: this.h }, h)) {
        if (h.type === 'chicle_mass' || h.type === 'ice_slow') {
          this.vx *= h.slowFactor;
          this.x += this.vx * dt * (h.slowFactor - 1);
        }
        if (h.type === 'roots_damage') {
          // Daño por raíces (visual)
          StressSystem.addStress(0.01);
        }
      }
    });

    // Sonido de pasos
    if (moveX !== 0 && this.grounded) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        AudioSystem.playFootstep(this.isRunning);
        this.stepTimer = this.isRunning ? 0.25 : 0.4;
      }
    }

    // Animación
    if (moveX !== 0) {
      this.animTimer += dt;
      if (this.animTimer > 0.15) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
    }
  },

  // Interacciones
  tryInteract() {
    const playerRect = { x: this.x - 20, y: this.y - 20, w: this.w + 40, h: this.h + 40 };

    // Puertas
    for (let i = 0; i < GameMap.doors.length; i++) {
      const door = GameMap.doors[i];
      if (rectsCollide(playerRect, door)) {
        if (door.locked) {
          if (GameState.keysCollected.includes(door.keyRequired)) {
            door.locked = false;
            AudioSystem.playDoorOpen();
            return { type: 'door_unlocked', door };
          } else {
            return { type: 'door_locked', door };
          }
        }
        AudioSystem.playDoorOpen();
        GameMap.loadZone(door.target);
        this.x = door.spawnX;
        this.y = door.spawnY;
        return { type: 'zone_change', zone: door.target };
      }
    }

    // Objetos interactivos
    for (let i = GameMap.interactables.length - 1; i >= 0; i--) {
      const obj = GameMap.interactables[i];
      if (rectsCollide(playerRect, obj)) {
        return this.handleInteractable(obj, i);
      }
    }

    return null;
  },

  handleInteractable(obj, index) {
    switch (obj.type) {
      case 'note':
        return { type: 'note', text: obj.text };

      case 'symbol':
        GameMap.interactables.splice(index, 1);
        GameState.decisions.symbolsFound++;
        return { type: 'symbol', id: obj.id, total: GameState.decisions.symbolsFound };

      case 'item':
        GameMap.interactables.splice(index, 1);
        if (obj.item === 'señuelo') this.inventory.señuelos++;
        else if (obj.item === 'runa') this.inventory.runas++;
        else if (obj.item === 'llave_sotano') GameState.keysCollected.push('llave_sotano');
        return { type: 'item_pickup', item: obj.item, name: obj.name };

      case 'battery':
        GameMap.interactables.splice(index, 1);
        this.inventory.batteries++;
        return { type: 'battery_pickup', total: this.inventory.batteries };

      case 'generator':
        GameState.generatorEnergy = Math.min(100, GameState.generatorEnergy + 40);
        GameState.decisions.generatorUsed++;
        return { type: 'generator', energy: GameState.generatorEnergy };

      case 'core':
        GameState.decisions.corePurified = true;
        return { type: 'core_purified' };

      case 'decision':
        if (obj.id === 'help_finn') GameState.decisions.finnHelped = true;
        if (obj.id === 'stop_rey') GameState.decisions.reyHieloStopped = true;
        GameMap.interactables.splice(index, 1);
        return { type: 'decision', id: obj.id, text: obj.text };

      case 'heater':
        return { type: 'heater_activated' };

      case 'compuerta':
        return { type: 'compuerta_closed' };

      default:
        return null;
    }
  },

  // Usar objetos especiales
  useItem(slot) {
    switch (slot) {
      case 1: // Señuelo
        if (this.inventory.señuelos > 0) {
          this.inventory.señuelos--;
          return { type: 'decoy', x: this.x, y: this.y };
        }
        break;
      case 2: // Compuerta
        if (this.inventory.compuertas > 0) {
          this.inventory.compuertas--;
          return { type: 'vent_close' };
        }
        break;
      case 3: // Calefactor
        if (this.inventory.calefactores > 0) {
          this.inventory.calefactores--;
          return { type: 'heater' };
        }
        break;
      case 4: // Runa
        if (this.inventory.runas > 0) {
          this.inventory.runas--;
          return { type: 'rune' };
        }
        break;
    }
    return null;
  },

  takeDamage() {
    this.alive = false;
  },

  render(ctx) {
    if (!this.alive) return;
    if (this.isHiding) return; // No se ve si está escondido

    const camX = GameMap.camera.x;
    const drawX = this.x - camX;
    const drawY = this.y;

    ctx.save();

    // Cuerpo del jugador (estilo cartoon simple)
    if (this.facingRight) {
      ctx.translate(drawX + this.w / 2, drawY + this.h / 2);
    } else {
      ctx.translate(drawX + this.w / 2, drawY + this.h / 2);
      ctx.scale(-1, 1);
    }

    // Cuerpo
    ctx.fillStyle = this.isHoldingBreath ? '#4488aa' : '#556677';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

    // Cabeza
    ctx.fillStyle = '#88aacc';
    ctx.beginPath();
    ctx.arc(0, -this.h / 2 + 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Ojos
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -this.h / 2 + 6, 3, 0, Math.PI * 2);
    ctx.arc(4, -this.h / 2 + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-4, -this.h / 2 + 6, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -this.h / 2 + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Piernas (animación)
    const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4;
    ctx.fillStyle = '#334455';
    ctx.fillRect(-8, this.h / 2 - 16, 6, 16 + legOffset);
    ctx.fillRect(2, this.h / 2 - 16, 6, 16 - legOffset);

    // Indicador de respiración contenida
    if (this.isHoldingBreath) {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 25 + Math.sin(GameState.gameTime * 5) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
};
