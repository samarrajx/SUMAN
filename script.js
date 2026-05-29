/* ═══════════════════════════════════════════════
   SUMAN BIRTHDAY EXPERIENCE — COMPLETE SCRIPT
   ═══════════════════════════════════════════════ */

'use strict';

/* ─── GLOBAL STATE ─── */
let currentStage = 0;
const TOTAL_STAGES = 7; // 0-6
let musicStarted = false;
let isMuted = false;
let carouselIndex = 1;
let carouselTimer = null;
const isMobile = window.innerWidth <= 480 || /Mobi|Android/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let stage3Initialized = false;
let stage4Unlocked = false;
let fireworksAnimId = null;
let fireworksTimeout = null;
let isTransitioning = false;
let lastTouchTime = 0; // dedup touch vs click

/* ─── CONTENT ─── */
const CONTENT = {
  stage0: {
    title: "Kuch special\ntere liye hai...",
    sub:   "Ek baar tap kar — bas ek baar 🤫",
    btn:   "Tap kar Suman 👇"
  },
  stage1: {
    heading: "Aye Suman Ghoshal...",
    sub:     "Tu soch rahi hogi —\nyeh kya tamasha hai 😂"
  },
  stage2: {
    bubble1: "Okay sun,\nmain chahta tha ki kuch normal karu tere liye.\n\nPar tu jaanti hai na mujhe —\nnormal mujhse hota nahi 😂\n\nToh bas... ek poora website bana diya.\nKyunki tu iska haqdar hai. Obviously. 🙄✨",
    bubble2: "Aur honestly?\nTujhe khush dekhna hi meri\nsabse badi achievement hai.\n\nHappy Birthday Suman. 🎂💕"
  },
  stage3: {
    title: "Hum, but make it cinematic 🎬",
    polaroidCaptions: [
      "Yeh din yaad hai? 😂",
      "Main toh abhi bhi shocked hoon",
      "Evidence delete karna tha humein 💀"
    ],
    flipBackMessages: [
      "Yeh photo? Crime scene hai.\nPar hum acche lagte hain. 😎",
      "Itni achi photo kaise aayi —\ninvestigation pending hai 🔍",
      "Core memory. Delete nahi\nhogi kabhi. 💕"
    ]
  },
  stage4: {
    lockText:   "Yeh sirf tere liye hai, Suman... 🔐",
    unlockHint: "Tap karke open karo 👆",
    reasons: [
      { emoji: "✨", text: "Tu exist karti hai — yahi kaafi hai" },
      { emoji: "🔥", text: "Teri energy match karna impossible hai" },
      { emoji: "💕", text: "Tera roast bhi pyaar lagta hai" },
      { emoji: "😂", text: "Tu drama queen hai — par OUR drama queen hai" },
      { emoji: "🌸", text: "Tere jaisi doosri nahi — seriously, try karke dekha" }
    ]
  },
  stage5: {
    letters:     ["S", "U", "M", "A", "N"],
    celebration: "HAPPY BIRTHDAY! 🎂"
  },
  stage6: {
    message: "Tu mere liye bahut special hai, Suman.\n\nYeh saal bhi tera ho —\nkhushi se bhara, drama se bhara,\naur haan... thodi aur bakwaas bhi. 😂\n\nJanamdin Mubarak ho. 🎂🌸",
    sign:    "— Samar Raj 💕",
    replay:  "Phir se dekh 🔁"
  }
};

