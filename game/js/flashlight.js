// ============================================
// NIGHTMARE TIME - Sistema de Linterna con Modos
// ============================================

const Flashlight = {
  active: false,
  mode: 'normal', // normal, uv, parpadeo
  modes: ['normal', 'uv', 'parpadeo'],
  modeIndex: 0,

  // Batería
  battery: 100,
  drainRate: 1.8, // % por segundo (dura ~55 segundos)
  isLow: false,
  flickering: false,
  flickerTimer: 0,

  // Cambio de pila
  changingBattery: false,
  changeTimer: 0,
  changeDuration: 0.5,

  // Parpadeo mode
  flashCooldown: 0,
  flashCooldownMax: 3,
  flashActive: false,
  flashDuration: 0.5,
  flashTimer: 0,

  // Visual
  lightRadius: 200,
  lightAngle: 0,
  uvRevealRadius: 150,

  init() {
    this.active = false;
    this.battery = 100;
    this.mode = 'normal';
    this.modeIndex = 0;
  },

  update(dt) {
    // Toggle linterna
    if (isKeyJustPressed('KeyF') && !this.changingBattery) {
      this.active = !this.active;
      AudioSystem.playFlashlightClick();
    }

    // Cambiar modo
    if (isKeyJustPressed('KeyX') && this.active) {
      this.modeIndex = (this.modeIndex + 1) % this.modes.length;
      this.mode = this.modes[this.modeIndex];
      AudioSystem.playFlashlightClick();
    }

    // Solo gastar batería si está encendida
    if (this.active) {
      let drain = this.drainRate;
      if (this.mode === 'uv') drain *= 1.5; // UV gasta más
      
      this.battery -= drain * dt;
      this.battery = Math.max(0, this.battery);

      // Parpadeo cuando baja
      this.isLow = this.battery <= 20;
      if (this.isLow) {
        this.flickerTimer += dt;
        this.flickering = Math.sin(this.flickerTimer * 15) > 0.3;
      } else {
        this.flickering = false;
      }

      // Se apaga si llega a 0
      if (this.battery <= 0) {
        this.active = false;
        this.battery = 0;
      }
    }

    // Modo parpadeo (flash)
    if (this.mode === 'parpadeo' && this.active) {
      if (isKeyJustPressed('KeyF') && this.flashCooldown <= 0) {
        this.flashActive = true;
        this.flashTimer = this.flashDuration;
        this.flashCooldown = this.flashCooldownMax;
        this.battery -= 5; // Gasta extra
      }
    }

    if (this.flashActive) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashActive = false;
      }
    }

    if (this.flashCooldown > 0) {
      this.flashCooldown -= dt;
    }

    // Cambiar pila (R)
    if (isKeyJustPressed('KeyR') && !this.changingBattery && Player.inventory.batteries > 0) {
      this.changingBattery = true;
      this.changeTimer = this.changeDuration;
      this.active = false;
      Player.isChangingBattery = true;
      AudioSystem.playBatteryChange();
      // El clic atrae a Jake
      Player.noiseLevel = 0.7;
    }

    if (this.changingBattery) {
      this.changeTimer -= dt;
      if (this.changeTimer <= 0) {
        this.changingBattery = false;
        Player.isChangingBattery = false;
        Player.inventory.batteries--;
        this.battery = 100;
        this.isLow = false;
        Player.noiseLevel = 0;
      }
    }

    // Actualizar HUD
    this.updateHUD();
  },

  updateHUD() {
    const fill = document.getElementById('battery-fill');
    const modeText = document.getElementById('flashlight-mode');
    const countText = document.getElementById('battery-count');

    if (fill) {
      fill.style.width = this.battery + '%';
      if (this.isLow) {
        fill.classList.add('low');
      } else {
        fill.classList.remove('low');
      }
    }

    if (modeText) {
      modeText.textContent = this.active ? this.mode.toUpperCase() : 'OFF';
    }

    if (countText) {
      countText.textContent = Player.inventory.batteries;
    }
  },

  // Renderizar luz
  render(ctx) {
    if (!this.active || this.flickering) {
      // Oscuridad total
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      return;
    }

    const camX = GameMap.camera.x;
    const px = Player.x - camX + Player.w / 2;
    const py = Player.y + Player.h / 2;

    // Crear máscara de oscuridad con agujero de luz
    ctx.save();

    // Oscuridad base
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Recortar zona iluminada
    ctx.globalCompositeOperation = 'destination-out';

    let radius = this.lightRadius;
    let color1, color2;

    switch (this.mode) {
      case 'normal':
        color1 = 'rgba(255, 255, 200, 1)';
        color2 = 'rgba(255, 255, 200, 0)';
        break;
      case 'uv':
        radius = this.uvRevealRadius;
        color1 = 'rgba(150, 0, 255, 1)';
        color2 = 'rgba(150, 0, 255, 0)';
        break;
      case 'parpadeo':
        radius = this.flashActive ? 350 : this.lightRadius * 0.8;
        color1 = 'rgba(255, 255, 255, 1)';
        color2 = 'rgba(255, 255, 255, 0)';
        break;
    }

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // Efecto UV: revelar símbolos ocultos
    if (this.mode === 'uv') {
      ctx.fillStyle = 'rgba(100, 0, 200, 0.1)';
      ctx.beginPath();
      ctx.arc(px, py, this.uvRevealRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // Comprobar si un punto está iluminado
  isPointLit(x, y) {
    if (!this.active || this.flickering) return false;
    const px = Player.x + Player.w / 2;
    const py = Player.y + Player.h / 2;
    const dist = distance(px, py, x, y);
    return dist < this.lightRadius;
  },

  // Comprobar si UV revela un punto
  isUVRevealing(x, y) {
    if (!this.active || this.mode !== 'uv') return false;
    const px = Player.x + Player.w / 2;
    const py = Player.y + Player.h / 2;
    const dist = distance(px, py, x, y);
    return dist < this.uvRevealRadius;
  }
};
