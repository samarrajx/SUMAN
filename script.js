/* ════════════════════════════════════════
   SUMAN BIRTHDAY — script.js
   ════════════════════════════════════════ */

'use strict';

// ── STATE ───────────────────────────────
let currentStage = 0;
const TOTAL_STAGES = 6;
let musicStarted = false;
let isMuted = false;
let carouselIndex = 1;
let carouselTimer = null;
let diaryOpened = false;
let stage5Animated = false;
const isMobile = window.innerWidth <= 480 || /Mobi|Android/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── ELEMENTS ────────────────────────────
const bgMusic = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn');
const tapFeedback = document.getElementById('tapFeedback');
const progressDots = document.querySelectorAll('.dot');

// ── CONTENT ─────────────────────────────
const CONTENT = {
  stage0: {
    title: "Kuch special\ntere liye hai...",
    sub: "Ek baar tap kar — bas ek baar 🤫",
    btn: "Tap kar Suman 👇"
  },
  stage1: {
    heading: "Aye Suman Ghoshal...",
    sub: "Tu soch rahi hogi —\nyeh kya tamasha hai 😂"
  },
  stage2: {
    bubble1: "Okay sun,\nmain chahta tha ki kuch normal karu tere liye.\n\nPar tu jaanti hai na mujhe —\nnormal mujhse hota nahi 😂\n\nToh bas... ek poora website bana diya.\nKyunki tu iska haqdar hai. Obviously. 🙄✨",
    bubble2: "Aur honestly?\nTujhe khush dekhna hi meri\nsabse badi achievement hai.\n\nHappy Birthday Suman. 🎂💕"
  },
  stage6: {
    message: "Tu mere liye bahut special hai, Suman.\n\nYeh saal bhi tera ho —\nkhushi se bhara, drama se bhara,\naur haan... thodi aur bakwaas bhi. 😂\n\nJanamdin Mubarak ho. 🎂🌸",
    sign: "— Samar Raj 💕"
  }
};

// ── INIT ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initProgressDots();
  initLazyLoad();
  initPolaroids();
  initFlipCards();
  initCarousel();
  initDiary();

  // Splash button
  document.getElementById('splashBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    advanceFromStage(0);
  });

  // Global tap handler
  document.addEventListener('click', globalTapHandler);
  document.addEventListener('touchend', (e) => {
    // Prevent double-fire on mobile
    e.preventDefault();
    globalTapHandler(e);
  }, { passive: false });
});

// ── GLOBAL TAP HANDLER ───────────────────
function globalTapHandler(e) {
  if (e.target.closest('.no-tap-advance')) return;
  if (e.target.closest('.polaroid')) return;
  if (e.target.closest('.flip-card')) return;
  if (e.target.closest('.carousel-wrap')) return;
  if (e.target.closest('#diaryBook') || e.target.closest('.diary-container')) return;

  showTapFeedback(e);

  switch (currentStage) {
    case 0: break; // handled by button
    case 1: advanceFromStage(1); break;
    case 2: advanceFromStage(2); break;
    case 3: advanceFromStage(3); break;
    case 4:
      if (diaryOpened) advanceFromStage(4);
      break;
    case 5: advanceFromStage(5); break;
    case 6: break;
  }
}

// ── STAGE TRANSITIONS ────────────────────
function advanceFromStage(from) {
  const next = from + 1;
  if (next > TOTAL_STAGES) return;

  const prevEl = document.getElementById('stage' + from);
  const nextEl = document.getElementById('stage' + next);

  // Fade out prev
  prevEl.style.opacity = '0';
  prevEl.style.transition = 'opacity 0.4s ease';
  setTimeout(() => {
    prevEl.classList.add('hidden');
    prevEl.style.opacity = '';
    prevEl.style.transition = '';
  }, 400);

  // Show next
  nextEl.classList.remove('hidden');
  nextEl.style.opacity = '0';
  setTimeout(() => {
    nextEl.style.opacity = '1';
    nextEl.style.transition = 'opacity 0.5s ease';
  }, 50);
  setTimeout(() => {
    nextEl.style.transition = '';
  }, 600);

  currentStage = next;
  updateProgressDots(next);
  onStageEnter(next);
}