/* ─── DOM REFS ─── */
const bgMusic   = document.getElementById('bgMusic');
const muteBtn   = document.getElementById('muteBtn');
const dotsWrap  = document.getElementById('progressDots');
const stage0El  = document.getElementById('stage0');

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  buildProgressDots();
  spawnPetals();
  initLazyImages();
  updateProgressDots(0);

  /* ── CTA button: touchend fires music (must be in gesture stack) + advances ── */
  const ctaBtn = document.getElementById('ctaBtn');
  ctaBtn.addEventListener('touchend', (e) => {
    e.preventDefault();         // only prevents click ghost on THIS element
    e.stopPropagation();
    lastTouchTime = Date.now();
    unlockAudioAndStart();      // play() in direct gesture stack = iOS safe
    handleFirstTap();
  }, { passive: false });
  ctaBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (Date.now() - lastTouchTime < 600) return; // skip ghost click after touch
    unlockAudioAndStart();
    handleFirstTap();
  });

  // Polaroid cycling
  document.querySelectorAll('.polaroid').forEach((p) => {
    p.addEventListener('touchend', (e) => {
      e.preventDefault(); e.stopPropagation();
      lastTouchTime = Date.now();
      cycleActiveClass(document.querySelectorAll('.polaroid'), p);
    }, { passive: false });
    p.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Date.now() - lastTouchTime < 600) return;
      cycleActiveClass(document.querySelectorAll('.polaroid'), p);
    });
  });

  // Flip cards
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('touchend', (e) => {
      e.preventDefault(); e.stopPropagation();
      lastTouchTime = Date.now();
      card.classList.toggle('flipped');
    }, { passive: false });
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Date.now() - lastTouchTime < 600) return;
      card.classList.toggle('flipped');
    });
  });

  // Carousel touch
  initCarouselTouch();

  // Diary tap
  const diary = document.getElementById('diary');
  if (diary) {
    diary.addEventListener('touchend', (e) => {
      e.preventDefault(); e.stopPropagation();
      lastTouchTime = Date.now();
      if (!stage4Unlocked) unlockDiary();
    }, { passive: false });
    diary.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Date.now() - lastTouchTime < 600) return;
      if (!stage4Unlocked) unlockDiary();
    });
  }
  const diaryOverlay = document.getElementById('diaryOverlay');
  if (diaryOverlay) {
    diaryOverlay.addEventListener('touchend', (e) => {
      e.preventDefault(); e.stopPropagation();
      lastTouchTime = Date.now();
      if (!stage4Unlocked) unlockDiary();
    }, { passive: false });
    diaryOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Date.now() - lastTouchTime < 600) return;
      if (!stage4Unlocked) unlockDiary();
    });
  }

  // Replay
  document.getElementById('replayBtn').addEventListener('touchend', (e) => {
    e.preventDefault(); e.stopPropagation();
    lastTouchTime = Date.now();
    replayExperience();
  }, { passive: false });
  document.getElementById('replayBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (Date.now() - lastTouchTime < 600) return;
    replayExperience();
  });

  // Mute
  muteBtn.addEventListener('touchend', (e) => {
    e.preventDefault(); e.stopPropagation();
    lastTouchTime = Date.now();
    toggleMute();
  }, { passive: false });
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (Date.now() - lastTouchTime < 600) return;
    toggleMute();
  });

  /* ── Global advance: touchend fires instantly, click deduped ── */
  document.addEventListener('touchend', (e) => {
    if (e.target.closest('.no-tap-advance')) return;
    lastTouchTime = Date.now();
    handleGlobalTap(e);
  }, { passive: true });          // passive=true — NO preventDefault on document

  document.addEventListener('click', (e) => {
    if (Date.now() - lastTouchTime < 600) return; // skip ghost click
    handleGlobalTap(e);
  });
});

/* ─── PROGRESS DOTS ─── */
function buildProgressDots() {
  dotsWrap.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.id = `dot${i}`;
    dotsWrap.appendChild(dot);
  }
}

function updateProgressDots(stage) {
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.remove('active', 'complete', 'final-glow');
    if (i < stage) dot.classList.add('complete');
    if (i === stage) dot.classList.add('active');
    if (stage === 6) dot.classList.add('final-glow');
  });
}

