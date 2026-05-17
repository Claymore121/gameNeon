// ---- SETUP ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameoverScreen = document.getElementById('gameoverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const bestDisplay = document.getElementById('bestDisplay');
const finalScore = document.getElementById('finalScore');
const finalBest = document.getElementById('finalBest');
const startBest = document.getElementById('startBest');
const newBest = document.getElementById('newBest');
const soundBtn = document.getElementById('soundBtn');
const skinsScreen = document.getElementById('skinsScreen');
const skinsBtn = document.getElementById('skinsBtn');
const gameoverSkinsBtn = document.getElementById('gameoverSkinsBtn');
const backBtn = document.getElementById('backBtn');
const colorGrid = document.getElementById('colorGrid');
const levelsScreen = document.getElementById('levelsScreen');
const levelsBtn = document.getElementById('levelsBtn');
const levelsBackBtn = document.getElementById('levelsBackBtn');

let W, H, GY;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  applyScale();
  if (player) player.y = GY - PS;
}
window.addEventListener('resize', resize);

// ---- CONFIG ----
let PS = 32;
let OW = 40;
let GH = 80;
let JF = -11.5;
const G = 0.35;
const REF_H = 700;

function getScale() {
  const h = H || window.innerHeight;
  return Math.max(0.55, Math.min(1.5, h / REF_H));
}

function applyScale() {
  const s = getScale();
  PS = Math.round(32 * s);
  OW = Math.max(22, Math.round(40 * s));
  GH = Math.round(80 * s);
  JF = -Math.max(7, Math.round(11.5 * s * 10) / 10);
  GY = H - GH;
}

// ---- AUDIO ----
let audioCtx = null;
let muted = false;

function initAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
}

function tone(freq, endFreq, dur, type, vol) {
  if (muted || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function snd(type) {
  if (type === 'jump') tone(300, 800, 0.1, 'sine', 0.1);
  else if (type === 'score') tone(800, 1400, 0.07, 'sine', 0.08);
  else if (type === 'die') tone(400, 40, 0.4, 'sawtooth', 0.12);
  else if (type === 'powerup') tone(500, 2000, 0.25, 'sine', 0.12);
}

// ---- BACKGROUND MUSIC ----
const BGM1 = [
  [262, 0.12], [330, 0.12], [392, 0.12], [523, 0.24],
  [392, 0.12], [523, 0.12], [659, 0.12], [784, 0.24],
  [659, 0.12], [523, 0.12], [392, 0.12], [330, 0.24],
  [262, 0.12], [330, 0.12], [392, 0.12], [523, 0.24],
  [349, 0.12], [440, 0.12], [523, 0.12], [659, 0.24],
  [523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.24],
  [784, 0.12], [659, 0.12], [523, 0.12], [440, 0.24],
  [392, 0.12], [330, 0.12], [262, 0.48],
];

const BGM2 = [
  [220, 0.18], [262, 0.18], [311, 0.18], [262, 0.18],
  [220, 0.18], [196, 0.18], [220, 0.18], [262, 0.36],
  [330, 0.18], [311, 0.18], [262, 0.18], [311, 0.18],
  [330, 0.18], [392, 0.18], [330, 0.18], [262, 0.36],
  [196, 0.18], [165, 0.18], [196, 0.18], [220, 0.36],
  [262, 0.18], [220, 0.18], [196, 0.18], [165, 0.36],
  [165, 0.12], [196, 0.12], [220, 0.12], [262, 0.12],
  [311, 0.12], [330, 0.12], [392, 0.24],
];

let currentBGM = BGM1;
let musicTimer = null;
let musicIdx = 0;

function playBgmNote() {
  if (muted || !audioCtx || screen !== 'playing') {
    musicTimer = null;
    return;
  }

  const [freq, dur] = currentBGM[musicIdx];
  musicIdx = (musicIdx + 1) % currentBGM.length;

  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.015);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + dur * 0.85);
    o.start(audioCtx.currentTime);
    o.stop(audioCtx.currentTime + dur);
  } catch (e) {}

  const gap = dur * 1000 + 20;
  musicTimer = setTimeout(playBgmNote, gap);
}

function startMusic() {
  stopMusic();
  currentBGM = Math.random() < 0.5 ? BGM1 : BGM2;
  musicIdx = 0;
  if (!muted && audioCtx) playBgmNote();
}

function stopMusic() {
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  musicIdx = 0;
}

