// ============================================
// NIGHTMARE TIME - Sistema de Mapa
// ============================================

const GameMap = {
  zones: {},
  currentZone: null,
  camera: { x: 0, y: 0 },
  doors: [],
  hideSpots: [],
  interactables: [],
  hazards: [],

  init() {
    this.defineZones();
    this.loadZone('exterior');
  },

  defineZones() {
    // Cada zona: dimensiones, conexiones, escondites, peligros, objetos
    this.zones = {
      exterior: {
        name: 'Exterior Corrupto',
        width: 1920,
        height: 720,
        bgColor: '#0d0520',
        ambientColor: 'rgba(75, 0, 130, 0.15)',
        platforms: [
          { x: 0, y: 600, w: 1920, h: 120 } // suelo
        ],
        doors: [
          { x: 1600, y: 500, w: 60, h: 100, target: 'entrada', spawnX: 100, spawnY: 500 }
        ],
        hideSpots: [
          { x: 300, y: 520, w: 80, h: 80, type: 'arbusto' },
          { x: 900, y: 520, w: 80, h: 80, type: 'tronco' }
        ],
        interactables: [],
        hazards: [],
        decorations: [
          { type: 'tree_corrupt', x: 200, y: 350 },
          { type: 'tree_corrupt', x: 700, y: 380 },
          { type: 'roots', x: 1100, y: 550 },
          { type: 'eyes_sky', x: 500, y: 100 }
        ]
      },

      entrada: {
        name: 'Entrada Principal',
        width: 960,
        height: 720,
        bgColor: '#120828',
        ambientColor: 'rgba(100, 20, 150, 0.1)',
        platforms: [
          { x: 0, y: 600, w: 960, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'exterior', spawnX: 1500, spawnY: 500 },
          { x: 800, y: 500, w: 60, h: 100, target: 'sala_principal', spawnX: 100, spawnY: 500 }
        ],
        hideSpots: [
          { x: 400, y: 520, w: 70, h: 80, type: 'cortina' }
        ],
        interactables: [
          { x: 600, y: 450, w: 40, h: 40, type: 'note', text: 'No deberías estar aquí...' }
        ],
        hazards: [],
        decorations: [
          { type: 'door_face', x: 480, y: 400 },
          { type: 'puddle_corrupt', x: 300, y: 580 }
        ]
      },

      sala_principal: {
        name: 'Sala Principal',
        width: 1280,
        height: 720,
        bgColor: '#0f0a1a',
        ambientColor: 'rgba(80, 0, 120, 0.12)',
        platforms: [
          { x: 0, y: 600, w: 1280, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'entrada', spawnX: 750, spawnY: 500 },
          { x: 500, y: 500, w: 60, h: 100, target: 'cocina', spawnX: 100, spawnY: 500 },
          { x: 900, y: 500, w: 60, h: 100, target: 'pasillo', spawnX: 100, spawnY: 500 },
          { x: 1150, y: 500, w: 60, h: 100, target: 'sotano', spawnX: 100, spawnY: 400, locked: true, keyRequired: 'llave_sotano' }
        ],
        hideSpots: [
          { x: 250, y: 500, w: 100, h: 100, type: 'sofa' },
          { x: 700, y: 520, w: 70, h: 80, type: 'armario' }
        ],
        interactables: [
          { x: 350, y: 480, w: 40, h: 40, type: 'symbol', id: 1 },
          { x: 1050, y: 400, w: 40, h: 40, type: 'note', text: 'El árbol nos habla... nos cambia...' }
        ],
        hazards: [],
        decorations: [
          { type: 'sofa_face', x: 250, y: 480 },
          { type: 'carpet_eyes', x: 600, y: 570 }
        ],
        enemies: ['finn']
      },

      cocina: {
        name: 'Cocina Deformada',
        width: 960,
        height: 720,
        bgColor: '#1a0520',
        ambientColor: 'rgba(200, 50, 150, 0.08)',
        platforms: [
          { x: 0, y: 600, w: 960, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'sala_principal', spawnX: 450, spawnY: 500 }
        ],
        hideSpots: [
          { x: 600, y: 520, w: 80, h: 80, type: 'mesa' }
        ],
        interactables: [
          { x: 400, y: 500, w: 40, h: 40, type: 'item', item: 'señuelo', name: 'Señuelo sonoro' },
          { x: 750, y: 480, w: 40, h: 40, type: 'symbol', id: 2 }
        ],
        hazards: [
          { x: 200, y: 550, w: 200, h: 50, type: 'chicle_mass', slowFactor: 0.3 }
        ],
        decorations: [
          { type: 'fridge_teeth', x: 800, y: 400 },
          { type: 'floating_utensils', x: 500, y: 300 }
        ],
        enemies: ['chicle']
      },

      pasillo: {
        name: 'Pasillo Estrecho',
        width: 1600,
        height: 720,
        bgColor: '#080515',
        ambientColor: 'rgba(30, 0, 80, 0.2)',
        platforms: [
          { x: 0, y: 600, w: 1600, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'sala_principal', spawnX: 850, spawnY: 500 },
          { x: 700, y: 500, w: 60, h: 100, target: 'habitacion_finn', spawnX: 100, spawnY: 500 },
          { x: 1200, y: 500, w: 60, h: 100, target: 'conducto_jake', spawnX: 100, spawnY: 500 },
          { x: 1500, y: 500, w: 60, h: 100, target: 'camara_fria', spawnX: 100, spawnY: 500 }
        ],
        hideSpots: [
          { x: 400, y: 530, w: 60, h: 70, type: 'grieta' },
          { x: 1000, y: 530, w: 60, h: 70, type: 'sombra' }
        ],
        interactables: [
          { x: 900, y: 450, w: 40, h: 40, type: 'battery' }
        ],
        hazards: [],
        decorations: [
          { type: 'wall_veins', x: 0, y: 300 },
          { type: 'child_drawings', x: 500, y: 350 }
        ],
        enemies: ['finn', 'jake']
      },

      habitacion_finn: {
        name: 'Habitación de Finn',
        width: 960,
        height: 720,
        bgColor: '#1a0a0a',
        ambientColor: 'rgba(150, 0, 0, 0.1)',
        platforms: [
          { x: 0, y: 600, w: 960, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'pasillo', spawnX: 650, spawnY: 500 }
        ],
        hideSpots: [
          { x: 600, y: 480, w: 100, h: 120, type: 'cama' },
          { x: 200, y: 520, w: 70, h: 80, type: 'armario' }
        ],
        interactables: [
          { x: 450, y: 450, w: 40, h: 40, type: 'note', text: 'Finn escribió: "Ya no soy yo... ayúdame..."' },
          { x: 800, y: 500, w: 40, h: 40, type: 'item', item: 'llave_sotano', name: 'Llave del sótano' },
          { x: 350, y: 400, w: 40, h: 40, type: 'symbol', id: 3 },
          { x: 700, y: 450, w: 40, h: 40, type: 'decision', id: 'help_finn', text: '¿Intentar ayudar a Finn?' }
        ],
        hazards: [],
        decorations: [
          { type: 'poster_finn', x: 750, y: 300 },
          { type: 'toys_creepy', x: 400, y: 550 }
        ],
        enemies: ['finn']
      },

      conducto_jake: {
        name: 'Conducto de Jake',
        width: 1280,
        height: 720,
        bgColor: '#0a1005',
        ambientColor: 'rgba(0, 100, 0, 0.1)',
        platforms: [
          { x: 0, y: 600, w: 1280, h: 120 },
          { x: 200, y: 450, w: 200, h: 20 },
          { x: 600, y: 350, w: 200, h: 20 },
          { x: 900, y: 450, w: 200, h: 20 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'pasillo', spawnX: 1150, spawnY: 500 },
          { x: 1150, y: 500, w: 60, h: 100, target: 'sala_jake', spawnX: 100, spawnY: 500 }
        ],
        hideSpots: [
          { x: 450, y: 530, w: 70, h: 70, type: 'tubo' }
        ],
        interactables: [
          { x: 700, y: 320, w: 40, h: 40, type: 'item', item: 'señuelo', name: 'Señuelo sonoro' },
          { x: 300, y: 420, w: 40, h: 40, type: 'compuerta', id: 'vent_1' }
        ],
        hazards: [],
        decorations: [
          { type: 'rubber_walls', x: 0, y: 200 },
          { type: 'jake_shadows', x: 800, y: 300 }
        ],
        enemies: ['jake']
      },

      sala_jake: {
        name: 'Sala de Jake',
        width: 960,
        height: 720,
        bgColor: '#1a1400',
        ambientColor: 'rgba(200, 150, 0, 0.08)',
        platforms: [
          { x: 0, y: 600, w: 960, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'conducto_jake', spawnX: 1100, spawnY: 500 }
        ],
        hideSpots: [
          { x: 500, y: 520, w: 80, h: 80, type: 'mesa_estirada' }
        ],
        interactables: [
          { x: 700, y: 480, w: 40, h: 40, type: 'symbol', id: 4 },
          { x: 300, y: 500, w: 40, h: 40, type: 'battery' },
          { x: 800, y: 450, w: 40, h: 40, type: 'note', text: 'Jake se estira... pero ya no vuelve a su forma.' }
        ],
        hazards: [],
        decorations: [
          { type: 'stretched_objects', x: 400, y: 400 },
          { type: 'jake_multiplied', x: 600, y: 350 }
        ],
        enemies: ['jake']
      },

      sotano: {
        name: 'Sótano',
        width: 1600,
        height: 720,
        bgColor: '#050208',
        ambientColor: 'rgba(0, 50, 0, 0.15)',
        platforms: [
          { x: 0, y: 600, w: 1600, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'sala_principal', spawnX: 1100, spawnY: 500 }
        ],
        hideSpots: [
          { x: 400, y: 520, w: 80, h: 80, type: 'cajas' },
          { x: 1000, y: 520, w: 80, h: 80, type: 'sombra' }
        ],
        interactables: [
          { x: 300, y: 500, w: 60, h: 60, type: 'generator' },
          { x: 1400, y: 450, w: 80, h: 80, type: 'core', text: '¿Purificar el núcleo del Árbol?' },
          { x: 800, y: 480, w: 40, h: 40, type: 'symbol', id: 5 },
          { x: 600, y: 500, w: 40, h: 40, type: 'item', item: 'runa', name: 'Runa purificadora' }
        ],
        hazards: [
          { x: 1200, y: 550, w: 150, h: 50, type: 'roots_damage', damage: 5 }
        ],
        decorations: [
          { type: 'roots_moving', x: 1000, y: 300 },
          { type: 'corrupt_symbols', x: 700, y: 350 },
          { type: 'generator_eyes', x: 280, y: 450 }
        ],
        enemies: ['finn', 'jake']
      },

      camara_fria: {
        name: 'Cámara Fría del Rey Hielo',
        width: 1280,
        height: 720,
        bgColor: '#051525',
        ambientColor: 'rgba(0, 100, 200, 0.12)',
        platforms: [
          { x: 0, y: 600, w: 1280, h: 120 }
        ],
        doors: [
          { x: 50, y: 500, w: 60, h: 100, target: 'pasillo', spawnX: 1450, spawnY: 500 }
        ],
        hideSpots: [
          { x: 600, y: 520, w: 80, h: 80, type: 'hielo' }
        ],
        interactables: [
          { x: 400, y: 500, w: 40, h: 40, type: 'heater', id: 'heater_1' },
          { x: 900, y: 450, w: 40, h: 40, type: 'decision', id: 'stop_rey', text: '¿Detener al Rey Hielo?' },
          { x: 1100, y: 500, w: 40, h: 40, type: 'battery' }
        ],
        hazards: [
          { x: 300, y: 550, w: 400, h: 50, type: 'ice_slow', slowFactor: 0.4 },
          { x: 800, y: 550, w: 300, h: 50, type: 'ice_slow', slowFactor: 0.4 }
        ],
        decorations: [
          { type: 'ice_faces', x: 200, y: 300 },
          { type: 'crystals', x: 700, y: 250 },
          { type: 'fog_eyes', x: 1000, y: 400 }
        ],
        enemies: ['reyhielo']
      }
    };
  },

  loadZone(zoneId) {
    this.currentZone = this.zones[zoneId];
    GameState.currentZone = zoneId;
    this.doors = this.currentZone.doors || [];
    this.hideSpots = this.currentZone.hideSpots || [];
    this.interactables = [...(this.currentZone.interactables || [])];
    this.hazards = this.currentZone.hazards || [];
    AudioSystem.startAmbient(zoneId);
  },

  getZoneEnemies() {
    return this.currentZone.enemies || [];
  },

  update(dt, playerX) {
    // Cámara sigue al jugador
    const targetCamX = playerX - GAME_WIDTH / 2;
    this.camera.x = clamp(
      lerp(this.camera.x, targetCamX, 0.05),
      0,
      Math.max(0, this.currentZone.width - GAME_WIDTH)
    );
  },

  render(ctx) {
    const zone = this.currentZone;
    if (!zone) return;

    // Fondo
    ctx.fillStyle = zone.bgColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ambiente
    ctx.fillStyle = zone.ambientColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const camX = this.camera.x;

    // Plataformas
    ctx.fillStyle = '#1a1025';
    zone.platforms.forEach(p => {
      ctx.fillRect(p.x - camX, p.y, p.w, p.h);
      // Borde superior con efecto corrupto
      ctx.strokeStyle = '#3d1f6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - camX, p.y);
      for (let i = 0; i < p.w; i += 20) {
        ctx.lineTo(p.x - camX + i, p.y + Math.sin(i * 0.1 + GameState.gameTime) * 3);
      }
      ctx.stroke();
    });

    // Decoraciones
    this.renderDecorations(ctx, camX);

    // Puertas
    this.doors.forEach(d => {
      ctx.fillStyle = d.locked ? '#3d0a0a' : '#2a1545';
      ctx.fillRect(d.x - camX, d.y, d.w, d.h);
      ctx.strokeStyle = d.locked ? '#ff3333' : '#6b3fa0';
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x - camX, d.y, d.w, d.h);
      // Icono puerta
      ctx.fillStyle = '#aaa';
      ctx.font = '12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(d.locked ? '🔒' : '🚪', d.x - camX + d.w / 2, d.y + d.h / 2);
    });

    // Escondites
    this.hideSpots.forEach(h => {
      ctx.fillStyle = 'rgba(20, 10, 40, 0.8)';
      ctx.fillRect(h.x - camX, h.y, h.w, h.h);
      ctx.strokeStyle = '#4a2080';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(h.x - camX, h.y, h.w, h.h);
      ctx.setLineDash([]);
    });

    // Interactables
    this.interactables.forEach(obj => {
      ctx.fillStyle = this.getInteractableColor(obj.type);
      ctx.beginPath();
      ctx.arc(obj.x - camX + obj.w / 2, obj.y + obj.h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      // Pulso
      ctx.strokeStyle = this.getInteractableColor(obj.type);
      ctx.globalAlpha = 0.3 + Math.sin(GameState.gameTime * 3) * 0.2;
      ctx.beginPath();
      ctx.arc(obj.x - camX + obj.w / 2, obj.y + obj.h / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Hazards
    this.hazards.forEach(h => {
      if (h.type === 'chicle_mass') {
        ctx.fillStyle = 'rgba(200, 50, 150, 0.5)';
      } else if (h.type === 'ice_slow') {
        ctx.fillStyle = 'rgba(100, 180, 255, 0.3)';
      } else {
        ctx.fillStyle = 'rgba(50, 0, 80, 0.5)';
      }
      ctx.fillRect(h.x - camX, h.y, h.w, h.h);
    });
  },

  getInteractableColor(type) {
    switch (type) {
      case 'note': return '#ffcc00';
      case 'symbol': return '#ff00ff';
      case 'item': return '#00ff88';
      case 'battery': return '#44ff44';
      case 'generator': return '#00ffcc';
      case 'core': return '#ff0066';
      case 'decision': return '#ff8800';
      case 'heater': return '#ff4400';
      case 'compuerta': return '#8888ff';
      default: return '#ffffff';
    }
  },

  renderDecorations(ctx, camX) {
    const zone = this.currentZone;
    if (!zone.decorations) return;

    zone.decorations.forEach(d => {
      ctx.save();
      ctx.translate(d.x - camX, d.y);
      
      switch (d.type) {
        case 'tree_corrupt':
          this.drawCorruptTree(ctx);
          break;
        case 'roots':
          this.drawRoots(ctx);
          break;
        case 'eyes_sky':
          this.drawEyes(ctx);
          break;
        case 'puddle_corrupt':
          this.drawPuddle(ctx);
          break;
        default:
          // Placeholder genérico
          ctx.fillStyle = 'rgba(100, 0, 150, 0.3)';
          ctx.fillRect(0, 0, 60, 60);
          break;
      }
      
      ctx.restore();
    });
  },

  drawCorruptTree(ctx) {
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(20, 50, 30, 150);
    // Copa
    ctx.fillStyle = '#2d0a4e';
    ctx.beginPath();
    ctx.arc(35, 40, 50, 0, Math.PI * 2);
    ctx.fill();
    // Ojos
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(25, 35, 4, 0, Math.PI * 2);
    ctx.arc(45, 35, 4, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRoots(ctx) {
    ctx.strokeStyle = '#3d1060';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 20, 0);
      ctx.quadraticCurveTo(i * 20 + 10, 20 + Math.sin(GameState.gameTime + i) * 5, i * 20 + 30, 40);
      ctx.stroke();
    }
  },

  drawEyes(ctx) {
    const blink = Math.sin(GameState.gameTime * 0.5) > 0.9;
    if (!blink) {
      ctx.fillStyle = 'rgba(255, 0, 200, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.arc(30, 5, 5, 0, Math.PI * 2);
      ctx.arc(60, -3, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawPuddle(ctx) {
    ctx.fillStyle = 'rgba(100, 0, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(30, 10, 40 + Math.sin(GameState.gameTime) * 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};