/* ─── TAP FEEDBACK (ripple) ─── */
function showTapFeedback(e) {
  const x = e.clientX || (e.touches && e.touches[0]?.clientX) ||
            (e.changedTouches && e.changedTouches[0]?.clientX) || window.innerWidth / 2;
  const y = e.clientY || (e.touches && e.touches[0]?.clientY) ||
            (e.changedTouches && e.changedTouches[0]?.clientY) || window.innerHeight / 2;
  const ripple = document.createElement('div');
  ripple.className = 'tap-ripple';
  ripple.style.left = x + 'px';
  ripple.style.top  = y + 'px';
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

/* ─── GLOBAL TAP HANDLER ─── */
function handleGlobalTap(e) {
  if (e.target.closest('.no-tap-advance')) return;
  if (currentStage === 0) return; // Stage 0 handled by CTA button
  if (currentStage >= 6) return;  // Stage 6 is final
  if (currentStage === 3) return; // Stage 3 has internal sub-sections, advance via button
  if (currentStage === 4 && !stage4Unlocked) return; // Wait for diary unlock
  if (isTransitioning) return;

  showTapFeedback(e);
  advanceStage();
}

function handleFirstTap() {
  if (isTransitioning) return;
  showTapFeedback({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
  advanceStage();
}

/* ─── STAGE MANAGEMENT ─── */
function advanceStage() {
  if (isTransitioning) return;
  const prev = currentStage;
  currentStage++;
  if (currentStage > 6) { currentStage = 6; return; }
  isTransitioning = true;
  updateProgressDots(currentStage);
  transitionStages(prev, currentStage);
}

function transitionStages(from, to) {
  const fromEl = document.getElementById(`stage${from}`);
  const toEl   = document.getElementById(`stage${to}`);

  if (fromEl) {
    fromEl.classList.add('exiting');
    fromEl.classList.remove('active');
    setTimeout(() => {
      fromEl.classList.remove('exiting');
      fromEl.style.zIndex = '';
    }, 500);
  }

  if (toEl) {
    toEl.classList.add('active');
    setTimeout(() => { isTransitioning = false; }, 600);
    runStageEntrance(to);
  } else {
    isTransitioning = false;
  }
}

/* ─── STAGE ENTRANCES ─── */
function runStageEntrance(stage) {
  switch (stage) {
    case 1: enterStage1(); break;
    case 2: enterStage2(); break;
    case 3: enterStage3(); break;
    case 4: enterStage4(); break;
    case 5: enterStage5(); break;
    case 6: enterStage6(); break;
  }
}

/* ─── STAGE 1: THE ARRIVAL ─── */
function enterStage1() {
  startMusic(); // fallback for desktop (mobile already called unlockAudioAndStart)
  setTimeout(() => { muteBtn.classList.add('visible'); }, 400);

  const heroImg = document.getElementById('heroImg');
  heroImg.src = 'assets/images/hero1.jpg';
  heroImg.onload = () => heroImg.classList.add('loaded');

  const headingEl = document.getElementById('stage1Heading');
  const subEl     = document.getElementById('stage1Sub');
  const tapHint   = document.getElementById('stage1TapHint');

  // Sparkles
  const sparklePositions = [
    { top: '12%', left: '8%' }, { top: '12%', right: '8%', left: 'auto' },
    { bottom: '18%', left: '8%' }, { bottom: '18%', right: '8%', left: 'auto' }
  ];
  const stage1El = document.getElementById('stage1');
  sparklePositions.forEach((pos, i) => {
    const sp = document.createElement('span');
    sp.className = 'sparkle no-events';
    sp.textContent = ['✨', '🌸', '⭐', '💫'][i];
    Object.assign(sp.style, pos, { position: 'absolute', animationDelay: `${i * 0.4}s` });
    stage1El.appendChild(sp);
  });

  setTimeout(() => {
    typeWriter(headingEl, CONTENT.stage1.heading, 45, () => {
      setTimeout(() => {
        subEl.classList.add('visible');
        // Animate sparkles
        document.querySelectorAll('.sparkle').forEach((s, i) => {
          setTimeout(() => { s.style.opacity = '1'; }, i * 150);
        });
        setTimeout(() => { tapHint.classList.add('visible'); }, 1200);
      }, 300);
    });
  }, 1000);
}

/* ─── STAGE 2: WHATSAPP CHAT ─── */
function enterStage2() {
  const typing   = document.getElementById('typingIndicator');
  const bubble1  = document.getElementById('bubble1');
  const bubble2  = document.getElementById('bubble2');
  const tapHint2 = document.getElementById('stage2TapHint');

  // Set content
  bubble1.querySelector('.bubble-text').textContent = CONTENT.stage2.bubble1;
  bubble2.querySelector('.bubble-text').textContent = CONTENT.stage2.bubble2;

  function showTyping(cb, delay) {
    setTimeout(() => {
      typing.classList.add('visible');
      setTimeout(() => {
        typing.classList.remove('visible');
        cb && cb();
      }, delay);
    }, 200);
  }

  // Sequence
  setTimeout(() => {
    showTyping(() => {
      bubble1.style.display = 'block';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { bubble1.classList.add('visible'); });
      });

      setTimeout(() => {
        showTyping(() => {
          bubble2.style.display = 'block';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { bubble2.classList.add('visible'); });
          });

          setTimeout(() => { launchEmojiRain(); }, 1500);
          setTimeout(() => { tapHint2.classList.add('visible'); }, 2500);
        }, 1500);
      }, 3200);
    }, 1200);
  }, 600);
}