function onStageEnter(stage) {
  if (stage === 1) enterStage1();
  if (stage === 2) enterStage2();
  if (stage === 3) enterStage3();
  if (stage === 4) enterStage4();
  if (stage === 5) enterStage5();
  if (stage === 6) enterStage6();
}

// ── PROGRESS DOTS ────────────────────────
function initProgressDots() {
  progressDots.forEach(d => d.classList.remove('active', 'complete'));
}

function updateProgressDots(stage) {
  progressDots.forEach((d, i) => {
    d.classList.remove('active', 'complete', 'final-glow');
    if (i < stage - 1) d.classList.add('complete');
    else if (i === stage - 1) {
      d.classList.add('active');
      if (stage === TOTAL_STAGES) d.classList.add('final-glow');
    }
  });
  if (stage === TOTAL_STAGES) {
    setTimeout(() => {
      progressDots.forEach(d => d.classList.add('final-glow'));
    }, 6000);
  }
}

// ── AUDIO ────────────────────────────────
async function startMusic() {
  if (musicStarted) return;
  try {
    bgMusic.volume = 0;
    await bgMusic.play();
    musicStarted = true;
    const fadeIn = setInterval(() => {
      if (bgMusic.volume < 0.38) {
        bgMusic.volume = Math.min(0.4, bgMusic.volume + 0.02);
      } else {
        clearInterval(fadeIn);
      }
    }, 100);
    muteBtn.classList.remove('hidden');
  } catch (e) { /* Silent fail */ }
}

function toggleMute() {
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
}
window.toggleMute = toggleMute;

function musicSwell(extra, duration) {
  if (!musicStarted || isMuted) return;
  const original = bgMusic.volume;
  const target = Math.min(0.9, original + extra);
  bgMusic.volume = target;
  setTimeout(() => {
    bgMusic.volume = original;
  }, duration);
}

// ── TAP FEEDBACK ─────────────────────────
function showTapFeedback(e) {
  const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || window.innerWidth / 2;
  const y = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || window.innerHeight / 2;
  tapFeedback.style.left = (x - 30) + 'px';
  tapFeedback.style.top = (y - 30) + 'px';
  tapFeedback.classList.remove('pop');
  void tapFeedback.offsetWidth;
  tapFeedback.classList.add('pop');
  setTimeout(() => tapFeedback.classList.remove('pop'), 400);
}

// ── LAZY LOAD ────────────────────────────
function initLazyLoad() {
  const imgs = document.querySelectorAll('img[data-src]');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          loadImg(en.target);
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '50px' });
    imgs.forEach(img => obs.observe(img));
  } else {
    imgs.forEach(loadImg);
  }
}

function loadImg(img) {
  if (!img.dataset.src) return;
  img.src = img.dataset.src;
  img.onload = () => img.classList.add('loaded');
  img.onerror = () => img.classList.add('loaded'); // graceful fail
}

function loadStageImages(stageEl) {
  stageEl.querySelectorAll('img[data-src]').forEach(loadImg);
}

// ── TYPEWRITER ───────────────────────────
function typeWriter(element, text, speed, callback) {
  element.textContent = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  cursor.textContent = '|';
  element.appendChild(cursor);
  if (prefersReducedMotion) {
    cursor.insertAdjacentText('beforebegin', text);
    setTimeout(() => {
      cursor.remove();
      if (callback) callback();
    }, 100);
    return;
  }
  const timer = setInterval(() => {
    if (i < text.length) {
      cursor.insertAdjacentText('beforebegin', text[i]);
      i++;
    } else {
      clearInterval(timer);
      setTimeout(() => { cursor.remove(); if (callback) callback(); }, 800);
    }
  }, speed || 45);
}

