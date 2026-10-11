const $ = (id) => document.getElementById(id);

const app = $('app');
const ticket = $('ticket');
const face = $('face');
const fctx = face.getContext('2d');
const windowEl = $('window');
const canvas = $('foil');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const prizeEl = $('prize');
const prizeValue = $('prizeValue');
const prizeLabel = $('prizeLabel');
const hintEl = $('hint');
const progressFill = $('progressFill');
const progressText = $('progressText');
const closeBtn = $('closeBtn');
const confettiLayer = $('confetti');

let state = null;
let drawing = false;
let lastPoint = null;
let revealed = false;
let sampler = null;
let lastSoundAt = 0;
let lastFlakeAt = 0;
let flakeCount = 0;
let audio = null;
let noiseBuffer = null;

const rand = (min, max) => min + Math.random() * (max - min);
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

const post = (name, body = {}) => fetch(`https://${GetParentResourceName()}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
}).catch(() => {});

const formatMoney = (value) => {
    const locale = state.lang === 'de' ? 'de-DE' : 'en-US';
    return `${value.toLocaleString(locale)}${state.strings.currency}`;
};

const roundRect = (c, x, y, w, h, r) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
};

const applyLayout = () => {
    const w = state.window;
    const d = state.card.design;
    ticket.style.setProperty('--wx', `${w.x}%`);
    ticket.style.setProperty('--wy', `${w.y}%`);
    ticket.style.setProperty('--ww', `${w.width}%`);
    ticket.style.setProperty('--wh', `${w.height}%`);
    ticket.style.setProperty('--accent', state.card.accent);
    ticket.style.setProperty('--wbg1', d.windowBackground[0]);
    ticket.style.setProperty('--wbg2', d.windowBackground[1]);
    ticket.style.setProperty('--prize-color', d.prizeColor);
};

const drawMotif = (c, type, x, y, s, color) => {
    c.save();
    c.translate(x, y);
    c.fillStyle = color;
    c.strokeStyle = color;
    c.lineWidth = Math.max(1, s * 0.1);

    if (type === 'diamonds') {
        c.beginPath();
        c.moveTo(0, -s);
        c.lineTo(s * 0.7, 0);
        c.lineTo(0, s);
        c.lineTo(-s * 0.7, 0);
        c.closePath();
        c.globalAlpha = 0.9;
        c.fill();
        c.globalAlpha = 1;
        c.stroke();
        c.beginPath();
        c.moveTo(-s * 0.7, 0);
        c.lineTo(s * 0.7, 0);
        c.globalAlpha = 0.5;
        c.stroke();
    } else if (type === 'coins') {
        c.beginPath();
        c.arc(0, 0, s * 0.8, 0, Math.PI * 2);
        c.globalAlpha = 0.9;
        c.fill();
        c.globalAlpha = 0.45;
        c.beginPath();
        c.arc(0, 0, s * 0.55, 0, Math.PI * 2);
        c.stroke();
    } else if (type === 'bars') {
        roundRect(c, -s, -s * 0.45, s * 2, s * 0.9, s * 0.15);
        c.globalAlpha = 0.9;
        c.fill();
        c.globalAlpha = 0.5;
        c.beginPath();
        c.moveTo(-s * 0.6, -s * 0.2);
        c.lineTo(s * 0.6, -s * 0.2);
        c.stroke();
    } else if (type === 'stars') {
        c.beginPath();
        for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? s : s * 0.3;
            const a = (i * Math.PI) / 4 - Math.PI / 2;
            c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath();
        c.globalAlpha = 0.9;
        c.fill();
    } else if (type === 'clover') {
        c.globalAlpha = 0.85;
        for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            c.beginPath();
            c.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.5, 0, Math.PI * 2);
            c.fill();
        }
    }
    c.restore();
};

const drawFace = (w, h) => {
    const d = state.card.design;
    const cfg = state.window;
    const winX = (w * cfg.x) / 100;
    const winY = (h * cfg.y) / 100;
    const winW = (w * cfg.width) / 100;
    const winH = (h * cfg.height) / 100;

    fctx.clearRect(0, 0, w, h);

    const bg = fctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, d.background[0]);
    bg.addColorStop(1, d.background[1]);
    fctx.fillStyle = bg;
    fctx.fillRect(0, 0, w, h);

    if (d.rays) {
        const cx = w / 2;
        const cy = h / 2;
        const rays = 28;
        for (let i = 0; i < rays; i += 2) {
            const a1 = (i / rays) * Math.PI * 2;
            const a2 = ((i + 1) / rays) * Math.PI * 2;
            const len = Math.hypot(w, h);
            fctx.beginPath();
            fctx.moveTo(cx, cy);
            fctx.lineTo(cx + Math.cos(a1) * len, cy + Math.sin(a1) * len);
            fctx.lineTo(cx + Math.cos(a2) * len, cy + Math.sin(a2) * len);
            fctx.closePath();
            fctx.fillStyle = 'rgba(255,255,255,0.045)';
            fctx.fill();
        }
    }

    const vignette = fctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
    fctx.fillStyle = vignette;
    fctx.fillRect(0, 0, w, h);

    const s = Math.min(w, h) * 0.045;
    const spots = [
        [0.07, 0.2], [0.93, 0.2], [0.07, 0.5], [0.93, 0.5], [0.07, 0.8], [0.93, 0.8],
        [0.2, 0.9], [0.5, 0.92], [0.8, 0.9], [0.35, 0.1], [0.65, 0.1]
    ];
    spots.forEach(([px, py]) => drawMotif(fctx, d.pattern, w * px, h * py, s, d.motif));

    roundRect(fctx, w * 0.02, h * 0.04, w * 0.96, h * 0.92, h * 0.06);
    fctx.strokeStyle = d.border;
    fctx.lineWidth = 4;
    fctx.stroke();
    roundRect(fctx, w * 0.035, h * 0.07, w * 0.93, h * 0.86, h * 0.05);
    fctx.globalAlpha = 0.5;
    fctx.lineWidth = 1.5;
    fctx.stroke();
    fctx.globalAlpha = 1;

    fctx.font = `900 ${Math.round(h * 0.13)}px Impact, "Arial Black", sans-serif`;
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';
    fctx.shadowColor = 'rgba(0,0,0,0.6)';
    fctx.shadowBlur = 8;
    fctx.shadowOffsetX = 2;
    fctx.shadowOffsetY = 3;
    fctx.fillStyle = d.titleColor;
    fctx.fillText(state.card.label, w / 2, h * 0.13);

    fctx.font = `700 ${Math.round(h * 0.045)}px "Segoe UI", Tahoma, sans-serif`;
    fctx.fillStyle = d.border;
    fctx.fillText(state.strings.subtitle, w / 2, h * 0.205);
    fctx.shadowColor = 'transparent';
    fctx.shadowBlur = 0;
    fctx.shadowOffsetX = 0;
    fctx.shadowOffsetY = 0;

    roundRect(fctx, winX - 6, winY - 6, winW + 12, winH + 12, 18);
    fctx.strokeStyle = d.border;
    fctx.lineWidth = 2.5;
    fctx.stroke();
};

const drawFoil = (w, h) => {
    const s = state.strings;

    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#7d8289');
    base.addColorStop(0.2, '#c9cdd3');
    base.addColorStop(0.45, '#8f949b');
    base.addColorStop(0.7, '#d7dae0');
    base.addColorStop(1, '#7a7f86');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 180; i++) {
        const y = rand(0, h);
        const x = rand(-w * 0.2, w);
        ctx.strokeStyle = Math.random() > 0.5
            ? `rgba(255,255,255,${rand(0.03, 0.12)})`
            : `rgba(30,34,40,${rand(0.03, 0.1)})`;
        ctx.lineWidth = rand(0.5, 1.6);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + rand(w * 0.3, w * 0.9), y + rand(-2, 2));
        ctx.stroke();
    }

    for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = Math.random() > 0.5
            ? `rgba(255,255,255,${rand(0.05, 0.25)})`
            : `rgba(20,24,30,${rand(0.04, 0.18)})`;
        ctx.fillRect(rand(0, w), rand(0, h), rand(0.6, 1.6), rand(0.6, 1.6));
    }

    const sheen = ctx.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    sheen.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);

    const size = Math.round(Math.min(h * 0.22, w * 0.17));
    ctx.font = `900 ${size}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(s.foil, w / 2 - 1, h / 2 - 1);
    ctx.fillStyle = 'rgba(20,24,30,0.45)';
    ctx.fillText(s.foil, w / 2 + 1.5, h / 2 + 1.5);
    ctx.fillStyle = '#6f747b';
    ctx.fillText(s.foil, w / 2, h / 2);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
};