function launchEmojiRain() {
  const container = document.getElementById('emojiRainContainer');
  container.style.display = 'block';
  const emojis = ['🎂', '✨', '💕', '🎊', '🌸', '🎉'];
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'emoji-rain-item no-events';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left  = Math.random() * 95 + '%';
      el.style.animationDuration = (2 + Math.random() * 2) + 's';
      el.style.animationDelay    = '0s';
      container.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 220);
  }
  setTimeout(() => { container.style.display = 'none'; }, 5000);
}

/* ─── STAGE 3: MEMORIES ─── */
function enterStage3() {
  if (stage3Initialized) return;
  stage3Initialized = true;

  // Init carousel
  updateCarousel(carouselIndex);
  carouselTimer = setInterval(() => {
    carouselIndex = (carouselIndex % 3) + 1;
    updateCarousel(carouselIndex);
  }, 4000);

  // Set polaroid captions
  document.querySelectorAll('.polaroid-caption').forEach((cap, i) => {
    cap.textContent = CONTENT.stage3.polaroidCaptions[i] || '';
  });

  // Set flip back messages
  document.querySelectorAll('.flip-back p').forEach((p, i) => {
    p.textContent = CONTENT.stage3.flipBackMessages[i] || '';
  });

  // Activate middle polaroid
  const polaroids = document.querySelectorAll('.polaroid');
  if (polaroids.length) cycleActiveClass(polaroids, polaroids[2]);

  // Show next stage button after a moment
  setTimeout(() => {
    document.getElementById('stage3NextBtn').style.opacity = '1';
    document.getElementById('stage3NextBtn').style.transform = 'translateY(0)';
  }, 1200);
}

// Carousel helpers
function updateCarousel(index) {
  const items = document.querySelectorAll('.carousel-item');
  const dots  = document.querySelectorAll('.carousel-dot');
  const track = document.getElementById('carouselTrack');

  items.forEach((item, i) => {
    item.classList.toggle('active', i + 1 === index);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 === index);
  });

  const itemWidth = items[0] ? items[0].offsetWidth + 16 : 0;
  const offset = (index - 1) * itemWidth - (document.querySelector('.carousel-wrap').offsetWidth / 2 - itemWidth / 2);
  if (track) track.style.transform = `translateX(${-offset}px)`;
}

function initCarouselTouch() {
  const wrap = document.querySelector('.carousel-wrap');
  if (!wrap) return;
  let touchStartX = 0;
  wrap.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  wrap.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) carouselIndex = Math.min(3, carouselIndex + 1);
      else          carouselIndex = Math.max(1, carouselIndex - 1);
      updateCarousel(carouselIndex);
      clearInterval(carouselTimer);
      carouselTimer = setInterval(() => {
        carouselIndex = (carouselIndex % 3) + 1;
        updateCarousel(carouselIndex);
      }, 4000);
    }
  }, { passive: true });
  wrap.addEventListener('click', (e) => { e.stopPropagation(); });
}

function cycleActiveClass(items, activeItem) {
  items.forEach(item => item.classList.remove('active'));
  activeItem.classList.add('active');
}

/* ─── STAGE 4: DIARY UNLOCK ─── */
function enterStage4() {
  stage4Unlocked = false;
  document.getElementById('diaryOverlay').classList.remove('hidden');
  document.getElementById('reasonsContainer').classList.remove('visible');
  document.querySelectorAll('.reason-item').forEach(r => r.classList.remove('visible'));
}