// ── STAGE 1: ARRIVAL ─────────────────────
function enterStage1() {
  startMusic();
  const stage1 = document.getElementById('stage1');
  loadStageImages(stage1);

  const heroImg = document.getElementById('heroImg');
  const heading = document.getElementById('stage1Heading');
  const sub = document.getElementById('stage1Sub');
  const hint = document.getElementById('stage1Hint');

  if (prefersReducedMotion) {
    heading.textContent = CONTENT.stage1.heading;
    sub.classList.remove('hidden');
    hint.classList.remove('hidden');
    return;
  }

  // Animate hero image
  gsap.from('.hero-img-wrap', { y: 80, opacity: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });

  // Typewriter heading
  setTimeout(() => {
    typeWriter(heading, CONTENT.stage1.heading, 45, () => {
      setTimeout(() => {
        sub.classList.remove('hidden');
        gsap.from(sub, { opacity: 0, y: 10, duration: 0.5 });
        setTimeout(() => {
          hint.classList.remove('hidden');
          gsap.from(hint, { opacity: 0, y: 10, duration: 0.4 });
        }, 800);
      }, 300);
    });
  }, 1000);
}

// ── STAGE 2: WHATSAPP CHAT ───────────────
function enterStage2() {
  const typing = document.getElementById('typingIndicator');
  const b1 = document.getElementById('bubble1');
  const b2 = document.getElementById('bubble2');
  const hint = document.getElementById('stage2Hint');

  // Reset
  b1.classList.add('hidden'); b1.classList.remove('visible');
  b2.classList.add('hidden'); b2.classList.remove('visible');
  typing.classList.add('hidden');
  hint.classList.add('hidden');

  const seq = prefersReducedMotion ? 0 : 1;

  setTimeout(() => {
    typing.classList.remove('hidden');
    setTimeout(() => {
      typing.classList.add('hidden');
      b1.classList.remove('hidden');
      setTimeout(() => b1.classList.add('visible'), 50);
      setTimeout(() => {
        typing.classList.remove('hidden');
        setTimeout(() => {
          typing.classList.add('hidden');
          b2.classList.remove('hidden');
          setTimeout(() => b2.classList.add('visible'), 50);
          setTimeout(() => {
            spawnEmojiRain();
            setTimeout(() => {
              hint.classList.remove('hidden');
              if (!prefersReducedMotion) {
                gsap.from(hint, { opacity: 0, y: 10, duration: 0.4 });
              }
            }, 1200);
          }, 1500 * seq);
        }, 1500 * seq);
      }, 3000 * seq);
    }, 1800 * seq);
  }, 400 * seq);
}

function spawnEmojiRain() {
  if (prefersReducedMotion) return;
  const emojis = ['🎂', '✨', '💕', '🎊', '🌸'];
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'emoji-rain-item';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = (Math.random() * 90) + '%';
      el.style.animationDuration = (2 + Math.random() * 2) + 's';
      el.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 120);
  }
}

// ── STAGE 3: MEMORIES ────────────────────
function enterStage3() {
  const stage3 = document.getElementById('stage3');
  loadStageImages(stage3);
  // Carousel start
  startCarouselTimer();
}

// ── POLAROIDS ────────────────────────────
function initPolaroids() {
  const stack = document.getElementById('polaroidStack');
  const polaroids = stack.querySelectorAll('.polaroid');
  let activePolaroid = 2; // top one

  stack.addEventListener('click', (e) => {
    e.stopPropagation();
    const pol = e.target.closest('.polaroid');
    if (pol) {
      const idx = parseInt(pol.dataset.idx);
      polaroids.forEach(p => p.classList.remove('active'));
      pol.classList.add('active');

      // Reorder z-index
      polaroids.forEach((p, i) => {
        p.style.zIndex = i === idx ? 10 : (i < idx ? i + 1 : i);
      });
    } else {
      // Cycle to next
      polaroids[activePolaroid].classList.remove('active');
      activePolaroid = (activePolaroid + 1) % polaroids.length;
      polaroids[activePolaroid].classList.add('active');
    }
    showTapFeedback(e);
  });
}

