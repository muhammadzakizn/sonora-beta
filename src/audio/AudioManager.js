export default class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sources = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;

    if (this.ctx.state === 'suspended') {
      const resume = () => {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        window.removeEventListener('pointerdown', resume);
      };
      window.addEventListener('pointerdown', resume);
    }
  }

  async addOscillatorSource(key, opts = {}) {
    await this.init();
    if (this.sources.has(key)) this.removeSource(key);
    const osc = this.ctx.createOscillator();
    osc.type = opts.type || 'sine';
    osc.frequency.value = opts.frequency || 220;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = opts.volume ?? 0.5;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';
    panner.setPosition(opts.x ?? 0, opts.y ?? 0, opts.z ?? -1);

    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.masterGain);

    osc.start();

    this.sources.set(key, {oscillator: osc, gainNode, panner});
  }

  setVolume(key, value) {
    const s = this.sources.get(key);
    if (!s) return;
    s.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    s.gainNode.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.05);
  }

  setPosition(key, x,y,z) {
    const s = this.sources.get(key);
    if (!s) return;
    s.panner.setPosition(x, y, z);
  }

  removeSource(key) {
    const s = this.sources.get(key);
    if (!s) return;
    try { if (s.oscillator) s.oscillator.stop(0); if (s.bufferSource) s.bufferSource.stop(0); } catch(_) {}
    try { if (s.oscillator) s.oscillator.disconnect(); } catch(_) {}
    try { if (s.bufferSource) s.bufferSource.disconnect(); } catch(_) {}
    try { s.gainNode.disconnect(); s.panner.disconnect(); } catch(_) {}
    this.sources.delete(key);
  }

  stopAll() {
    for (const key of Array.from(this.sources.keys())) this.removeSource(key);
  }

  destroy() {
    this.stopAll();
    try { this.masterGain.disconnect(); } catch(_) {}
    if (this.ctx) { try { this.ctx.close(); } catch(_) {} this.ctx = null; }
    this.initialized = false;
  }
}