// ---- SKINS ----
const COLORS = ['#00f0ff', '#ff0066', '#00ff66', '#ff6600', '#9966ff', '#ffffff', '#ffdd00', '#ff00ff'];
const SHAPES = ['square', 'triangle', 'circle', 'diamond', 'pentagon', 'hexagon', 'star'];
let skinColor = localStorage.getItem('neondash_color') || '#00f0ff';
let skinShape = localStorage.getItem('neondash_shape') || 'square';

// ---- LEVELS ----
const LEVELS = [
  { id: 'cyber',  name: 'CYBERPUNK', wall: '#ff00ff', wallLight: '#ff66ff', wallScanRgb: '255,100,255', ground: '#00f0ff', groundRgba: '0,240,255', accent: '#00f0ff' },
  { id: 'toxic',  name: 'TOXIC',     wall: '#00ff66', wallLight: '#66ff99', wallScanRgb: '0,255,102',   ground: '#00ff66', groundRgba: '0,255,102',  accent: '#00ff66' },
  { id: 'inferno',name: 'INFERNO',   wall: '#ff4400', wallLight: '#ff7733', wallScanRgb: '255,68,0',    ground: '#ff4400', groundRgba: '255,68,0',   accent: '#ff4400' },
];
let levelId = localStorage.getItem('neondash_level') || 'cyber';
let currentLevel = LEVELS.find(l => l.id === levelId) || LEVELS[0];

function setLevel(id) {
  levelId = id;
  currentLevel = LEVELS.find(l => l.id === id) || LEVELS[0];
  localStorage.setItem('neondash_level', id);
  document.querySelectorAll('.level-btn').forEach(el => el.classList.toggle('active', el.dataset.level === id));
}

// ---- BACKGROUND DOTS ----
let bgDots = [];

function initBgDots() {
  bgDots = [];
  for (let i = 0; i < 50; i++) {
    bgDots.push({
      x: Math.random() * (W || 800),
      y: Math.random() * (H || 600),
      size: 1 + Math.random() * 1.5,
      speed: 0.15 + Math.random() * 0.5,
      alpha: 0.04 + Math.random() * 0.08,
    });
  }
}

// ---- GAME STATE ----
let screen = 'start';
let score = 0;
let best = 0;
let speed = 4;
let gapSize = 280;
let frame = 0;
let sx = 0, sy = 0, si = 0;

let player;
let obstacles = [];
let particles = [];
let popups = [];

let streak = 0;
let scorePulse = 0;
let flashAlpha = 0;
let trail = [];

let invincible = false;

function reset() {
  const s = getScale();
  player = { x: Math.round(W * 0.2), y: GY - PS, vy: 0 };
  obstacles = [];
  particles = [];
  popups = [];
  score = 0;
  speed = 2;
  gapSize = Math.max(220, 280 * s);
  sx = sy = si = 0;
  frame = 0;
  streak = 0;
  scorePulse = 0;
  flashAlpha = 0;
  trail = [];
  invincible = false;
}

// ---- SPECTATE ----
const maxJump = (JF * JF) / (2 * G);
const playerStandY = () => GY - PS;
const playerMinY = () => playerStandY() - maxJump;

function getGapCenter() {
  const half = gapSize / 2;
  const maxY = playerStandY();
  const minY = playerMinY();
  const minC = Math.max(minY + PS - half, half + 30);
  const maxC = Math.min(maxY + half, GY - half - 10);
  if (minC >= maxC) return (minC + maxC) / 2;
  return minC + Math.random() * (maxC - minC);
}

function spawnObstacle() {
  obstacles.push({
    x: W + 30,
    gapY: getGapCenter(),
    gapSize: gapSize,
    scored: false,
    flash: 1,
    hasStar: Math.random() < 0.25,
    starCollected: false,
  });
}

function getSpacing() {
  const s = Math.min(1, getScale());
  return Math.max(240, (420 - score * 3) / s);
}

// ---- COLLISION ----
function collides(o) {
  const half = o.gapSize / 2;
  const pl = player.x - PS / 2;
  const pr = player.x + PS / 2;
  const pt = player.y;
  const pb = player.y + PS;

  if (pl < o.x + OW && pr > o.x && pt < o.gapY - half && pb > 0) return true;
  if (pl < o.x + OW && pr > o.x && pt < GY && pb > o.gapY + half) return true;
  return false;
}

// ---- PARTICLES ----
function emit(x, y, n, color, spread) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * spread + 0.5;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 0.5,
      life: 1,
      decay: 0.015 + Math.random() * 0.025,
      size: 1.5 + Math.random() * 3,
      color,
    });
  }
}

