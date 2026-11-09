/* Andy Huynh, UGC portfolio: the lion reveal, the name fit, the reel carousel and the entrances. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* The name fills the measure: one line on wide screens, two on a phone. */
  const textWidth = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect().width;
  };
  const fit = () => {
    document.querySelectorAll('[data-fit]').forEach((el) => {
      el.style.fontSize = '100px';
      const lines = [...el.querySelectorAll('.line')];
      const stacked = lines.length > 1 && lines[1].offsetTop > lines[0].offsetTop;
      const width = stacked ? Math.max(...lines.map(textWidth)) : textWidth(el);
      const box = getComputedStyle(el.parentElement);
      const room = el.parentElement.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
      el.style.fontSize = `${Math.floor(((100 * room) / width) * 0.99)}px`;
    });
  };
  fit();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  let fitTimer;
  addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 80); });

  /* The live thing: the cursor uncovers a Lunar New Year lion dance head. */
  const stage = document.querySelector('[data-stage]');
  const figure = stage && stage.querySelector('.portrait');
  const canvas = figure && figure.querySelector('canvas');
  const toggle = document.querySelector('[data-blonde]');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const gold = new Image();
    gold.src = canvas.dataset.src;
    const LIFE = 1300;
    const pts = [];
    let w = 0, h = 0, dpr = 1, ready = false, running = false, onScreen = true, last = null;
    let full = 0, fullTarget = 0, touched = false;

    const radius = () => Math.max(64, w * 0.22);
    const kick = () => { if (!running) { running = true; requestAnimationFrame(draw); } };

    // The outline lives on its own layer over the whole hero, so it is never clipped by the photo's box.
    const ringCv = document.createElement('canvas');
    ringCv.className = 'hero__ring'; ringCv.setAttribute('aria-hidden', 'true');
    stage.appendChild(ringCv);
    const rctx = ringCv.getContext('2d');
    let sw = 0, sh = 0;
    const resize = () => {
      const r = figure.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      sw = stage.clientWidth; sh = stage.clientHeight;
      ringCv.width = Math.round(sw * dpr); ringCv.height = Math.round(sh * dpr);
      kick();
    };

    const add = (x, y, now = performance.now()) => {
      if (last) {
        const dx = x - last[0], dy = y - last[1];
        const n = Math.min(24, Math.floor(Math.hypot(dx, dy) / (radius() * 0.3)));
        for (let i = 1; i <= n; i++) pts.push({ x: last[0] + (dx * i) / (n + 1), y: last[1] + (dy * i) / (n + 1), t: now });
      }
      pts.push({ x, y, t: now });
      last = [x, y];
      kick();
    };

    function draw(now) {
      running = false;
      if (!ready || !onScreen) return;
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      if (!pts.length) last = null;
      full += (fullTarget - full) * (reduce.matches ? 1 : 0.1);
      if (Math.abs(fullTarget - full) < 0.003) full = fullTarget;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rctx.clearRect(0, 0, sw, sh);
      if (!pts.length && full === 0) return;

      const R = radius();
      for (const p of pts) {
        const k = 1 - (now - p.t) / LIFE;
        const a = Math.min(1, k * 1.3);
        const r = R * (0.6 + 0.4 * k);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(0.8, `rgba(0,0,0,${a * 0.95})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
      if (full > 0) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.3, full * Math.hypot(w, h), 0, Math.PI * 2);
        ctx.fill();
      }
      // Keep the mask and draw the lion photograph inside it; the name behind stays visible.
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(gold, 0, 0, w, h);
      // An outline traces the reveal circle at the cursor, fading with the trail.
      const head = pts[pts.length - 1];
      if (head && full < .98) {
        const k = 1 - (now - head.t) / LIFE;
        const fr = figure.getBoundingClientRect(), st = stage.getBoundingClientRect();
        const ox = fr.left - st.left, oy = fr.top - st.top;
        const cx = ox + w * .5, cy = oy + h * .32;                 // the lion's middle, in hero space
        const a = Math.min(1, k * 1.4) * (1 - full);
        // The ring is solid over the lion and dissolves as it travels away from it.
        const g = rctx.createRadialGradient(cx, cy, h * .22, cx, cy, h * .5);
        g.addColorStop(0, `rgba(202, 162, 108, ${a})`);
        g.addColorStop(1, 'rgba(202, 162, 108, 0)');
        rctx.strokeStyle = g;
        rctx.lineWidth = 2;
        rctx.beginPath();
        rctx.arc(ox + head.x, oy + head.y, R * (0.6 + 0.4 * k) * 0.9, 0, Math.PI * 2);
        rctx.stroke();
      }

      if (pts.length || full !== fullTarget) kick();
    }

    const local = (e) => {
      const r = figure.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onPointer = (e) => {
      if (!e.isPrimary) return;
      touched = true;
      const [x, y] = local(e);
      add(x, y);
    };
    stage.addEventListener('pointermove', onPointer);
    stage.addEventListener('pointerdown', onPointer);
    stage.addEventListener('pointerleave', () => { last = null; });

    // One slow pass across the hair on arrival, so the trick announces itself.
    const sweep = () => {
      if (touched || reduce.matches) return;
      const start = performance.now(), dur = 1500;
      const step = (now) => {
        if (touched) return;
        const s = Math.min(1, (now - start) / dur);
        const e = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
        add(w * (0.2 + 0.6 * e), h * (0.36 - 0.1 * Math.sin(Math.PI * e)), now);
        if (s < 1) requestAnimationFrame(step); else last = null;
      };
      requestAnimationFrame(step);
    };

    if (toggle) {
      toggle.addEventListener('click', () => {
        fullTarget = fullTarget ? 0 : 1;
        toggle.setAttribute('aria-pressed', String(fullTarget === 1));
        toggle.textContent = fullTarget ? 'Take it off' : 'Wear the lion';
        kick();
      });
    }

    new ResizeObserver(resize).observe(figure);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) kick(); }).observe(stage);
    (gold.decode ? gold.decode() : new Promise((r) => { gold.onload = r; }))
      .then(() => { ready = true; resize(); setTimeout(sweep, 900); })
      .catch(() => { if (toggle) toggle.hidden = true; });
  }

  /* Work: a 3D loop of reels. Drag or step it; the front reel plays, the rest sit back blurred. */
  const reels = document.querySelector('[data-reels]');
  if (reels) {
    const ringEl = reels.querySelector('[data-ring]');
    const cards = [...reels.querySelectorAll('.reel')];
    const catEl = reels.querySelector('[data-cat]');
    const N = cards.length;
    let pos = 0, target = 0, spread = reduce.matches ? 1 : 0, raf = 0, dragging = false, startX = 0, startPos = 0, moved = 0, playing = null;
    const wrap = (k) => ((k % N) + N + N / 2) % N - N / 2;           // offset in [-N/2, N/2)
    const front = () => ((Math.round(pos) % N) + N) % N;
    const layout = () => {
      const card = cards[0].offsetWidth || 260;
      const gap = card * 0.78;
      cards.forEach((c, i) => {
        const k = wrap(i - pos) * spread, a = Math.abs(k);
        const x = k * gap, z = -a * card * 0.55, ry = -Math.sign(k) * Math.min(a, 1.6) * 24;
        c.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${(1 - spread) * 60}px, ${z}px) rotateY(${ry}deg) scale(${0.92 + 0.08 * spread})`;
        c.style.zIndex = String(100 - Math.round(a * 10));
        c.style.opacity = String(a > N / 2 - .6 ? Math.max(0, (N / 2 - a) / .6) : 1);
        c.style.filter = a < .35 ? 'none' : `blur(${Math.min(a, 2) * 3.5}px) brightness(${1 - Math.min(a, 2) * .28})`;
        c.classList.toggle('is-front', a < .35 && spread > .9);
      });
      const f = front();
      if (catEl.textContent !== cards[f].dataset.cat) catEl.textContent = cards[f].dataset.cat;
    };
    const stop = (c) => { const v = c.querySelector('video'); v.pause(); c.classList.remove('is-playing'); if (playing === c) playing = null; };
    const tick = () => {
      raf = 0;
      if (!dragging) pos += (target - pos) * (reduce.matches ? 1 : .14);
      if (!dragging && Math.abs(target - pos) < .001) pos = target;
      layout();
      if (playing && playing !== cards[front()]) stop(playing);
      if (dragging || pos !== target || spread < 1) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const go = (n) => { target = Math.round(target) + n; kick(); };
    reels.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.step)));
    ringEl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { go(1); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); } });
    ringEl.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0; startX = e.clientX; startPos = pos;
      ringEl.setPointerCapture(e.pointerId); kick();
    });
    ringEl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      pos = startPos - dx / ((cards[0].offsetWidth || 260) * 0.9); target = pos;
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false; target = Math.round(pos); kick();
      if (moved < 6) {                                              // a tap, not a drag
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const hit = under && under.closest('.reel');
        if (!hit) return;
        const i = cards.indexOf(hit), f = front();
        if (i !== f) { target = Math.round(pos) + wrap(i - pos); return; }
        const v = hit.querySelector('video');
        if (v.paused) { cards.forEach((c) => c !== hit && stop(c)); v.muted = false; v.play().catch(() => {}); hit.classList.add('is-playing'); playing = hit; }
        else stop(hit);
      }
    };
    ringEl.addEventListener('pointerup', release);
    ringEl.addEventListener('pointercancel', () => { dragging = false; target = Math.round(pos); kick(); });
    addEventListener('resize', kick);
    layout();
    // On arrival the reels fan out from one stacked phone, like the reveal reference.
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return; obs.disconnect();
      if (reduce.matches) { spread = 1; return kick(); }
      const t0 = performance.now();
      const grow = (now) => {
        const s = Math.min(1, (now - t0) / 1100); spread = 1 - Math.pow(1 - s, 4); kick();
        if (s < 1) requestAnimationFrame(grow);
      };
      requestAnimationFrame(grow);
    }, { threshold: .35 }).observe(ringEl);
  }

  /* The torso fades into the dark as the first screen scrolls away. */
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    const fade = () => {
      const p = Math.min(1, Math.max(0, scrollY / (heroEl.offsetHeight * .7)));
      heroEl.style.setProperty('--fade', `${78 - p * 46}%`);
    };
    fade(); addEventListener('scroll', fade, { passive: true });
  }

  /* Each part arrives once, as it scrolls in. */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
})();