// ── FLIP CARDS ───────────────────────────
function initFlipCards() {
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.toggle('flipped');
      showTapFeedback(e);
    });
  });
}

// ── CAROUSEL ─────────────────────────────
function initCarousel() {
  const wrap = document.getElementById('carouselWrap');
  let touchStartX = 0;

  wrap.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  wrap.addEventListener('touchend', (e) => {
    e.stopPropagation();
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextCarousel() : prevCarousel();
    }
  });

  wrap.addEventListener('click', (e) => {
    e.stopPropagation();
    nextCarousel();
    showTapFeedback(e);
  });
}

function startCarouselTimer() {
  clearInterval(carouselTimer);
  carouselTimer = setInterval(nextCarousel, 4000);
}

function stopCarouselTimer() {
  clearInterval(carouselTimer);
  carouselTimer = null;
}

function nextCarousel() {
  carouselIndex = (carouselIndex + 1) % 3;
  updateCarousel();
}

function prevCarousel() {
  carouselIndex = (carouselIndex + 2) % 3;
  updateCarousel();
}

function updateCarousel() {
  const items = document.querySelectorAll('.carousel-item');
  items.forEach((item, i) => {
    item.classList.toggle('active', i === carouselIndex);
  });
  // Scroll active into center
  const track = document.getElementById('carouselTrack');
  const activeItem = items[carouselIndex];
  if (activeItem && track) {
    const itemWidth = activeItem.offsetWidth + 16; // gap
    const offset = carouselIndex * itemWidth - (track.parentElement.offsetWidth - activeItem.offsetWidth) / 2;
    track.style.transform = `translateX(-${Math.max(0, offset)}px)`;
  }
}

// ── STAGE 4: DIARY ───────────────────────
function enterStage4() {
  diaryOpened = false;
  document.getElementById('diaryContainer').classList.remove('hidden');
  document.getElementById('reasonsList').classList.add('hidden');
  document.getElementById('diaryBook').classList.remove('opening');
  document.querySelectorAll('.reason-item').forEach(r => r.classList.remove('visible'));
}

function initDiary() {
  const diaryContainer = document.getElementById('diaryContainer');
  diaryContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!diaryOpened && currentStage === 4) {
      openDiary();
      showTapFeedback(e);
    }
  });
}

function openDiary() {
  diaryOpened = true;
  const diary = document.getElementById('diaryBook');
  diary.classList.add('opening');

  setTimeout(() => {
    document.getElementById('diaryContainer').classList.add('hidden');
    const list = document.getElementById('reasonsList');
    list.classList.remove('hidden');

    const items = list.querySelectorAll('.reason-item');
    if (prefersReducedMotion) {
      items.forEach(i => i.classList.add('visible'));
    } else {
      items.forEach((item, i) => {
        setTimeout(() => {
          item.classList.add('visible');
        }, i * 350);
      });
    }
  }, 850);
}