// ---- GAME FLOW ----
function jump() {
  if (screen !== 'playing') return;
  player.vy = JF;
  emit(player.x, player.y + PS, 10, skinColor, 3);
  snd('jump');
}

function gameOver() {
  screen = 'gameover';
  stopMusic();
  snd('die');
  si = 20;
  flashAlpha = 0.7;
  streak = 0;
  invincible = false;
  emit(player.x, player.y + PS / 2, 40, '#ff00ff', 7);
  emit(player.x, player.y + PS / 2, 25, '#00f0ff', 6);
  emit(player.x, player.y + PS / 2, 15, '#ffff00', 4);

  if (score > best) {
    best = score;
    localStorage.setItem('neondash_best', best);
    newBest.classList.remove('hidden');
  } else {
    newBest.classList.add('hidden');
  }

  finalScore.textContent = score;
  finalBest.textContent = best;
  gameoverScreen.classList.remove('hidden');
}

function startGame() {
  reset();
  screen = 'playing';
  startScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  startMusic();
}

// ---- UPDATE ----
function update() {
  frame++;

  if (screen === 'playing') {
    player.vy += G;
    player.y += player.vy;
    if (player.y + PS > GY) { player.y = GY - PS; player.vy = 0; }
    if (player.y < 0) { player.y = 0; player.vy = 0; }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    o.flash = Math.max(0, o.flash - 0.02);

    if (screen === 'playing' && !o.scored && o.x + OW < player.x) {
      o.scored = true;

      if (o.hasStar && !o.starCollected) {
        o.starCollected = true;
        invincible = true;
        score += 5;
        emit(o.x + OW / 2, o.gapY, 30, '#ffdd00', 5);
        snd('powerup');
        popups.push({
          x: player.x,
          y: player.y - 30,
          vy: -2.5,
          text: '⭐ +5',
          life: 1.5,
          decay: 0.012,
          big: true,
          color: '#ffdd00',
        });
      }

      score++;
      streak++;
      scorePulse = 1;

      emit(o.x + OW / 2, o.gapY, 8, '#ff00ff', 3);

      const isMilestone = streak > 0 && streak % 10 === 0;
      popups.push({
        x: player.x + 40,
        y: player.y - 10,
        vy: -1.8,
        text: isMilestone ? streak + '!' : '+1',
        life: 1.2,
        decay: 0.018,
        big: isMilestone,
        color: isMilestone ? '#ffdd00' : '#fff',
      });

      if (isMilestone) {
        emit(o.x + OW / 2, o.gapY, 25, '#ffdd00', 6);
        tone(500, 1800, 0.2, 'sine', 0.15);
      } else {
        snd('score');
      }

      scoreDisplay.classList.remove('pulse');
      void scoreDisplay.offsetWidth;
      scoreDisplay.classList.add('pulse');

      const s = getScale();
      speed = 2 + score * 0.06;
      gapSize = Math.max(180 * s, (280 - score * 0.6 - (score * score) / 500) * s);
    }

    if (o.x + OW < 0) obstacles.splice(i, 1);
  }

  if (screen === 'playing') {
    for (const o of obstacles) {
      if (collides(o)) {
        if (invincible) {
          invincible = false;
          emit(player.x, player.y + PS / 2, 30, '#ffdd00', 6);
          snd('die');
          continue;
        }
        gameOver();
        break;
      }
    }
  }

  if (screen === 'playing') {
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < W - getSpacing()) {
      spawnObstacle();
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = popups.length - 1; i >= 0; i--) {
    const pop = popups[i];
    pop.y += pop.vy;
    pop.life -= pop.decay;
    if (pop.life <= 0) popups.splice(i, 1);
  }

  if (si > 0) {
    sx = (Math.random() - 0.5) * si;
    sy = (Math.random() - 0.5) * si;
    si *= 0.9;
    if (si < 0.5) si = 0;
  } else {
    sx = sy = 0;
  }

  if (flashAlpha > 0) flashAlpha -= 0.04;

  if (scorePulse > 0) scorePulse -= 0.06;

  if (screen === 'playing') {
    trail.unshift({ y: player.y });
    if (trail.length > 8) trail.pop();
  } else if (trail.length > 0) {
    trail = [];
  }

  for (const d of bgDots) {
    d.x -= d.speed;
    if (d.x < -5) {
      d.x = W + 5;
      d.y = Math.random() * H;
    }
  }

  scoreDisplay.textContent = score;
  bestDisplay.textContent = 'BEST: ' + best;
}

