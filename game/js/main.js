// ============================================
// NIGHTMARE TIME - Game Loop Principal
// ============================================

const Game = {
  canvas: null,
  ctx: null,
  lastTime: 0,
  running: false,
  messageQueue: [],
  messageTimer: 0,
  currentMessage: null,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    // Inicializar sistemas
    AudioSystem.init();
    GameMap.init();
    Player.init(200, 500);
    Flashlight.init();
    HidingSystem.init();
    StressSystem.init();
    RandomEvents.init();
    PuzzleSystem.init();
    CutsceneSystem.init();

    // Inicializar enemigos según zona
    this.initEnemies();

    // Mostrar menú
    this.showMenu();
  },

  showMenu() {
    const menu = document.getElementById('main-menu');
    const btn = document.getElementById('btn-start');
    
    btn.addEventListener('click', () => {
      AudioSystem.resume();
      menu.style.opacity = '0';
      menu.style.transition = 'opacity 1s';
      setTimeout(() => {
        menu.style.display = 'none';
        this.start();
      }, 1000);
    });
  },

  start() {
    this.running = true;
    GameState.running = true;
    
    // Mostrar HUD
    document.getElementById('hud').classList.add('visible');
    
    // Iniciar tutorial
    TutorialSystem.init();
    
    // Iniciar audio ambiente
    AudioSystem.startAmbient('exterior');
    
    // Game loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  },

  initEnemies() {
    AIFinn.init('sala_principal');
    AIJake.init('conducto_jake');
    AIChicle.init('cocina');
    AIReyHielo.init('camara_fria');
  },

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap delta
    this.lastTime = timestamp;

    GameState.gameTime += dt;

    // Update
    this.update(dt);

    // Render
    this.render();

    // Clear just pressed
    clearJustPressed();

    requestAnimationFrame((t) => this.loop(t));
  },

  update(dt) {
    // Si hay cinemática activa, solo actualizar eso
    if (CutsceneSystem.active) {
      CutsceneSystem.update(dt);
      return;
    }

    // Si el jugador murió
    if (!Player.alive) {
      this.handleDeath(dt);
      return;
    }

    // Generador de energía
    if (GameState.generatorActive) {
      GameState.generatorEnergy -= dt * 0.5;
      if (GameState.generatorEnergy <= 0) {
        GameState.generatorEnergy = 0;
        GameState.generatorActive = false;
        // Todo se vuelve más difícil
        GameState.difficulty = 2;
      }
    }

    // Sistemas principales
    Player.update(dt);
    GameMap.update(dt, Player.x);
    Flashlight.update(dt);
    HidingSystem.update(dt);
    StressSystem.update(dt);
    TutorialSystem.update(dt);
    RandomEvents.update(dt);
    PuzzleSystem.update(dt);

    // IA de enemigos
    AIFinn.update(dt);
    AIJake.update(dt);
    AIChicle.update(dt);
    AIReyHielo.update(dt);

    // Input: Interactuar
    if (isKeyJustPressed('KeyE')) {
      const result = Player.tryInteract();
      if (result) {
        this.handleInteraction(result);
      }
    }

    // Input: Usar objetos
    if (isKeyJustPressed('Digit1')) this.handleItemUse(Player.useItem(1));
    if (isKeyJustPressed('Digit2')) this.handleItemUse(Player.useItem(2));
    if (isKeyJustPressed('Digit3')) this.handleItemUse(Player.useItem(3));
    if (isKeyJustPressed('Digit4')) this.handleItemUse(Player.useItem(4));

    // Input: Golpear hielo (G) en cámara fría
    if (isKeyJustPressed('KeyG') && GameState.currentZone === 'camara_fria') {
      AudioSystem.playTone(200, 0.2, 'square');
      Player.noiseLevel = 0.6;
    }

    // Input: Calefactor (H) en cámara fría
    if (isKeyJustPressed('KeyH') && GameState.currentZone === 'camara_fria') {
      AIReyHielo.reactToHeater(Player.x, Player.y);
      this.showMessage('Calefactor activado. El hielo se derrite.');
    }

    // Comprobar condiciones de final
    this.checkEndingConditions();

    // Mensajes
    this.updateMessages(dt);
  },

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Si hay cinemática, no renderizar juego
    if (CutsceneSystem.active) {
      CutsceneSystem.render(ctx);
      return;
    }

    // Mapa
    GameMap.render(ctx);

    // Enemigos (detrás del jugador)
    AIChicle.render(ctx);
    AIReyHielo.render(ctx);
    AIFinn.render(ctx);
    AIJake.render(ctx);

    // Jugador
    Player.render(ctx);

    // Linterna (overlay de oscuridad)
    Flashlight.render(ctx);

    // Esconderse (overlay)
    HidingSystem.render(ctx);

    // Estrés visual
    StressSystem.render(ctx);

    // Eventos aleatorios
    RandomEvents.render(ctx);

    // Puzzles
    PuzzleSystem.render(ctx);

    // Mensajes en pantalla
    this.renderMessages(ctx);

    // Indicador de interacción
    this.renderInteractionPrompt(ctx);

    // Muerte
    if (!Player.alive) {
      this.renderDeath(ctx);
    }
  },

  handleInteraction(result) {
    switch (result.type) {
      case 'note':
        this.showMessage(result.text);
        break;
      case 'symbol':
        this.showMessage(`Símbolo ${result.total}/${GameState.totalSymbols} encontrado`);
        AudioSystem.playTone(600, 0.3, 'sine');
        break;
      case 'item_pickup':
        this.showMessage(`Recogido: ${result.name}`);
        AudioSystem.playTone(800, 0.2, 'triangle');
        break;
      case 'battery_pickup':
        this.showMessage(`Pila recogida (Total: ${result.total})`);
        AudioSystem.playTone(1000, 0.15, 'sine');
        break;
      case 'generator':
        this.showMessage(`Generador recargado: ${Math.round(result.energy)}%`);
        GameState.generatorActive = true;
        break;
      case 'core_purified':
        this.showMessage('El núcleo del Árbol ha sido purificado...');
        AudioSystem.playTone(440, 1, 'sine');
        break;
      case 'decision':
        this.showMessage(result.text);
        break;
      case 'door_locked':
        this.showMessage('Puerta cerrada. Necesitas una llave.');
        AudioSystem.playTone(100, 0.2, 'square');
        break;
      case 'door_unlocked':
        this.showMessage('Puerta desbloqueada.');
        break;
      case 'zone_change':
        // Reactivar enemigos de la nueva zona
        break;
      case 'heater_activated':
        AIReyHielo.reactToHeater(Player.x, Player.y);
        this.showMessage('Calefactor activado.');
        break;
      case 'compuerta_closed':
        this.showMessage('Compuerta del conducto cerrada.');
        AIJake.alertLevel = 0;
        break;
    }
  },

  handleItemUse(result) {
    if (!result) return;

    switch (result.type) {
      case 'decoy':
        this.showMessage('Señuelo lanzado');
        AudioSystem.playTone(500, 0.5, 'triangle');
        // Los enemigos reaccionan
        AIFinn.reactToDecoy(result.x + 200, result.y);
        AIJake.reactToDecoy(result.x + 200, result.y);
        break;
      case 'vent_close':
        this.showMessage('Conducto cerrado');
        AIJake.alertLevel = 0;
        break;
      case 'heater':
        this.showMessage('Calefactor portátil activado');
        AIReyHielo.reactToHeater(Player.x, Player.y);
        break;
      case 'rune':
        this.showMessage('Runa purificadora usada');
        AIChicle.reactToRune(Player.x, Player.y);
        AudioSystem.playTone(700, 0.5, 'sine');
        break;
    }
  },

  checkEndingConditions() {
    // Final por escape
    if (GameState.currentZone === 'exterior' && Player.x < 50 && GameState.decisions.corePurified !== undefined) {
      if (GameState.gameTime > 60) { // Al menos 1 minuto de juego
        GameState.decisions.escapedExterior = true;
        EndingsSystem.triggerEnding();
      }
    }

    // Final por purificación del núcleo (si ya se hizo todo)
    if (GameState.decisions.corePurified && GameState.decisions.symbolsFound >= GameState.totalSymbols) {
      EndingsSystem.triggerEnding();
    }
  },

  handleDeath(dt) {
    // Esperar y reiniciar
    this.deathTimer = (this.deathTimer || 0) + dt;
    if (this.deathTimer > 3) {
      this.deathTimer = 0;
      this.respawn();
    }
  },

  respawn() {
    Player.alive = true;
    Player.isHiding = false;
    HidingSystem.isHiding = false;
    // Volver a la entrada de la zona actual
    const zone = GameMap.zones[GameState.currentZone];
    if (zone && zone.doors.length > 0) {
      Player.x = zone.doors[0].spawnX || 200;
      Player.y = zone.doors[0].spawnY || 500;
    } else {
      Player.x = 200;
      Player.y = 500;
    }
    StressSystem.level = 0;
  },

  renderDeath(ctx) {
    ctx.fillStyle = `rgba(80, 0, 0, ${Math.min(0.8, (this.deathTimer || 0) * 0.3)})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#ff3333';
    ctx.font = '36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Te atraparon.', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    
    ctx.fillStyle = '#888';
    ctx.font = '16px Courier New';
    ctx.fillText('Reiniciando...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
  },

  // Sistema de mensajes
  showMessage(text) {
    this.messageQueue.push({ text, timer: 4 });
  },

  updateMessages(dt) {
    if (this.currentMessage) {
      this.currentMessage.timer -= dt;
      if (this.currentMessage.timer <= 0) {
        this.currentMessage = null;
      }
    }

    if (!this.currentMessage && this.messageQueue.length > 0) {
      this.currentMessage = this.messageQueue.shift();
    }
  },

  renderMessages(ctx) {
    if (!this.currentMessage) return;

    const alpha = Math.min(1, this.currentMessage.timer);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
    ctx.fillRect(GAME_WIDTH / 2 - 250, GAME_HEIGHT - 100, 500, 50);
    
    ctx.strokeStyle = `rgba(120, 80, 200, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(GAME_WIDTH / 2 - 250, GAME_HEIGHT - 100, 500, 50);

    ctx.fillStyle = `rgba(220, 200, 255, ${alpha})`;
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentMessage.text, GAME_WIDTH / 2, GAME_HEIGHT - 70);
  },

  renderInteractionPrompt(ctx) {
    if (Player.isHiding) return;

    // Comprobar si hay algo interactivo cerca
    const playerRect = { x: Player.x - 20, y: Player.y - 20, w: Player.w + 40, h: Player.h + 40 };
    const camX = GameMap.camera.x;

    // Puertas
    for (const door of GameMap.doors) {
      if (rectsCollide(playerRect, door)) {
        const dx = door.x - camX + door.w / 2;
        const dy = door.y - 15;
        ctx.fillStyle = 'rgba(200, 180, 255, 0.8)';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('[E] ' + (door.locked ? '🔒 Cerrada' : 'Entrar'), dx, dy);
        return;
      }
    }

    // Interactables
    for (const obj of GameMap.interactables) {
      if (rectsCollide(playerRect, obj)) {
        const dx = obj.x - camX + obj.w / 2;
        const dy = obj.y - 15;
        ctx.fillStyle = 'rgba(200, 180, 255, 0.8)';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        let label = '[E] Interactuar';
        if (obj.type === 'note') label = '[E] Leer nota';
        if (obj.type === 'item') label = '[E] Recoger';
        if (obj.type === 'battery') label = '[E] Pila';
        if (obj.type === 'generator') label = '[E] Generador';
        if (obj.type === 'core') label = '[E] Núcleo';
        if (obj.type === 'symbol') label = '[E] Símbolo';
        ctx.fillText(label, dx, dy);
        return;
      }
    }

    // Escondites
    for (const spot of GameMap.hideSpots) {
      if (rectsCollide(playerRect, spot)) {
        const dx = spot.x - camX + spot.w / 2;
        const dy = spot.y - 15;
        ctx.fillStyle = 'rgba(200, 180, 255, 0.6)';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('[C] Esconderse', dx, dy);
        return;
      }
    }
  }
};

// Iniciar cuando carga la página
window.addEventListener('load', () => {
  Game.init();
});