// ── STAGE 5: CELEBRATION ─────────────────
function enterStage5() {
  if (stage5Animated) {
    // Reset
    const letters = document.querySelectorAll('.name-letter');
    letters.forEach(l => { l.style.opacity = '0'; l.style.transform = 'translateY(-120px) scale(1.4)'; });
    document.getElementById('celebrationText').classList.add('hidden');
    document.getElementById('stage5Hint').classList.add('hidden');
    document.getElementById('balloonsContainer').innerHTML = '';
    stage5Animated = false;
  }

  stage5Animated = true;
  stopCarouselTimer();

  if (prefersReducedMotion) {
    document.querySelectorAll('.name-letter').forEach(l => {
      l.style.opacity = '1'; l.style.transform = 'none';
    });
    const ct = document.getElementById('celebrationText');
    ct.classList.remove('hidden');
    ct.style.opacity = '1'; ct.style.transform = 'scale(1)';
    document.getElementById('stage5Hint').classList.remove('hidden');
    return;
  }

  // Letters drop in
  const letters = document.querySelectorAll('.name-letter');
  gsap.to(letters, {
    y: 0, opacity: 1, scale: 1, rotationX: 0,
    duration: 0.7, ease: 'bounce.out',
    stagger: 0.18,
    onComplete: () => {
      // Confetti explosion
      setTimeout(() => {
        launchConfetti();
        spawnBalloons();
        startFireworks();
        musicSwell(0.15, 4000);

        // Celebration text
        const ct = document.getElementById('celebrationText');
        ct.classList.remove('hidden');
        gsap.fromTo(ct, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });

        // Tap hint
        setTimeout(() => {
          const h = document.getElementById('stage5Hint');
          h.classList.remove('hidden');
          gsap.from(h, { opacity: 0, y: 10, duration: 0.4 });
        }, 3000);
      }, 200);
    }
  });
}

function launchConfetti() {
  const colors = ['#ffb6c1', '#f48fb1', '#d4af87', '#b76e79', '#ffffff', '#ffd6e0'];

  confetti({ particleCount: isMobile ? 100 : 150, spread: 80, origin: { y: 0.6 }, colors, scalar: 1.1, ticks: 200 });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors });
  }, 300);
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors, shapes: ['circle'], scalar: 0.8 });
  }, 600);
}

function spawnBalloons() {
  const container = document.getElementById('balloonsContainer');
  container.innerHTML = '';
  const balloonColors = ['#ffb6c1', '#f48fb1', '#ffd6e0', '#d4af87', '#e8a4a4', '#b76e79'];
  const count = isMobile ? 6 : 10;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const b = document.createElement('div');
      b.className = 'balloon';
      const color = balloonColors[i % balloonColors.length];
      b.style.background = `radial-gradient(circle at 35% 35%, ${color}ee, ${color}88)`;
      b.style.width = clamp(40, 8, 70) + 'px';
      b.style.left = (10 + Math.random() * 80) + '%';
      const duration = 3.5 + Math.random() * 2;
      b.style.animationDuration = duration + 's';
      b.style.animationDelay = '0s';
      container.appendChild(b);
      setTimeout(() => b.remove(), (duration + 0.5) * 1000);
    }, i * 300);
  }
}

function clamp(min, vw, max) {
  return Math.min(max, Math.max(min, window.innerWidth * vw / 100));
}

// Simple canvas fireworks
function startFireworks() {
  const canvas = document.getElementById('fireworksCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#ffb6c1', '#f48fb1', '#d4af87', '#b76e79', '#ffffff', '#ffd6e0'];
  const maxP = isMobile ? 40 : 80;

  function burst() {
    const x = 0.2 * canvas.width + Math.random() * 0.6 * canvas.width;
    const y = 0.1 * canvas.height + Math.random() * 0.5 * canvas.height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < maxP / 4; i++) {
      const angle = (Math.PI * 2 * i) / (maxP / 4);
      const speed = 1.5 + Math.random() * 2.5;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
    }
  }

  burst();
  setTimeout(burst, 600);
  setTimeout(burst, 1200);

  let running = true;
  setTimeout(() => { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }, 6000);

  function animate() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.04; // gravity
      p.life -= 0.016;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ── STAGE 6: FINALE ──────────────────────
