// ============================================
// NIGHTMARE TIME - Sistema de Tutorial
// ============================================

const TutorialSystem = {
  active: false,
  messages: [],
  currentIndex: 0,
  fadeState: 'none', // none, fadeIn, visible, fadeOut
  timer: 0,
  fadeDuration: 0.5,
  visibleDuration: 3.5,

  init() {
    if (!GameState.firstTime) return;

    this.active = true;
    this.currentIndex = 0;
    this.fadeState = 'none';

    this.messages = [
      { title: 'Movimiento', text: 'Usa A y D para moverte por la casa.' },
      { title: 'Sigilo', text: 'Mantén Ctrl para caminar sin hacer ruido.\nMantén Shift para correr... pero alguien podría oírte.' },
      { title: 'Contener la respiración', text: 'Pulsa Q para contener la respiración unos segundos.' },
      { title: 'Esconderse', text: 'Pulsa C para esconderte rápidamente.' },
      { title: 'Linterna', text: 'Pulsa F para encender la linterna.\nPulsa R para recargarla.\nPulsa X para cambiar de modo.' },
      { title: 'Interactuar', text: 'Pulsa E para abrir puertas o activar mecanismos.' },
      { title: 'Objetos', text: 'Pulsa 1, 2, 3 o 4 para usar herramientas especiales.' },
      { title: '', text: 'Estás solo.\nEllos ya no son quienes eran.\nSobrevive.' }
    ];

    // Empezar después de un breve delay
    setTimeout(() => {
      this.showNext();
    }, 2000);
  },

  showNext() {
    if (this.currentIndex >= this.messages.length) {
      this.finish();
      return;
    }
    this.fadeState = 'fadeIn';
    this.timer = 0;
    this.updateDisplay();
  },

  updateDisplay() {
    const el = document.getElementById('tutorial-text');
    if (!el) return;

    const msg = this.messages[this.currentIndex];
    let html = '';
    if (msg.title) {
      html += `<strong style="color:#a855f7;font-size:26px;">${msg.title}</strong><br><br>`;
    }
    html += msg.text.replace(/\n/g, '<br>');
    el.innerHTML = html;
  },

  update(dt) {
    if (!this.active) return;

    this.timer += dt;

    switch (this.fadeState) {
      case 'fadeIn':
        if (this.timer >= this.fadeDuration) {
          this.fadeState = 'visible';
          this.timer = 0;
        }
        this.setOpacity(this.timer / this.fadeDuration);
        break;

      case 'visible':
        this.setOpacity(1);
        if (this.timer >= this.visibleDuration) {
          this.fadeState = 'fadeOut';
          this.timer = 0;
        }
        break;

      case 'fadeOut':
        this.setOpacity(1 - this.timer / this.fadeDuration);
        if (this.timer >= this.fadeDuration) {
          this.fadeState = 'none';
          this.timer = 0;
          this.currentIndex++;
          setTimeout(() => this.showNext(), 500);
        }
        break;
    }
  },

  setOpacity(val) {
    const el = document.getElementById('tutorial-text');
    if (el) {
      el.style.opacity = clamp(val, 0, 1);
    }
  },

  finish() {
    this.active = false;
    GameState.firstTime = false;
    const el = document.getElementById('tutorial-text');
    if (el) el.style.opacity = 0;
  },

  // Saltar tutorial
  skip() {
    this.finish();
  }
};
