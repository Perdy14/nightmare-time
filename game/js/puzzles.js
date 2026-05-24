// ============================================
// NIGHTMARE TIME - Puzzles Ambientales
// ============================================

const PuzzleSystem = {
  activePuzzles: [],
  solvedPuzzles: [],
  notifications: [],

  init() {
    this.activePuzzles = [
      {
        id: 'rune_sequence',
        zone: 'sotano',
        type: 'sequence',
        description: 'Activa las runas en el orden correcto',
        sequence: [3, 1, 5, 2, 4],
        currentStep: 0,
        solved: false
      },
      {
        id: 'generator_fuses',
        zone: 'sotano',
        type: 'collect',
        description: 'Encuentra los 3 fusibles para el generador',
        required: 3,
        collected: 0,
        solved: false
      },
      {
        id: 'ice_door',
        zone: 'camara_fria',
        type: 'action',
        description: 'Descongela la puerta usando el calefactor',
        solved: false
      },
      {
        id: 'uv_trail',
        zone: 'pasillo',
        type: 'follow',
        description: 'Sigue las huellas UV hasta el símbolo oculto',
        solved: false
      },
      {
        id: 'light_pattern',
        zone: 'sala_principal',
        type: 'pattern',
        description: 'Reproduce el patrón de luz',
        pattern: ['on', 'off', 'on', 'on', 'off'],
        currentStep: 0,
        solved: false
      }
    ];
    this.solvedPuzzles = [];
    this.notifications = [];
  },

  update(dt) {
    // Actualizar notificaciones
    this.notifications = this.notifications.filter(n => {
      n.timer -= dt;
      return n.timer > 0;
    });
  },

  // Intentar avanzar en un puzzle
  attemptPuzzle(puzzleId, action) {
    const puzzle = this.activePuzzles.find(p => p.id === puzzleId);
    if (!puzzle || puzzle.solved) return null;

    switch (puzzle.type) {
      case 'sequence':
        return this.handleSequence(puzzle, action);
      case 'collect':
        return this.handleCollect(puzzle, action);
      case 'action':
        return this.handleAction(puzzle, action);
      case 'pattern':
        return this.handlePattern(puzzle, action);
      default:
        return null;
    }
  },

  handleSequence(puzzle, symbolId) {
    if (puzzle.sequence[puzzle.currentStep] === symbolId) {
      puzzle.currentStep++;
      if (puzzle.currentStep >= puzzle.sequence.length) {
        return this.solvePuzzle(puzzle);
      }
      this.notify('Runa correcta... ' + puzzle.currentStep + '/' + puzzle.sequence.length);
      return { type: 'progress', step: puzzle.currentStep };
    } else {
      puzzle.currentStep = 0;
      this.notify('Secuencia incorrecta. Reiniciando...');
      return { type: 'reset' };
    }
  },

  handleCollect(puzzle, item) {
    puzzle.collected++;
    if (puzzle.collected >= puzzle.required) {
      return this.solvePuzzle(puzzle);
    }
    this.notify('Fusible ' + puzzle.collected + '/' + puzzle.required);
    return { type: 'progress', collected: puzzle.collected };
  },

  handleAction(puzzle, action) {
    if (action === 'activate') {
      return this.solvePuzzle(puzzle);
    }
    return null;
  },

  handlePattern(puzzle, action) {
    const expected = puzzle.pattern[puzzle.currentStep];
    if (action === expected) {
      puzzle.currentStep++;
      if (puzzle.currentStep >= puzzle.pattern.length) {
        return this.solvePuzzle(puzzle);
      }
      return { type: 'progress', step: puzzle.currentStep };
    } else {
      puzzle.currentStep = 0;
      this.notify('Patrón incorrecto.');
      return { type: 'reset' };
    }
  },

  solvePuzzle(puzzle) {
    puzzle.solved = true;
    this.solvedPuzzles.push(puzzle.id);
    this.notify('¡Puzzle resuelto: ' + puzzle.description + '!');
    
    // Recompensas
    switch (puzzle.id) {
      case 'rune_sequence':
        // Debilita al árbol
        GameState.decisions.symbolsFound += 2;
        break;
      case 'generator_fuses':
        GameState.generatorEnergy = 100;
        break;
      case 'ice_door':
        // Desbloquea acceso
        break;
    }

    return { type: 'solved', puzzle: puzzle.id };
  },

  notify(text) {
    this.notifications.push({ text, timer: 3 });
  },

  render(ctx) {
    // Renderizar notificaciones
    this.notifications.forEach((n, i) => {
      const alpha = Math.min(1, n.timer);
      ctx.fillStyle = `rgba(150, 100, 255, ${alpha * 0.8})`;
      ctx.font = '14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, GAME_WIDTH / 2, 80 + i * 25);
    });

    // Renderizar huellas UV si la linterna está en modo UV
    if (Flashlight.mode === 'uv' && Flashlight.active) {
      this.renderUVTrails(ctx);
    }
  },

  renderUVTrails(ctx) {
    if (GameState.currentZone !== 'pasillo') return;
    
    const camX = GameMap.camera.x;
    const px = Player.x + Player.w / 2;
    
    // Huellas visibles solo con UV
    const trails = [
      { x: 200, y: 580 }, { x: 260, y: 578 },
      { x: 320, y: 580 }, { x: 380, y: 576 },
      { x: 440, y: 580 }, { x: 500, y: 578 }
    ];

    trails.forEach(t => {
      const dist = distance(px, Player.y, t.x, t.y);
      if (dist < Flashlight.uvRevealRadius) {
        ctx.fillStyle = 'rgba(180, 0, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(t.x - camX, t.y, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
};