function unlockDiary() {
  if (stage4Unlocked) return;
  stage4Unlocked = true;

  const diary   = document.getElementById('diary');
  const overlay = document.getElementById('diaryOverlay');
  const reasons = document.getElementById('reasonsContainer');

  diary.classList.add('opening');
  setTimeout(() => {
    overlay.classList.add('hidden');
    reasons.classList.add('visible');

    const items = document.querySelectorAll('.reason-item');
    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.add('visible');
      }, i * 350);
    });

    // After all reasons shown, enable advance
    setTimeout(() => {
      document.getElementById('stage4NextBtn').style.opacity = '1';
      document.getElementById('stage4NextBtn').style.transform = 'translateY(0)';
    }, items.length * 350 + 400);
  }, 800);
}

/* ─── STAGE 5: CELEBRATION ─── */
function enterStage5() {
  clearCarouselTimer();
  const letters       = document.querySelectorAll('.name-letter');
  const celebrationEl = document.getElementById('celebrationText');

  // Drop letters one by one
  letters.forEach((letter, i) => {
    setTimeout(() => {
      letter.classList.add('dropped');
    }, i * 180);
  });

  // After all letters — BOOM
  const lastLetterTime = (letters.length - 1) * 180 + 700;

  setTimeout(() => {
    // Confetti
    if (!prefersReducedMotion && typeof confetti !== 'undefined') {
      confetti({
        particleCount: isMobile ? 120 : 180,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#ffb6c1','#f48fb1','#d4af87','#b76e79','#ffffff','#ffd6e0'],
        scalar: 1.1,
        ticks: 200
      });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 55, origin: { x: 0, y: 0.6 },
          colors: ['#ffb6c1','#f48fb1','#d4af87','#ffffff'] });
        confetti({ particleCount: 60, spread: 55, origin: { x: 1, y: 0.6 },
          colors: ['#ffb6c1','#f48fb1','#d4af87','#ffffff'] });
      }, 300);
    }

    // Balloons
    spawnBalloons(isMobile ? 6 : 10);

    // Fireworks canvas
    startFireworks();

    // Celebration text
    celebrationEl.classList.add('visible');

    // Music swell
    if (musicStarted && !isMuted && bgMusic) {
      const originalVol = bgMusic.volume;
      const target = Math.min(1, originalVol + 0.12);
      fadeVolume(bgMusic, target, 400);
      setTimeout(() => fadeVolume(bgMusic, originalVol, 3000), 4000);
    }

    // Stop fireworks after 6s
    fireworksTimeout = setTimeout(() => {
      stopFireworks();
    }, 6000);

    // Show tap hint
    setTimeout(() => {
      document.getElementById('stage5TapHint').classList.add('visible');
    }, 3000);

  }, lastLetterTime);
}

function spawnBalloons(count) {
  const colors = ['#ffb6c1','#f48fb1','#ffd6e0','#d4af87','#e8a4a4','#b76e79'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const balloon = document.createElement('div');
      balloon.className = 'balloon no-events';
      const size = clamp(35, 8 + Math.random() * 5, 60);
      balloon.style.width  = size + 'px';
      balloon.style.left   = (5 + Math.random() * 90) + '%';
      balloon.style.background = colors[Math.floor(Math.random() * colors.length)];
      const dur = 3.5 + Math.random() * 2;
      balloon.style.animationDuration = dur + 's';
      document.getElementById('stage5').appendChild(balloon);
      setTimeout(() => balloon.remove(), dur * 1000 + 200);
    }, i * 300);
  }
}

function clamp(min, val, max) { return Math.max(min, Math.min(max, val)); }

/* ─── FIREWORKS ─── */
function startFireworks() {
  const canvas = document.getElementById('fireworksCanvas');
  if (!canvas || prefersReducedMotion) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors    = ['#ffb6c1','#f48fb1','#d4af87','#b76e79','#ffffff','#ffd6e0'];
  const MAX_P     = isMobile ? 40 : 80;

  function createBurst(x, y) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < MAX_P / 4; i++) {
      const angle = (Math.PI * 2 * i) / (MAX_P / 4);
      const speed = 2 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1, radius: 2 + Math.random() * 2, color
      });
    }
  }

  // Burst a few times
  const burstTimes = [0, 800, 1600, 2400, 3200, 4000];
  burstTimes.forEach(t => {
    setTimeout(() => {
      createBurst(
        0.2 * canvas.width + Math.random() * 0.6 * canvas.width,
        0.15 * canvas.height + Math.random() * 0.4 * canvas.height
      );
    }, t);
  });

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.06;  // gravity
      p.vx *= 0.98;
      p.alpha -= 0.018;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
    fireworksAnimId = requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

