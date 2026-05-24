// ============================================
// NIGHTMARE TIME - Sistema de Cinemáticas
// ============================================

const CutsceneSystem = {
  active: false,
  currentCutscene: null,
  lines: [],
  currentLine: 0,
  charIndex: 0,
  charTimer: 0,
  charSpeed: 0.04, // Segundos por carácter
  lineDelay: 2,
  lineDelayTimer: 0,
  fadeIn: false,
  fadeOut: false,
  fadeTimer: 0,
  fadeDuration: 1.5,
  finished: false,

  overlay: null,
  textEl: null,

  init() {
    this.overlay = document.getElementById('cutscene-overlay');
    this.textEl = document.getElementById('cutscene-text');
    this.active = false;
  },

  play(endingId) {
    const data = EndingsSystem.getEndingData(endingId);
    if (!data) return;

    this.active = true;
    this.currentCutscene = data;
    this.lines = [data.title, '', ...data.lines];
    this.currentLine = 0;
    this.charIndex = 0;
    this.charTimer = 0;
    this.fadeIn = true;
    this.fadeTimer = 0;
    this.finished = false;

    // Mostrar overlay
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      this.overlay.style.opacity = 0;
    }
    if (this.textEl) {
      this.textEl.style.color = data.color;
      this.textEl.innerHTML = '';
    }
  },

  update(dt) {
    if (!this.active) return;

    // Fade in
    if (this.fadeIn) {
      this.fadeTimer += dt;
      const progress = Math.min(1, this.fadeTimer / this.fadeDuration);
      if (this.overlay) {
        this.overlay.style.opacity = progress;
      }
      if (progress >= 1) {
        this.fadeIn = false;
        this.fadeTimer = 0;
      }
      return;
    }

    // Fade out (al final)
    if (this.fadeOut) {
      this.fadeTimer += dt;
      const progress = Math.min(1, this.fadeTimer / this.fadeDuration);
      if (this.overlay) {
        this.overlay.style.opacity = 1 - progress;
      }
      if (progress >= 1) {
        this.active = false;
        if (this.overlay) {
          this.overlay.classList.add('hidden');
        }
        this.showCredits();
      }
      return;
    }

    // Mostrar texto línea por línea con efecto typewriter
    if (this.currentLine >= this.lines.length) {
      // Esperar y hacer fade out
      this.lineDelayTimer += dt;
      if (this.lineDelayTimer >= 3) {
        this.fadeOut = true;
        this.fadeTimer = 0;
      }
      return;
    }

    const line = this.lines[this.currentLine];

    if (line === '') {
      // Línea vacía = pausa
      this.lineDelayTimer += dt;
      if (this.lineDelayTimer >= 1) {
        this.lineDelayTimer = 0;
        this.currentLine++;
        this.charIndex = 0;
      }
      return;
    }

    // Typewriter
    this.charTimer += dt;
    if (this.charTimer >= this.charSpeed) {
      this.charTimer = 0;
      this.charIndex++;

      if (this.charIndex >= line.length) {
        // Línea completa, esperar
        this.lineDelayTimer += dt;
        if (this.lineDelayTimer >= this.lineDelay) {
          this.lineDelayTimer = 0;
          this.currentLine++;
          this.charIndex = 0;
          this.updateDisplay();
        }
      }

      this.updateDisplay();
    } else if (this.charIndex < line.length) {
      // Seguir esperando
      if (this.charIndex >= line.length) {
        this.lineDelayTimer += dt;
        if (this.lineDelayTimer >= this.lineDelay) {
          this.lineDelayTimer = 0;
          this.currentLine++;
          this.charIndex = 0;
        }
      }
    }
  },

  updateDisplay() {
    if (!this.textEl) return;
    
    const line = this.lines[this.currentLine];
    if (!line) return;

    const visibleText = line.substring(0, this.charIndex);
    
    // Título más grande
    if (this.currentLine === 0) {
      this.textEl.innerHTML = `<h1 style="font-size:48px;margin-bottom:20px;text-shadow:0 0 20px ${this.currentCutscene.color}">${visibleText}</h1>`;
    } else {
      // Mostrar últimas 4 líneas
      let html = '';
      const startLine = Math.max(2, this.currentLine - 3);
      for (let i = startLine; i < this.currentLine; i++) {
        if (this.lines[i]) {
          html += `<p style="opacity:0.5;margin:8px 0;">${this.lines[i]}</p>`;
        }
      }
      html += `<p style="margin:8px 0;">${visibleText}<span style="animation:flicker 0.5s infinite">|</span></p>`;
      this.textEl.innerHTML = html;
    }
  },

  showCredits() {
    if (!this.overlay || !this.textEl) return;
    
    this.overlay.classList.remove('hidden');
    this.overlay.style.opacity = 1;
    
    this.textEl.innerHTML = `
      <h2 style="color:#a855f7;margin-bottom:30px;">NIGHTMARE TIME</h2>
      <p style="color:#888;margin:10px 0;">Un juego de terror basado en Adventure Time</p>
      <p style="color:#666;margin:10px 0;">Diseñado por Antonio</p>
      <br>
      <p style="color:#555;margin:10px 0;">Final desbloqueado: ${this.currentCutscene.title}</p>
      <br><br>
      <p style="color:#444;font-size:14px;">Pulsa cualquier tecla para volver al menú</p>
    `;

    // Esperar tecla para volver al menú
    const handler = () => {
      document.removeEventListener('keydown', handler);
      location.reload();
    };
    setTimeout(() => {
      document.addEventListener('keydown', handler);
    }, 2000);
  },

  render(ctx) {
    // La cinemática usa el DOM overlay, no el canvas
  }
};