// ---- RENDER ----
function drawBackground() {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawBgDots() {
  for (const d of bgDots) {
    ctx.globalAlpha = d.alpha;
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(d.x, d.y, d.size, d.size);
  }
  ctx.globalAlpha = 1;
}

function drawGround() {
  const g = ctx.createLinearGradient(0, GY, 0, H);
  g.addColorStop(0, `rgba(${currentLevel.groundRgba},0.06)`);
  g.addColorStop(1, `rgba(${currentLevel.groundRgba},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, GY, W, H - GY);

  ctx.shadowColor = currentLevel.ground;
  ctx.shadowBlur = 6;
  ctx.strokeStyle = currentLevel.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GY);
  ctx.lineTo(W, GY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawShape(x, y, w, h, color) {
  ctx.fillStyle = color;
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;

  if (skinShape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w, cy);
    ctx.lineTo(cx, y + h);
    ctx.lineTo(x, cy);
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'pentagon') {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'hexagon') {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const sr = i % 2 === 0 ? r : r * 0.45;
      i === 0 ? ctx.moveTo(cx + sr * Math.cos(a), cy + sr * Math.sin(a)) : ctx.lineTo(cx + sr * Math.cos(a), cy + sr * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'circle') {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
}

function drawTrail() {
  if (trail.length < 2) return;
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const a = (1 - i / trail.length) * 0.2;
    const s = PS * (0.5 + 0.5 * (1 - i / trail.length));
    ctx.globalAlpha = a;
    drawShape(player.x - s / 2, t.y, s, PS, invincible ? '#ffdd00' : skinColor);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const px = player.x - PS / 2;
  const py = player.y;
  const color = invincible ? '#ffdd00' : skinColor;
  const glow = invincible ? 30 : 20;
  const pulse = invincible ? 0.6 + 0.4 * Math.sin(frame * 0.15) : 1;

  ctx.shadowColor = color;
  ctx.shadowBlur = glow * pulse;
  drawShape(px, py, PS, PS, color);
  ctx.shadowBlur = 0;

  const hiCX = px + PS / 2, hiCY = py + PS / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  if (skinShape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(hiCX, py + 8);
    ctx.lineTo(hiCX + 6, py + PS - 4);
    ctx.lineTo(hiCX - 6, py + PS - 4);
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(hiCX, py + 8);
    ctx.lineTo(hiCX + 6, hiCY);
    ctx.lineTo(hiCX, py + PS - 8);
    ctx.lineTo(hiCX - 6, hiCY);
    ctx.closePath();
    ctx.fill();
  } else if (skinShape === 'pentagon') {
    ctx.beginPath();
    ctx.arc(hiCX, hiCY - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinShape === 'hexagon') {
    ctx.beginPath();
    ctx.arc(hiCX, hiCY - 3, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinShape === 'star') {
    ctx.beginPath();
    ctx.arc(hiCX - 3, hiCY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinShape === 'circle') {
    ctx.beginPath();
    ctx.arc(hiCX - 4, hiCY - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(px + 4, py + 4, PS - 8, PS - 8);
  }
}

function drawObstacles() {
  for (const o of obstacles) {
    const half = o.gapSize / 2;
    const pulse = 0.85 + 0.15 * Math.sin(frame * 0.04 + o.x);

    ctx.shadowColor = currentLevel.wall;
    ctx.shadowBlur = 14 * pulse;
    ctx.fillStyle = currentLevel.wall;
    ctx.fillRect(o.x, 0, OW, Math.max(0, o.gapY - half));
    ctx.fillRect(o.x, o.gapY + half, OW, Math.max(0, GY - (o.gapY + half)));
    ctx.shadowBlur = 0;

    ctx.shadowColor = currentLevel.wall;
    ctx.shadowBlur = 5;
    ctx.strokeStyle = currentLevel.wallLight;
    ctx.lineWidth = 2;

    const topEdge = Math.max(0, o.gapY - half);
    if (topEdge > 0) {
      ctx.beginPath();
      ctx.moveTo(o.x - 2, topEdge);
      ctx.lineTo(o.x + OW + 2, topEdge);
      ctx.stroke();
    }

    const botEdge = o.gapY + half;
    if (botEdge < GY) {
      ctx.beginPath();
      ctx.moveTo(o.x - 2, botEdge);
      ctx.lineTo(o.x + OW + 2, botEdge);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(${currentLevel.wallScanRgb}, ${0.1 + 0.05 * Math.sin(frame * 0.04 + o.x)})`;
    ctx.lineWidth = 1;
    for (let lx = o.x + 8; lx < o.x + OW - 4; lx += 12) {
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, Math.max(0, o.gapY - half));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, o.gapY + half);
      ctx.lineTo(lx, GY);
      ctx.stroke();
    }

    if (o.hasStar && !o.starCollected) {
      const sx = o.x + OW / 2;
      const sy = o.gapY;
      const sp = 0.8 + 0.2 * Math.sin(frame * 0.06);
      ctx.shadowColor = '#ffdd00';
      ctx.shadowBlur = 14 * sp;
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 8 * sp);
      ctx.lineTo(sx + 6 * sp, sy);
      ctx.lineTo(sx, sy + 8 * sp);
      ctx.lineTo(sx - 6 * sp, sy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.shadowBlur = 0;
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawPopups() {
  for (const pop of popups) {
    ctx.globalAlpha = pop.life;
    ctx.fillStyle = pop.color || '#fff';
    ctx.font = `bold ${pop.big ? 28 : 22}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = pop.big ? '#ffdd00' : '#00f0ff';
    ctx.shadowBlur = pop.big ? 16 : 8;
    ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawFlash() {
  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function render() {
  ctx.save();
  ctx.translate(sx, sy);
  drawBackground();
  drawBgDots();
  drawGround();
  drawTrail();
  drawObstacles();
  drawPlayer();
  drawParticles();
  drawPopups();
  drawFlash();
  ctx.restore();
}

// ---- GAME LOOP ----
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// ---- INPUT ----
let inputCooldown = false;

function handleInput(e) {
  if (inputCooldown) return;
  inputCooldown = true;
  setTimeout(() => inputCooldown = false, 100);

  if (e && e.target && e.target.closest && e.target.closest('button')) return;
  if (e) e.preventDefault();
  initAudio();
  if (screen === 'start') {
    if (!skinsScreen.classList.contains('hidden')) return;
    if (!levelsScreen.classList.contains('hidden')) return;
    startGame();
  }
  else if (screen === 'playing') jump();
  else if (screen === 'gameover') startGame();
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleInput();
  }
});

document.addEventListener('click', handleInput);
document.addEventListener('touchstart', handleInput, { passive: false });

document.getElementById('playBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  initAudio();
  startGame();
});

document.getElementById('restartBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  initAudio();
  startGame();
});

let prevScreen = 'start';

function openSkins(from) {
  prevScreen = from || 'start';
  startScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  skinsScreen.classList.remove('hidden');
}

skinsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openSkins('start');
});

gameoverSkinsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openSkins('gameover');
});

backBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  skinsScreen.classList.add('hidden');
  if (prevScreen === 'gameover') {
    gameoverScreen.classList.remove('hidden');
  } else {
    startScreen.classList.remove('hidden');
  }
});

levelsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startScreen.classList.add('hidden');
  levelsScreen.classList.remove('hidden');
});

levelsBackBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  levelsScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

document.querySelectorAll('.level-btn').forEach(btn => {
  if (btn.dataset.level === levelId) btn.classList.add('active');
  btn.addEventListener('click', () => setLevel(btn.dataset.level));
});

function selectColor(c) {
  skinColor = c;
  localStorage.setItem('neondash_color', c);
  document.querySelectorAll('.color-swatch').forEach(el => el.classList.toggle('active', el.dataset.color === c));
}

function selectShape(s) {
  skinShape = s;
  localStorage.setItem('neondash_shape', s);
  document.querySelectorAll('.shape-btn').forEach(el => el.classList.toggle('active', el.dataset.shape === s));
}

function initSkins() {
  COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch' + (c === skinColor ? ' active' : '');
    btn.style.background = c;
    btn.dataset.color = c;
    btn.addEventListener('click', () => selectColor(c));
    colorGrid.appendChild(btn);
  });
  document.querySelectorAll('.shape-btn').forEach(btn => {
    if (btn.dataset.shape === skinShape) btn.classList.add('active');
    btn.addEventListener('click', () => selectShape(btn.dataset.shape));
  });
}

soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!audioCtx) initAudio();
  muted = !muted;
  soundBtn.textContent = muted ? '🔇' : '🔊';
  if (muted) stopMusic();
  else if (screen === 'playing') startMusic();
});

// ---- INIT ----
best = parseInt(localStorage.getItem('neondash_best')) || 0;
startBest.textContent = best;
bestDisplay.textContent = 'BEST: ' + best;
initBgDots();
initSkins();
reset();
resize();
loop();