const setupLayers = () => {
    const d = dpr();

    const tw = ticket.offsetWidth;
    const th = ticket.offsetHeight;
    face.width = Math.round(tw * d);
    face.height = Math.round(th * d);
    fctx.setTransform(d, 0, 0, d, 0, 0);
    drawFace(tw, th);

    const ww = windowEl.offsetWidth;
    const wh = windowEl.offsetHeight;
    canvas.width = Math.round(ww * d);
    canvas.height = Math.round(wh * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    drawFoil(ww, wh);
};

const toLocal = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.offsetWidth,
        y: ((e.clientY - rect.top) / rect.height) * canvas.offsetHeight
    };
};

const scratchSegment = (a, b) => {
    const r = state.brush / 2;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = state.brush;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3);
    for (let i = 0; i < steps; i++) {
        if (Math.random() > 0.45) continue;
        const t = i / steps;
        const x = a.x + (b.x - a.x) * t + rand(-r, r);
        const y = a.y + (b.y - a.y) * t + rand(-r, r);
        ctx.globalAlpha = rand(0.4, 1);
        ctx.beginPath();
        ctx.arc(x, y, rand(r * 0.35, r * 0.8), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
};

const spawnFlakes = (p, amount) => {
    const now = performance.now();
    if (now - lastFlakeAt < 40 || flakeCount > 60) return;
    lastFlakeAt = now;
    for (let i = 0; i < amount; i++) {
        const el = document.createElement('span');
        el.className = 'flake';
        const size = rand(2, 4.5);
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        windowEl.appendChild(el);
        flakeCount++;
        const dx = rand(-30, 30);
        const dy = rand(20, 60);
        const rot = rand(-220, 220);
        el.animate([
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: rand(500, 900), easing: 'cubic-bezier(.3,.6,.6,1)' }).onfinish = () => {
            el.remove();
            flakeCount = Math.max(0, flakeCount - 1);
        };
    }
};

const getAudio = () => {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    return audio;
};

const getNoise = (a) => {
    if (!noiseBuffer) {
        noiseBuffer = a.createBuffer(1, a.sampleRate, a.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
};

const playScratch = () => {
    if (!state.sound.enabled) return;
    const now = performance.now();
    if (now - lastSoundAt < 55) return;
    lastSoundAt = now;

    const a = getAudio();
    const t = a.currentTime;
    const src = a.createBufferSource();
    src.buffer = getNoise(a);
    src.playbackRate.value = rand(0.7, 1.2);

    const filter = a.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = rand(1800, 3200);
    filter.Q.value = 1.4;

    const gain = a.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(state.sound.volume * 0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    src.connect(filter).connect(gain).connect(a.destination);
    src.start(t, rand(0, 0.6), 0.1);
};

const playTone = (freqs, type, duration, volume) => {
    if (!state.sound.enabled) return;
    const a = getAudio();
    freqs.forEach((f, i) => {
        const o = a.createOscillator();
        const g = a.createGain();
        const t = a.currentTime + i * 0.11;
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(volume * state.sound.volume, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        o.connect(g).connect(a.destination);
        o.start(t);
        o.stop(t + duration + 0.05);
    });
};

const spawnConfetti = (count) => {
    const colors = [state.card.accent, '#ffffff', '#ffd54a', '#ff5d7a', '#58d6ff', '#7dff9e'];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'confetti-piece';
        el.style.background = colors[i % colors.length];
        el.style.width = `${rand(6, 11)}px`;
        el.style.height = `${rand(10, 18)}px`;
        confettiLayer.appendChild(el);

        const dx = rand(-340, 340);
        const dy = rand(-320, -120);
        const fall = rand(260, 420);
        const rot = rand(-720, 720);
        el.animate([
            { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.4 },
            { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + fall}px)) rotate(${rot}deg)`, opacity: 0 }
        ], {
            duration: rand(1600, 2600),
            delay: rand(0, 120),
            easing: 'cubic-bezier(.2,.6,.4,1)'
        }).onfinish = () => el.remove();
    }
};

const checkProgress = () => {
    if (revealed || !state) return;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    let total = 0;
    for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
            total++;
            if (data[(y * width + x) * 4 + 3] < 128) cleared++;
        }
    }
    const ratio = cleared / total;
    const pct = Math.min(100, (ratio / state.threshold) * 100);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${state.strings.progress} ${Math.round(ratio * 100)}%`;
    if (ratio >= state.threshold) reveal();
};

const startSampler = () => {
    stopSampler();
    sampler = setInterval(checkProgress, state.sampleInterval);
};

const stopSampler = () => {
    if (sampler) clearInterval(sampler);
    sampler = null;
};

const reveal = () => {
    revealed = true;
    drawing = false;
    stopSampler();

    const s = state.strings;
    const win = state.prize > 0;

    canvas.style.opacity = '0';
    prizeEl.classList.add(win ? 'win' : 'lose');
    hintEl.textContent = win ? s.hint_win : s.hint_lose;
    progressFill.style.width = '100%';
    progressText.textContent = `${s.progress} 100%`;
    closeBtn.textContent = s.close_claim;
    closeBtn.classList.add('active');

    post('reveal');

    if (win) {
        ticket.classList.add('win');
        playTone([523, 659, 784, 1046], 'triangle', 0.35, 0.5);
        if (state.confetti.enabled) {
            const big = state.prize >= state.card.maxPrize * state.confetti.minPrizeRatio;
            spawnConfetti(big ? state.confetti.pieces : Math.round(state.confetti.pieces * 0.35));
        }
    } else {
        playTone([330, 247, 196], 'square', 0.5, 0.12);
    }
};

const open = (data) => {
    state = data;
    revealed = false;
    flakeCount = 0;
    drawing = false;
    lastPoint = null;

    const s = data.strings;
    ticket.classList.remove('win', 'show');
    ticket.style.transform = '';
    applyLayout();

    prizeValue.textContent = data.prize > 0 ? formatMoney(data.prize) : s.no_prize;
    prizeLabel.textContent = s.prize;
    prizeEl.classList.remove('win', 'lose');
    canvas.style.opacity = '1';
    hintEl.textContent = s.hint;
    closeBtn.textContent = s.close;
    closeBtn.classList.remove('active');
    progressFill.style.width = '0%';
    progressText.textContent = `${s.progress} 0%`;
    confettiLayer.innerHTML = '';
    windowEl.querySelectorAll('.flake').forEach((n) => n.remove());

    app.classList.remove('hidden');

    requestAnimationFrame(() => {
        setupLayers();
        ticket.classList.add('show');
        startSampler();
    });
};

const hide = () => {
    stopSampler();
    app.classList.add('hidden');
    drawing = false;
    state = null;
};

const close = () => {
    if (!state) return;
    hide();
    post('close');
};

window.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data.action === 'open') open(data);
});

canvas.addEventListener('pointerdown', (e) => {
    if (revealed || !state) return;
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    lastPoint = toLocal(e);
    scratchSegment(lastPoint, lastPoint);
    spawnFlakes(lastPoint, 3);
    playScratch();
});

canvas.addEventListener('pointermove', (e) => {
    if (!drawing || revealed || !lastPoint) return;
    const p = toLocal(e);
    scratchSegment(lastPoint, p);
    spawnFlakes(p, 1);
    playScratch();
    lastPoint = p;
});

const stopDrawing = () => {
    drawing = false;
    lastPoint = null;
};
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);

ticket.addEventListener('pointermove', (e) => {
    if (drawing || !state) return;
    const r = ticket.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ticket.style.transform = `perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
});

ticket.addEventListener('pointerleave', () => {
    ticket.style.transform = '';
});

closeBtn.addEventListener('click', close);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
});