function enterStage6() {
  const stage6 = document.getElementById('stage6');
  loadStageImages(stage6);

  const msg = document.getElementById('finalMessage');
  const sign = document.getElementById('finalSign');
  const replay = document.getElementById('replayBtn');
  const hearts = document.getElementById('floatingHearts');

  msg.classList.remove('visible');
  sign.classList.remove('visible');
  sign.classList.add('hidden');
  replay.classList.add('hidden');
  hearts.innerHTML = '';

  msg.textContent = CONTENT.stage6.message;
  sign.textContent = CONTENT.stage6.sign;

  if (prefersReducedMotion) {
    msg.classList.add('visible');
    sign.classList.remove('hidden'); sign.classList.add('visible');
    replay.classList.remove('hidden');
    return;
  }

  // Final image fade in
  const finalImg = document.getElementById('finalImg');
  gsap.fromTo(finalImg, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1.2, delay: 0.5 });

  // Message lines
  setTimeout(() => {
    msg.classList.add('visible');
  }, 1800);

  // Signature
  setTimeout(() => {
    sign.classList.remove('hidden');
    sign.style.opacity = '0';
    setTimeout(() => sign.classList.add('visible'), 50);
  }, 4800);

  // Replay button
  setTimeout(() => {
    replay.classList.remove('hidden');
    gsap.from(replay, { opacity: 0, y: 20, duration: 0.5 });
  }, 5800);

  // Floating hearts
  setTimeout(() => {
    spawnFloatingHearts(hearts);
  }, 5200);
}

function spawnFloatingHearts(container) {
  const heartEmojis = ['💕', '🌸', '✨', '💖'];
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = heartEmojis[i % heartEmojis.length];
      h.style.left = (5 + Math.random() * 90) + '%';
      h.style.animationDuration = (8 + Math.random() * 6) + 's';
      h.style.animationDelay = (Math.random() * 3) + 's';
      container.appendChild(h);
    }, i * 400);
  }
}

// ── REPLAY ───────────────────────────────
function replayAll() {
  // Stop carousel
  stopCarouselTimer();

  // Reset all stages
  for (let i = 0; i <= TOTAL_STAGES; i++) {
    const el = document.getElementById('stage' + i);
    if (!el) continue;
    if (i === 0) {
      el.classList.remove('hidden');
      el.style.opacity = '1';
    } else {
      el.classList.add('hidden');
    }
  }

  // Reset state
  currentStage = 0;
  diaryOpened = false;
  stage5Animated = false;
  carouselIndex = 1;

  // Reset dots
  initProgressDots();

  // Reset stage-specific UI
  document.getElementById('stage1Heading').textContent = '';
  document.getElementById('stage1Sub').classList.add('hidden');
  document.getElementById('stage1Hint').classList.add('hidden');

  document.getElementById('bubble1').classList.add('hidden'); document.getElementById('bubble1').classList.remove('visible');
  document.getElementById('bubble2').classList.add('hidden'); document.getElementById('bubble2').classList.remove('visible');
  document.getElementById('typingIndicator').classList.add('hidden');
  document.getElementById('stage2Hint').classList.add('hidden');

  document.getElementById('diaryBook').classList.remove('opening');
  document.getElementById('diaryContainer').classList.remove('hidden');
  document.getElementById('reasonsList').classList.add('hidden');
  document.querySelectorAll('.reason-item').forEach(r => r.classList.remove('visible'));

  document.getElementById('celebrationText').classList.add('hidden');
  document.getElementById('stage5Hint').classList.add('hidden');
  document.getElementById('balloonsContainer').innerHTML = '';

  document.getElementById('finalMessage').classList.remove('visible');
  document.getElementById('finalSign').classList.remove('visible');
  document.getElementById('finalSign').classList.add('hidden');
  document.getElementById('replayBtn').classList.add('hidden');
  document.getElementById('floatingHearts').innerHTML = '';

  // Reset flip cards
  document.querySelectorAll('.flip-card').forEach(c => c.classList.remove('flipped'));

  // Reset polaroids
  document.querySelectorAll('.polaroid').forEach((p, i) => {
    p.classList.remove('active');
    if (i === 0) p.style.transform = 'rotate(-4deg) translateY(8px)';
    else if (i === 1) p.style.transform = 'rotate(2deg) translateY(4px)';
    else p.style.transform = 'rotate(-1deg)';
  });

  // Carousel
  updateCarousel();
}
window.replayAll = replayAll;