function stopFireworks() {
  if (fireworksAnimId) { cancelAnimationFrame(fireworksAnimId); fireworksAnimId = null; }
  const canvas = document.getElementById('fireworksCanvas');
  if (canvas) canvas.style.display = 'none';
}

/* ─── STAGE 6: FINALE ─── */
function enterStage6() {
  stopFireworks();
  clearCarouselTimer();

  const finalImgWrap = document.getElementById('finalImgWrap');
  const finalMsg     = document.getElementById('finalMessage');
  const finalSign    = document.getElementById('finalSign');
  const replayBtn    = document.getElementById('replayBtn');

  // Set content
  finalMsg.textContent  = CONTENT.stage6.message;
  finalSign.textContent = CONTENT.stage6.sign;
  replayBtn.textContent = CONTENT.stage6.replay;

  // Load image
  const img = finalImgWrap.querySelector('img');
  img.src = 'assets/images/final.jpg';
  img.onload = () => {};

  // Sequence
  setTimeout(() => {
    finalImgWrap.classList.add('visible');
  }, 800);

  setTimeout(() => {
    finalMsg.classList.add('visible');
  }, 2200);

  setTimeout(() => {
    finalSign.classList.add('visible');
  }, 4800);

  setTimeout(() => {
    replayBtn.classList.add('visible');
  }, 5800);

  // Floating hearts
  setTimeout(() => {
    spawnHearts();
  }, 5200);

  // All dots glow
  setTimeout(() => {
    document.querySelectorAll('.dot').forEach(d => d.classList.add('final-glow'));
  }, 6000);

  // Soft music fade
  if (musicStarted && !isMuted && bgMusic) {
    setTimeout(() => { fadeVolume(bgMusic, 0.22, 2000); }, 1000);
  }
}

function spawnHearts() {
  const heartEmojis = ['💕','🌸','💗','✨','🎂'];
  for (let i = 0; i < 12; i++) {
    const h = document.createElement('div');
    h.className = 'heart no-events';
    h.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    h.style.left            = Math.random() * 100 + '%';
    h.style.animationDuration = (8 + Math.random() * 8) + 's';
    h.style.animationDelay  = Math.random() * 4 + 's';
    document.getElementById('stage6').appendChild(h);
  }
}

/* ─── TYPEWRITER ─── */
function typeWriter(element, text, speed = 45, callback) {
  element.textContent = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  cursor.textContent = '|';
  element.appendChild(cursor);
  const timer = setInterval(() => {
    if (i < text.length) {
      cursor.insertAdjacentText('beforebegin', text[i]);
      i++;
    } else {
      clearInterval(timer);
      setTimeout(() => cursor.remove(), 800);
      if (callback) callback();
    }
  }, speed);
}

/* ─── AUDIO ─── */

// Must be called directly inside a touchend/click handler for iOS autoplay policy
function unlockAudioAndStart() {
  if (musicStarted || !bgMusic) return;
  bgMusic.volume = 0;
  bgMusic.load();
  const p = bgMusic.play();
  if (p && p.then) {
    p.then(() => {
      musicStarted = true;
      fadeVolume(bgMusic, 0.38, 2000);
    }).catch(() => {}); // silent fail
  }
}

// Fallback for desktop browsers
async function startMusic() {
  if (musicStarted || !bgMusic) return;
  try {
    bgMusic.volume = 0;
    const p = bgMusic.play();
    if (p) await p;
    musicStarted = true;
    fadeVolume(bgMusic, 0.38, 2000);
  } catch (e) { /* Silent fail */ }
}

function toggleMute() {
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

function fadeVolume(audio, targetVol, durationMs) {
  if (!audio) return;
  const steps    = 30;
  const stepTime = durationMs / steps;
  const startVol = audio.volume;
  const diff     = targetVol - startVol;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    audio.volume = Math.max(0, Math.min(1, startVol + diff * (step / steps)));
    if (step >= steps) clearInterval(timer);
  }, stepTime);
}

