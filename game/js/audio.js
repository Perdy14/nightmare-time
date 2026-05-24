// ============================================
// NIGHTMARE TIME - Sistema de Audio Dinámico
// ============================================

const AudioSystem = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  ambientGain: null,
  
  // Estado dinámico
  tensionLevel: 0, // 0 = calma, 1 = máxima tensión
  currentAmbient: null,
  heartbeatOsc: null,
  heartbeatActive: false,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.4;
    this.ambientGain.connect(this.masterGain);
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Generar tono procedural
  playTone(freq, duration, type = 'sine', gainNode = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(gainNode || this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // Sonido de pasos
  playFootstep(running = false) {
    const freq = running ? randomRange(80, 120) : randomRange(40, 70);
    const dur = running ? 0.05 : 0.08;
    this.playTone(freq, dur, 'triangle');
  },

  // Sonido de linterna
  playFlashlightClick() {
    this.playTone(2000, 0.02, 'square');
    setTimeout(() => this.playTone(1500, 0.03, 'square'), 30);
  },

  // Sonido de cambio de pila
  playBatteryChange() {
    this.playTone(800, 0.05, 'square');
    setTimeout(() => this.playTone(600, 0.08, 'square'), 60);
    setTimeout(() => this.playTone(1000, 0.04, 'square'), 130);
  },

  // Sonido de puerta
  playDoorOpen() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(randomRange(100, 200), 0.1, 'sawtooth');
      }, i * 40);
    }
  },

  // Sonido de esconderse
  playHide() {
    this.playTone(150, 0.15, 'triangle');
  },

  // Latido del corazón (tensión)
  startHeartbeat() {
    if (this.heartbeatActive) return;
    this.heartbeatActive = true;
    this._heartbeatLoop();
  },

  _heartbeatLoop() {
    if (!this.heartbeatActive) return;
    this.playTone(60, 0.1, 'sine');
    setTimeout(() => {
      this.playTone(50, 0.08, 'sine');
    }, 150);
    const interval = lerp(800, 400, this.tensionLevel);
    setTimeout(() => this._heartbeatLoop(), interval);
  },

  stopHeartbeat() {
    this.heartbeatActive = false;
  },

  // Ambiente procedural
  startAmbient(zone) {
    if (!this.ctx) return;
    // Crear ruido de fondo suave
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    if (this.currentAmbient) {
      this.currentAmbient.stop();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = zone === 'sotano' ? 200 : 400;
    
    source.connect(filter);
    filter.connect(this.ambientGain);
    source.start();
    this.currentAmbient = source;
  },

  // Sonidos de enemigos
  playFinnWhisper() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(randomRange(200, 400), 0.3, 'sine');
      }, i * 200);
    }
  },

  playJakeLaugh() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(randomRange(300, 600), 0.15, 'triangle');
      }, i * 100);
    }
  },

  playChicleSquish() {
    this.playTone(randomRange(50, 100), 0.3, 'sawtooth');
  },

  playReyHieloSing() {
    const notes = [440, 494, 523, 587, 523, 494, 440];
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.playTone(note, 0.2, 'sine');
      }, i * 180);
    });
  },

  // Actualizar tensión dinámica
  updateTension(level) {
    this.tensionLevel = clamp(level, 0, 1);
    if (this.musicGain) {
      this.musicGain.gain.value = lerp(0.2, 0.6, this.tensionLevel);
    }
    if (this.tensionLevel > 0.6 && !this.heartbeatActive) {
      this.startHeartbeat();
    } else if (this.tensionLevel < 0.3 && this.heartbeatActive) {
      this.stopHeartbeat();
    }
  },

  // Evento aleatorio sonoro
  playRandomCreak() {
    this.playTone(randomRange(80, 150), randomRange(0.2, 0.5), 'sawtooth');
  },

  playRandomWhisper() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(randomRange(1000, 3000), 0.05, 'sine');
      }, i * 50);
    }
  }
};
