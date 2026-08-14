// main.js - RADIOair interaction
const fileEls = [
  document.getElementById('file1'),
  document.getElementById('file2'),
  document.getElementById('file3'),
  document.getElementById('file4')
];
const statusEl = document.getElementById('status');
const container = document.getElementById('canvas-container');
const radioUI = document.getElementById('radio-ui');
const playBtns = Array.from(document.getElementsByClassName('play-btn'));
const effectBtn = document.getElementById('effectBtn');
const sitInfo = document.getElementById('sit-info');
const leftBtn = document.getElementById('leftBtn');
const forwardBtn = document.getElementById('forwardBtn');
const rightBtn = document.getElementById('rightBtn');

let audios = [null, null, null, null];
let audioStates = [false, false, false, false]; // playing?
let avatar = { x: 0, y: 0 };
const moveStep = 48;
const proximityThreshold = 120;

// create room / radio / avatar if missing
function ensureScene() {
  if (!container.querySelector('.room')) {
    const room = document.createElement('div');
    room.className = 'room';
    const radio = document.createElement('div');
    radio.className = 'radio';
    radio.innerHTML = `<div class="label">RADIO</div><div class="knobs"><div class="knob">♪</div><div class="knob">⚙</div></div>`;
    room.appendChild(radio);
    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar';
    avatarEl.id = 'avatar';
    room.appendChild(avatarEl);
    container.appendChild(room);
    // center avatar
    avatar.x = container.clientWidth / 2;
    avatar.y = container.clientHeight / 2;
    updateAvatar();
    window.addEventListener('resize', () => { avatar.x = container.clientWidth/2; avatar.y = container.clientHeight/2; updateAvatar(); });
  }
}
function getRadioRect() {
  const radio = container.querySelector('.radio');
  return radio ? radio.getBoundingClientRect() : null;
}
function getAvatarEl() { return document.getElementById('avatar'); }
function updateAvatar() {
  const el = getAvatarEl();
  if (!el) return;
  el.style.left = `${Math.round(avatar.x)}px`;
  el.style.top = `${Math.round(avatar.y)}px`;
  el.style.transform = 'translate(-50%,-50%)';
  checkProximity();
}

function checkProximity() {
  const r = getRadioRect();
  const a = getAvatarEl();
  if (!r || !a) return;
  const radioCenter = { x: r.left + r.width/2, y: r.top + r.height/2 };
  const avatarRect = a.getBoundingClientRect();
  const avatarCenter = { x: avatarRect.left + avatarRect.width/2, y: avatarRect.top + avatarRect.height/2 };
  const dx = radioCenter.x - avatarCenter.x;
  const dy = radioCenter.y - avatarCenter.y;
  const dist = Math.hypot(dx, dy);
  if (dist < proximityThreshold) {
    radioUI.classList.remove('hidden');
    statusEl.textContent = 'Status: In der Nähe des Radios. Wähle einen Song.';
  } else {
    radioUI.classList.add('hidden');
    statusEl.textContent = 'Status: Bereit. Laufe mit den Pfeiltasten zum Radio.';
  }
}

// movement
function move(dx, dy) {
  avatar.x = Math.max(20, Math.min(container.clientWidth - 20, avatar.x + dx));
  avatar.y = Math.max(20, Math.min(container.clientHeight - 20, avatar.y + dy));
  updateAvatar();
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { move(-moveStep, 0); }
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { /* we'll interpret ArrowUp as forward */ }
  if (e.key === 'ArrowLeft') move(-moveStep, 0);
  if (e.key === 'ArrowRight') move(moveStep, 0);
  if (e.key === 'ArrowUp') move(0, -moveStep);
  if (e.key === 'ArrowDown') move(0, moveStep);
});

// UI buttons
leftBtn?.addEventListener('click', () => move(-moveStep, 0));
rightBtn?.addEventListener('click', () => move(moveStep, 0));
forwardBtn?.addEventListener('click', () => move(0, -moveStep));

// file inputs -> create audio elements
fileEls.forEach((inputEl, i) => {
  if (!inputEl) return;
  inputEl.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (audios[i]) {
      audios[i].pause();
      audios[i].src = '';
      audios[i] = null;
      audioStates[i] = false;
    }
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.addEventListener('ended', () => { audioStates[i] = false; updatePlayButtons(); });
    audios[i] = audio;
    statusEl.textContent = `Status: Song ${i+1} geladen. Gehe zum Radio und drücke Song ${i+1}.`;
    updatePlayButtons();
  });
});

// play buttons
function updatePlayButtons() {
  playBtns.forEach(btn => {
    const idx = Number(btn.dataset.index);
    if (!audios[idx]) {
      btn.disabled = true;
      btn.textContent = `Song ${idx+1}`;
    } else {
      btn.disabled = false;
      btn.textContent = audioStates[idx] ? `Pause ${idx+1}` : `Song ${idx+1}`;
    }
  });
}
playBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.index);
    const a = audios[idx];
    if (!a) { statusEl.textContent = `Status: Kein Song ${idx+1} geladen.`; return; }
    if (audioStates[idx]) {
      a.pause(); audioStates[idx] = false;
    } else {
      // pause others
      audios.forEach((other, j) => { if (other && j !== idx) { other.pause(); audioStates[j] = false; }});
      a.play().catch((e) => { statusEl.textContent = 'Fehler beim Abspielen (Browser-Policy?)'; console.warn(e); });
      audioStates[idx] = true;
    }
    updatePlayButtons();
  });
});

// effect: simple fireworks (circles that expand)
function spawnFirework(xPct=50, yPct=40) {
  for (let i=0;i<12;i++){
    const f = document.createElement('div');
    f.className = 'firework';
    const size = 6 + Math.random()*18;
    f.style.width = f.style.height = `${size}px`;
    f.style.left = `${xPct}%`;
    f.style.top = `${yPct}%`;
    f.style.background = `hsl(${Math.floor(Math.random()*360)} 80% 65%)`;
    f.style.opacity = '0.95';
    container.appendChild(f);
    const angle = Math.random()*Math.PI*2;
    const dist = 40 + Math.random()*120;
    f.animate([
      { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
      { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(1.2)`, opacity: 0 }
    ], { duration: 700 + Math.random()*500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(()=> f.remove(), 1400);
  }
}
effectBtn?.addEventListener('click', () => {
  spawnFirework(50 + (Math.random()*20-10), 40 + (Math.random()*20-10));
  statusEl.textContent = 'Effekt: Feuerwerk!';
});

// init
ensureScene();
updatePlayButtons();
statusEl.textContent = 'Status: Bereit. Lade bis zu 4 Songs hoch und laufe mit den Pfeiltasten zum Radio.';