/* ─── LAZY IMAGES ─── */
function initLazyImages() {
  document.querySelectorAll('img[data-src]').forEach(img => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.src = el.dataset.src;
          el.onload = () => el.classList.add('loaded');
          observer.unobserve(el);
        }
      });
    }, { rootMargin: '100px' });
    observer.observe(img);
  });
}

/* ─── PETALS ─── */
function spawnPetals() {
  const stage0 = document.getElementById('stage0');
  for (let i = 0; i < 8; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal no-events';
    petal.style.setProperty('--i', i);
    petal.style.animationDelay = (Math.random() * 6) + 's';
    stage0.appendChild(petal);
  }
}

/* ─── HELPERS ─── */
function clearCarouselTimer() {
  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
}

function replayExperience() {
  stopFireworks();
  if (fireworksTimeout) clearTimeout(fireworksTimeout);
  clearCarouselTimer();

  // Reset state
  currentStage      = 0;
  musicStarted      = false;
  isMuted           = false;
  stage3Initialized = false;
  stage4Unlocked    = false;
  carouselIndex     = 1;
  isTransitioning   = false;

  // Reset music
  if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; bgMusic.volume = 0; bgMusic.muted = false; }
  muteBtn.textContent = '🔊';
  muteBtn.classList.remove('visible');

  // Reset stage elements
  document.querySelectorAll('.stage').forEach(s => {
    s.classList.remove('active', 'exiting');
    s.style.zIndex = '';
  });

  // Reset specific stage elements
  document.getElementById('stage1Heading').textContent = '';
  document.getElementById('stage1Sub').classList.remove('visible');
  document.getElementById('stage1TapHint').classList.remove('visible');
  document.querySelectorAll('.sparkle').forEach(s => s.remove());

  document.getElementById('bubble1').classList.remove('visible');
  document.getElementById('bubble2').classList.remove('visible');
  document.getElementById('bubble1').style.display = 'none';
  document.getElementById('bubble2').style.display = 'none';
  document.getElementById('typingIndicator').classList.remove('visible');
  document.getElementById('stage2TapHint').classList.remove('visible');
  document.getElementById('emojiRainContainer').innerHTML = '';

  document.querySelectorAll('.name-letter').forEach(l => l.classList.remove('dropped'));
  document.getElementById('celebrationText').classList.remove('visible');
  document.getElementById('stage5TapHint').classList.remove('visible');
  document.querySelectorAll('#stage5 .balloon').forEach(b => b.remove());

  document.getElementById('finalImgWrap').classList.remove('visible');
  document.getElementById('finalMessage').classList.remove('visible');
  document.getElementById('finalSign').classList.remove('visible');
  document.getElementById('replayBtn').classList.remove('visible');
  document.querySelectorAll('#stage6 .heart').forEach(h => h.remove());

  document.getElementById('diaryOverlay').classList.remove('hidden');
  document.querySelectorAll('.reason-item').forEach(r => r.classList.remove('visible'));
  document.getElementById('reasonsContainer').classList.remove('visible');
  document.getElementById('stage4NextBtn').style.opacity = '0';
  document.getElementById('stage4NextBtn').style.transform = 'translateY(20px)';
  document.getElementById('stage3NextBtn').style.opacity = '0';
  document.getElementById('stage3NextBtn').style.transform = 'translateY(20px)';

  document.querySelectorAll('.flip-card').forEach(c => c.classList.remove('flipped'));
  document.querySelectorAll('.polaroid').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('active','complete','final-glow'));

  // Show stage 0 again
  const s0 = document.getElementById('stage0');
  s0.style.opacity = '';
  s0.style.zIndex  = '';
  s0.style.pointerEvents = '';
  s0.classList.remove('exiting');
  s0.classList.add('active');
  updateProgressDots(0);
}

/* ─── STAGE ADVANCE BUTTONS ─── */
function nextFromStage3() {
  if (isTransitioning) return;
  showTapFeedback({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
  advanceStage();
}
function nextFromStage4() {
  if (isTransitioning || !stage4Unlocked) return;
  showTapFeedback({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
  advanceStage();
}
