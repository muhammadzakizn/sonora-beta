import AudioManager from './audio/AudioManager.js';

const audioManager = new AudioManager();

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const sliderRain = document.getElementById('sliderRain');
const sliderWave = document.getElementById('sliderWave');
const sliderPan = document.getElementById('sliderPan');
const valRain = document.getElementById('valRain');
const valWave = document.getElementById('valWave');
const valPan = document.getElementById('valPan');

let running = false;

startBtn.addEventListener('click', async () => {
  try {
    await audioManager.init();
    await audioManager.addOscillatorSource('rain', { type: 'triangle', frequency: 120, volume: Number(sliderRain.value) });
    await audioManager.addOscillatorSource('waves', { type: 'sine', frequency: 80, volume: Number(sliderWave.value) });
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (e) {
    console.error('Failed to start audio', e);
    alert('Gagal memulai audio: ' + e.message);
  }
});

stopBtn.addEventListener('click', () => {
  audioManager.stopAll();
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

function debounce(fn, wait=60){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }

sliderRain.addEventListener('input', (e)=>{
  const v = Number(e.target.value);
  valRain.textContent = v.toFixed(2);
  if (running) debounce(()=>audioManager.setVolume('rain', v))();
});
sliderWave.addEventListener('input', (e)=>{
  const v = Number(e.target.value);
  valWave.textContent = v.toFixed(2);
  if (running) debounce(()=>audioManager.setVolume('waves', v))();
});
sliderPan.addEventListener('input', (e)=>{
  const v = Number(e.target.value);
  valPan.textContent = v;
  if (running) {
    const x = v;
    audioManager.setPosition('rain', x,0,-1);
    audioManager.setPosition('waves', -x,0,-1);
  }
});

document.addEventListener('visibilitychange', () => {
  if (!audioManager.initialized) return;
  if (document.visibilityState === 'hidden') {
    try { audioManager.masterGain.gain.linearRampToValueAtTime(0.0, audioManager.ctx.currentTime + 0.3); } catch(_) {}
  } else {
    try { audioManager.masterGain.gain.linearRampToValueAtTime(1.0, audioManager.ctx.currentTime + 0.2); } catch(_) {}
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(e => console.warn('SW reg failed', e));
}

window._sonora = { audioManager };
