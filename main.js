/* ═══════════════════════════════════════
   APEX GROWTH SYSTEM — Production JS v4
   Pattern reference: Goliath School
   ═══════════════════════════════════════ */

/* ── HAPTICS ENGINE (Goliath pattern) ── */
const Haptics = {
    _iosSwitch: null,
    initIOS() {
        if (!this._iosSwitch && typeof window !== 'undefined') {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.setAttribute('switch', '');
            cb.style.cssText = 'position:absolute;opacity:0;pointer-events:none;z-index:-1';
            document.body.appendChild(cb);
            this._iosSwitch = cb;
        }
    },
    vibrate(pattern) {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        if (isIOS && this._iosSwitch) {
            this._iosSwitch.checked = !this._iosSwitch.checked;
        } else if (navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch(e){}
        }
    },
    light()   { this.vibrate(10); },
    medium()  { this.vibrate(20); },
    heavy()   { this.vibrate(30); },
    success() { this.vibrate([10,50,20]); },
};
document.addEventListener('DOMContentLoaded', () => {
  Haptics.initIOS();

  // Hero video — try autoplay, fall back to play-on-first-interaction if blocked.
  // iOS Low Power Mode, some Android browsers, and stricter autoplay policies
  // can reject autoplay even with muted+playsinline. The listeners below cover
  // that: first touch/scroll/click kicks playback and then removes themselves.
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    heroVideo.play().catch(() => {
      const playOnInteract = () => {
        heroVideo.play().catch(() => {});
        document.removeEventListener('touchstart', playOnInteract);
        document.removeEventListener('scroll', playOnInteract);
        document.removeEventListener('click', playOnInteract);
      };
      document.addEventListener('touchstart', playOnInteract, { passive: true });
      document.addEventListener('scroll', playOnInteract, { passive: true });
      document.addEventListener('click', playOnInteract);
    });
  }
});

// Global haptics on button clicks
document.addEventListener('click', (e) => {
    const btn = e.target.closest('a.b-buy, a.b-main, button');
    if (!btn) return;
    if (btn.classList.contains('b-buy') || btn.id === 'calcBtn') {
        Haptics.success();
    } else if (btn.classList.contains('b-main')) {
        Haptics.medium();
    } else {
        Haptics.light();
    }
});

/* ── PROTOCOL ZONE TOGGLE ── */
const PROTO_NAMES = {
  ais: 'IMPACT STIMULUS',
  hgh: 'GROWTH HORMONE',
  vbr: 'AXIAL ELONGATION',
  opl: 'DISC REHYDRATION',
  nhm: 'NOCTURNAL REPAIR',
  tpm: 'NEURAL PULSE',
  cse: 'FASCIAL RELEASE',
};
const activeProtos = new Set();

window.toggleProto = function(id) {
  const overlay = document.getElementById('overlay-' + id);
  if (!overlay) return;
  const isOn = activeProtos.has(id);
  if (isOn) {
    activeProtos.delete(id);
    overlay.style.opacity = '0';
    const ldot = document.getElementById('ldot-' + id);
    if (ldot) { ldot.style.opacity = '0'; ldot.style.animation = 'none'; }
  } else {
    activeProtos.add(id);
    overlay.style.opacity = '1';
    const ldot = document.getElementById('ldot-' + id);
    if (ldot) { ldot.style.opacity = '1'; ldot.style.animation = 'protoPulse 1.2s ease-in-out infinite'; }
  }
  // Update scan status bar
  const statusEl = document.getElementById('scanStatusText');
  if (statusEl) {
    if (activeProtos.size === 0) {
      statusEl.textContent = 'SCAN ACTIVE \u2014 SUBJECT NOMINAL';
    } else {
      const names = [...activeProtos].map(k => PROTO_NAMES[k] || k).join(' + ');
      statusEl.textContent = 'PROTOCOL: ' + names;
    }
  }
  Haptics.light();
};

document.addEventListener('DOMContentLoaded', () => {
  /* ── Title animation lock: prevent re-trigger on hover/unhover ──
     Once animation ends, mark line as done so CSS disables it. */
  document.querySelectorAll('.h-title .t-line').forEach(line => {
    line.addEventListener('animationend', () => {
      line.classList.add('t-done');
    }, { once: true });
    // Fallback: lock after 2s in case animationend never fires
    setTimeout(() => line.classList.add('t-done'), 2000);
  });

  /* ── WIRE ZONE CLICK HITS ── */
  document.querySelectorAll('.zone-hit[data-proto]').forEach(el => {
    el.addEventListener('click', () => window.toggleProto(el.dataset.proto));
  });

  /* ── RESPONSIVE SVG VIEWBOX ── */
  const anatomySvg = document.getElementById('anatomySvg');
  function updateSvgViewBox() {
    if (!anatomySvg) return;
    // On narrow screens hide the label column (x=238-360) from viewBox
    anatomySvg && anatomySvg.setAttribute('viewBox', window.innerWidth <= 900
      ? '0 0 400 700'   // body only
      : '0 0 400 700'   // body + right label panel
    );
  }
  updateSvgViewBox();
  window.addEventListener('resize', updateSvgViewBox, { passive: true });

    /* ── CUSTOM CURSOR ── */
    const cursor     = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursorRing');

    // Fix #1: Skip cursor entirely on touch/coarse pointer devices — prevents hidden-cursor-no-visual state
    if (cursor && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let mx = -100, my = -100;
        let rx = -100, ry = -100;

        let ringRafId = null;

        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
            cursor.style.left = mx + 'px';
            cursor.style.top  = my + 'px';
            if (!ringRafId) ringRafId = requestAnimationFrame(animRing);
        });

        // Ring follows with slight lag — RAF stops when converged (saves CPU on idle)
        function animRing() {
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            cursorRing.style.left = rx + 'px';
            cursorRing.style.top  = ry + 'px';
            if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) {
                ringRafId = requestAnimationFrame(animRing);
            } else {
                ringRafId = null;
            }
        }

        const hoverTargets = document.querySelectorAll(
            'a, button, .faq-q, .m-card, .c-card, .d-cell'
        );
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                cursorRing.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
                cursorRing.classList.remove('hover');
            });
        });
    }

    /* ── SCROLL REVEAL ── */
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('vis');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.rv').forEach(el => revealObs.observe(el));

    /* ── SMOOTH SCROLL ── */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const href = a.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const y = target.getBoundingClientRect().top + window.pageYOffset - 62;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

    /* ── NAVBAR AUTO-HIDE ── */
    const nav = document.getElementById('nav');
    let lastScroll = 0;
    if (nav) {
        window.addEventListener('scroll', () => {
            const cur = window.scrollY;
            if (cur > lastScroll && cur > 200) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }
            lastScroll = cur;
        }, { passive: true });
    }

    /* ══════════════════════════════════════════
       ANATOMY SVG OBSERVER — Goliath pattern
       rootMargin: '-30% 0px -40% 0px' triggers
       only when card is in the middle 30% band
       ══════════════════════════════════════════ */
    const methodCards   = document.querySelectorAll('.m-card');
    const anatomyParts  = document.querySelectorAll('.anat-part');
    const statusEl      = document.getElementById('monitorStatus');
    const bioLockEl     = document.getElementById('bioLock');
    const barFillEl     = document.getElementById('monitorBarFill');
    const heightValEl   = document.getElementById('heightVal');
    const heightDeltaEl = document.getElementById('heightDelta');

    // Part map: data-part → selector (now using IDs)
    const partMap = {
        'legs'      : '#overlay-ais',
        'head'      : '#overlay-hgh',
        'spine'     : '#overlay-vbr',
        'discs'     : '#overlay-opl',
        'full-sleep': '#overlay-nhm',
        'head2'     : '#overlay-tpm',
        'full-cse'  : '#overlay-cse',
    };

    // Readout config per card index
    const cardData = [
        { label: 'IMPACT STIMULUS',   color: 'var(--red)',    pct: 14 },
        { label: 'HGH SYNTHESIS',     color: 'var(--purple)', pct: 28 },
        { label: 'AXIAL ELONGATION',  color: 'var(--accent)', pct: 43 },
        { label: 'DISC REHYDRATION',  color: 'var(--amber)',  pct: 57 },
        { label: 'NOCTURNAL REPAIR',  color: 'var(--accent)', pct: 71 },
        { label: 'NEURAL PULSE',      color: 'var(--purple)', pct: 85 },
        { label: 'FASCIAL RELEASE',   color: 'var(--green)',  pct: 100 },
    ];

    function activateCard(idx) {
        const total = methodCards.length;

        // Reset all cards — Goliath exclusive activation
        methodCards.forEach(c => c.classList.remove('active'));
        // Reset all anatomy parts
        anatomyParts.forEach(p => { p.style.opacity = '0'; });

        if (idx < 0) {
            // Standby state
            if (statusEl)  { statusEl.textContent = 'STANDBY'; statusEl.style.color = 'var(--red)'; statusEl.classList.remove('complete'); }
            if (bioLockEl) { bioLockEl.textContent = '0%'; }
            if (barFillEl) { barFillEl.style.width = '0%'; }
            if (heightValEl) { heightValEl.textContent = '170cm'; heightValEl.style.color = 'var(--accent)'; }
            if (heightDeltaEl) { heightDeltaEl.textContent = ''; }
            const scanStatus = document.getElementById('scanStatusText');
            if (scanStatus) scanStatus.textContent = 'SCAN ACTIVE \u2014 SUBJECT NOMINAL';
            if (typeof window.activateRadarBlip === 'function') window.activateRadarBlip(-1);
            return;
        }

        // Activate the card
        methodCards[idx].classList.add('active');

        // Activate corresponding SVG part
        const partKey = methodCards[idx].getAttribute('data-part');
        const selector = partMap[partKey];
        if (selector) {
            const el = document.querySelector(selector);
            if (el) el.style.opacity = '1';
        }

        // Update scan status bar text
        const scanStatus = document.getElementById('scanStatusText');
        if (scanStatus) {
            const d = cardData[idx];
            scanStatus.textContent = 'PROTOCOL: ' + d.label;
        }

        // Update status readout
        const d = cardData[idx];
        if (statusEl) {
            statusEl.textContent  = d.label;
            statusEl.style.color  = d.color;
            statusEl.classList.toggle('complete', idx === total - 1);
        }

        // Animated pct counter (Goliath number-tick pattern)
        if (bioLockEl) {
            animateCounter(bioLockEl, parseInt(bioLockEl.textContent) || 0, d.pct, '%');
        }
        if (barFillEl) {
            barFillEl.style.width = d.pct + '%';
        }

        // Height delta badge
        const gainCm = (idx + 1) * 1.5;
        const baseCm = 170;
        if (heightValEl) {
            heightValEl.textContent = Math.round((baseCm + gainCm) * 10) / 10 + 'cm';
            heightValEl.style.color = idx === total - 1 ? 'var(--green)' : 'var(--accent)';
        }
        if (heightDeltaEl) {
            heightDeltaEl.textContent = idx > 0 ? `+${gainCm.toFixed(1)}cm` : '';
        }

        // Fire radar blip
        if (typeof window.activateRadarBlip === 'function') window.activateRadarBlip(idx);
    }

    function animateCounter(el, from, to, suffix = '') {
        clearInterval(el._interval);
        let cur = from;
        el._interval = setInterval(() => {
            if (cur < to) {
                cur += Math.max(1, Math.floor((to - cur) / 5));
                if (cur > to) cur = to;
            } else if (cur > to) {
                cur -= Math.max(1, Math.floor((cur - to) / 5));
                if (cur < to) cur = to;
            }
            el.textContent = cur + suffix;
            if (cur === to) clearInterval(el._interval);
        }, 28);
    }

    if (methodCards.length > 0) {
        // On small screens the sticky figure takes top space — adjust observer band
        const isSmallScreen = () => window.innerWidth < 560;
        const getMargin = () => isSmallScreen()
            ? '-40% 0px -20% 0px'   // cards must scroll higher to activate
            : '-28% 0px -42% 0px';  // normal middle-band

        const anatomyObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = parseInt(entry.target.dataset.idx);
                    activateCard(idx);
                }
            });
        }, {
            root: null,
            rootMargin: getMargin(),
            threshold: 0
        });

        methodCards.forEach(card => anatomyObs.observe(card));

        // Reset when the entire system section is out of view
        const systemSection = document.getElementById('system');
        if (systemSection) {
            const sectionObs = new IntersectionObserver(entries => {
                if (!entries[0].isIntersecting) activateCard(-1);
            }, { threshold: 0 });
            sectionObs.observe(systemSection);
        }
    }

    /* ── FAQ ACCORDION ── */
    document.querySelectorAll('.faq-q').forEach(q => {
        q.addEventListener('click', () => {
            const arr    = q.querySelector('.arr');
            const answer = q.nextElementSibling;
            // Close others
            document.querySelectorAll('.faq-a.open').forEach(a => {
                if (a !== answer) {
                    a.classList.remove('open');
                    const prevQ = a.previousElementSibling;
                    prevQ.querySelector('.arr').classList.remove('open');
                    prevQ.setAttribute('aria-expanded', 'false');
                }
            });
            arr.classList.toggle('open');
            answer.classList.toggle('open');
            q.setAttribute('aria-expanded', answer.classList.contains('open') ? 'true' : 'false');
            Haptics.light();
        });
    });

    /* ── LIVE VIEWER COUNT — Goliath organic fluctuation ── */
    const vCountEl = document.getElementById('vCount');
    if (vCountEl) {
        let viewers = parseInt(vCountEl.textContent) || 31;

        function updateViewers() {
            const nextIn = Math.floor(Math.random() * 4000) + 1500; // 1.5–5.5s
            setTimeout(() => {
                const rand = Math.random();
                let change = 0;
                if (rand < 0.4)       change = Math.random() < 0.2 ? 2 : 1;
                else if (rand < 0.8)  change = Math.random() < 0.2 ? -2 : -1;

                if (change !== 0) {
                    viewers += change;
                    if (viewers < 18) viewers = 18 + Math.floor(Math.random() * 4);
                    if (viewers > 52) viewers = 52 - Math.floor(Math.random() * 4);
                    vCountEl.textContent = viewers;

                    // Flash green like Goliath
                    vCountEl.style.color     = 'var(--green)';
                    vCountEl.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        vCountEl.style.color     = '';
                        vCountEl.style.transform = '';
                    }, 200);
                }
                updateViewers();
            }, nextIn);
        }
        updateViewers();
    }

    /* ── SUBJECT COUNTER ── */
    const sCountEl = document.getElementById('sCount');
    let subjects = 847;
    if (sCountEl) {
        setInterval(() => {
            if (Math.random() > 0.55) {
                subjects++;
                sCountEl.textContent = subjects;
            }
        }, 13000);
    }

    /* ── LIVE NOTIFICATION TOAST ── */
    const toast  = document.getElementById('liveToast');
    // Fix #23: 25 international cities (Asian, European, South American markets)
    const cities = [
        'Tokyo', 'Seoul', 'Singapore', 'Hong Kong', 'Bangkok',
        'Mumbai', 'Shanghai', 'Manila', 'Jakarta', 'Taipei',
        'London', 'Berlin', 'Paris', 'Madrid', 'Rome',
        'Amsterdam', 'Stockholm', 'Vienna', 'Warsaw', 'Lisbon',
        'São Paulo', 'Buenos Aires', 'Mexico City', 'Bogotá', 'Santiago'
    ];
    // Fix #23: Purchase messages (mixed in at ~30% rate)
    const purchaseMessages = [
        'just purchased the protocol',
        'just got instant access',
        'just started their journey'
    ];

    if (toast) {
        function showToast() {
            const city = cities[Math.floor(Math.random() * cities.length)];
            // 30% chance of purchase message, 70% city-view message
            if (Math.random() < 0.3) {
                const msg = purchaseMessages[Math.floor(Math.random() * purchaseMessages.length)];
                toast.innerHTML = `<span class="dot"></span> Someone from <span class="city">${city}</span> ${msg}`;
            } else {
                toast.innerHTML = `<span class="dot"></span> Someone from <span class="city">${city}</span> just accessed the APEX protocol`;
            }
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 4200);
        }

        // First toast at 14s, then every 28–52s
        setTimeout(() => {
            showToast();
            const loop = () => {
                if (Math.random() > 0.25) showToast();
                setTimeout(loop, Math.random() * 24000 + 28000);
            };
            setTimeout(loop, Math.random() * 24000 + 28000);
        }, 14000);
    }

    /* ── SPOTS LEFT COUNTER (Goliath pattern) ── */
    const spotsCountEl = document.getElementById('spots-left-count');
    const spotsBarFill = document.getElementById('spots-bar-fill');
    if (spotsCountEl && spotsBarFill) {
        // Fix #4: Persist spots to sessionStorage — prevents jumping count on refresh
        let spots = parseInt(sessionStorage.getItem('apexSpots')) || 8;
        spotsCountEl.textContent = spots;
        // CRO v7 fix: bar fills MORE as spots deplete (inverted — depletion visual)
        // formula: 12 spots = 0% bar, 2 spots = ~83% bar, 1 = ~92%
        const spotsToFillPct = (s) => Math.max(8, Math.min(95, (12 - s) * 9 + 8));
        const updateSpots = () => {
            const nextIn = Math.floor(Math.random() * 25000) + 20000; // 20–45s
            setTimeout(() => {
                // CRO v7 fix: monotonic decrease only — skeptics catch bouncing counters
                // 62% chance decrement, 38% chance no change, NEVER increment
                const rand = Math.random();
                if (rand < 0.62 && spots > 2) {
                    spots--;
                }
                spotsCountEl.textContent = spots;
                spotsBarFill.style.width = spotsToFillPct(spots) + '%';
                sessionStorage.setItem('apexSpots', spots);
                updateSpots();
            }, nextIn);
        };
        spotsBarFill.style.width = spotsToFillPct(spots) + '%';
        updateSpots();
    }

    /* ── BLUEPRINT SPINE SCROLL FILL ── */
    const bpSpineFill = document.getElementById('bp-spine-fill');
    const bpSection   = document.getElementById('timeline');
    if (bpSpineFill && bpSection) {
        const updateSpine = () => {
            const rect   = bpSection.getBoundingClientRect();
            const winH   = window.innerHeight;
            // Fill starts when section enters view, completes when section bottom exits
            const scrolled  = winH * 0.75 - rect.top;
            const sectionH  = rect.height;
            const pct = Math.max(0, Math.min(100, (scrolled / sectionH) * 130));
            bpSpineFill.style.height = pct + '%';
        };
        window.addEventListener('scroll', updateSpine, { passive: true });
        updateSpine();
    }

    /* ── SCROLL PROGRESS BAR ── */
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        // Fix #12: rAF-throttle to cap updates at 1 per frame (Fix #2: { passive: true } already present)
        let rafPending = false;
        window.addEventListener('scroll', () => {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                const total = document.documentElement.scrollHeight - window.innerHeight;
                scrollProgress.style.width = total > 0 ? (window.scrollY / total) * 100 + '%' : '0%';
                rafPending = false;
            });
        }, { passive: true });
    }

    /* ── STICKY BAR VISIBILITY (Fix #15) ── */
    // Only show sticky CTA after user scrolls past the hero (first 100vh)
    const stickyBar = document.querySelector('.sticky-bar');
    if (stickyBar) {
        window.addEventListener('scroll', () => {
            stickyBar.classList.toggle('visible', window.scrollY > window.innerHeight);
        }, { passive: true });
    }

    /* ── SLIDESHOW ── */
    const slides = document.querySelectorAll('.ss-slide');
    const dots   = document.querySelectorAll('.ss-dot');
    if (slides.length > 1) {
        let current = 0;
        function goSlide(idx) {
            slides[current].classList.remove('ss-active');
            dots[current].classList.remove('active');
            current = (idx + slides.length) % slides.length;
            slides[current].classList.add('ss-active');
            dots[current].classList.add('active');
        }
        dots.forEach((dot, i) => dot.addEventListener('click', () => goSlide(i)));
        setInterval(() => goSlide(current + 1), 3500);
    }

    /* ═══════════════════════════════════════════════════
       HEIGHT ASSESSMENT MODAL — 6 steps, biometric terminal
       Integrates new Height Assessment UI with existing
       open/close, Escape, focus trap, Web3Forms, Lemon Squeezy
       and Haptics wiring.
       ═══════════════════════════════════════════════════ */
    const modal       = document.getElementById('prediction-modal');
    const modalClose  = document.getElementById('modal-close');
    const openBtn     = document.getElementById('open-calculator-btn');
    const modalCtaBtn = document.getElementById('modal-cta-btn'); // now lives on result CTA inside new calc

    // Generate random subject ID for the terminal bar
    const subjIdEl = document.getElementById('modal-subj-id');
    if (subjIdEl) {
        subjIdEl.textContent = Math.floor(1000 + Math.random() * 8999);
    }

    // ─────────────────────────────────────────────
    //  Calculator state & aborter
    // ─────────────────────────────────────────────
    const ACX = {
        step: 1,
        name: '', email: '',
        age: 0, height: 0, weight: 0, sex: '',
        posture: 5,
        dad: 0, mom: 0,
        plate: '', activity: '',
        sleep: 7.0, commit: 80,
        emailSubmitted: false,   // so we only fire Web3Forms once
        analysisAborted: false,  // used to abort the analysis sequence if modal closes
    };

    function $(id) { return document.getElementById(id); }

    // ─────────────────────────────────────────────
    //  Modal open / close
    // ─────────────────────────────────────────────
    // iOS Safari workaround: plain `body{overflow:hidden}` leaks background
    // scroll on iOS and confuses nested scroll containers on some builds.
    // Position-fixed lock is the canonical fix.
    let scrollLockY = 0;
    function lockBody() {
        scrollLockY = window.scrollY || window.pageYOffset || 0;
        const body = document.body;
        body.style.position = 'fixed';
        body.style.top = `-${scrollLockY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.overflow = 'hidden';
    }
    function unlockBody() {
        const body = document.body;
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.width = '';
        body.style.overflow = '';
        // Jump back to exact scroll position — use 'auto' so it's instant, not animated
        window.scrollTo({ top: scrollLockY, left: 0, behavior: 'auto' });
    }

    function openModal() {
        if (!modal) return;
        resetModal();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        lockBody();
        Haptics.light();
        // Focus first focusable element inside modal (after paint)
        requestAnimationFrame(() => {
            const first = modal.querySelector('button, input, select, [tabindex]:not([tabindex="-1"])');
            if (first) first.focus();
        });
    }
    function closeModal() {
        if (!modal) return;
        // Abort any in-flight analysis so timers don't keep mutating DOM
        ACX.analysisAborted = true;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        unlockBody();
        const ob = document.getElementById('open-calculator-btn');
        if (ob) ob.focus();
    }

    // Focus trap — Tab stays inside modal; Escape closes
    if (modal) {
        modal.addEventListener('keydown', e => {
            if (e.key === 'Escape') { closeModal(); return; }
            if (e.key !== 'Tab') return;
            const focusable = Array.from(modal.querySelectorAll(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            )).filter(el => el.offsetParent !== null);
            if (!focusable.length) return;
            const first = focusable[0];
            const last  = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
            }
        });
    }

    if (openBtn)     openBtn.addEventListener('click', openModal);
    if (modalClose)  modalClose.addEventListener('click', closeModal);
    if (modal)       modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    if (modalCtaBtn) modalCtaBtn.addEventListener('click', closeModal);

    // ─────────────────────────────────────────────
    //  Web3Forms submit (same pattern as contact form)
    // ─────────────────────────────────────────────
    function isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const t = email.trim();
        if (t.length < 5 || t.length > 254) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
    }

    async function submitCalculatorEmail(email, name) {
        if (ACX.emailSubmitted) return;
        ACX.emailSubmitted = true;
        try {
            const payload = {
                access_key: 'ab28a828-af15-42fd-9edb-4637527d90d1',
                subject: 'APEX Calculator Lead',
                from_name: 'APEX Calculator',
                name: (name || 'Calculator User').trim().slice(0, 80),
                email: email,
                message: 'New lead from height calculator modal. User started biometric assessment.'
            };
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {}); // fire-and-forget
        } catch (e) { /* ignore */ }
        // Local backup in case network fails
        try {
            const leads = JSON.parse(localStorage.getItem('apex_calc_leads') || '[]');
            leads.push({ email, name: name || '', ts: new Date().toISOString() });
            localStorage.setItem('apex_calc_leads', JSON.stringify(leads.slice(-50)));
        } catch (e) { /* ignore */ }
    }

    // ─────────────────────────────────────────────
    //  Modal reset
    // ─────────────────────────────────────────────
    function resetModal() {
        if (!modal) return;
        ACX.analysisAborted = false;
        ACX.emailSubmitted = false;
        Object.assign(ACX, {
            step: 1, name: '', email: '',
            age: 0, height: 0, weight: 0, sex: '',
            posture: 5, dad: 0, mom: 0, plate: '', activity: '',
            sleep: 7.0, commit: 80,
        });

        // Reset inputs
        ['acx-f-name','acx-f-email','acx-f-age','acx-f-height','acx-f-weight','acx-f-dad','acx-f-mom']
            .forEach(id => { const e = $(id); if (e) e.value = ''; });
        const sex = $('acx-f-sex');      if (sex) sex.value = '';
        const post = $('acx-f-posture'); if (post) post.value = 5;
        const pv = $('acx-posture-val'); if (pv) pv.textContent = '5';
        const slp = $('acx-f-sleep');    if (slp) slp.value = 70;
        const sv = $('acx-sleep-val');   if (sv) sv.textContent = '7.0 hrs';

        // Reset tiles — deselect all, then re-select default commit=80
        modal.querySelectorAll('.acx-tile.acx-on').forEach(t => t.classList.remove('acx-on'));
        const defCommit = modal.querySelector('#acx-t-commit .acx-tile[data-val="80"]');
        if (defCommit) defCommit.classList.add('acx-on');

        // Reset live projection bars/values
        ['acx-lp-val-2','acx-lp-val-3','acx-lp-val-4'].forEach(id => { const e = $(id); if (e) e.textContent = '—'; });
        ['acx-lp-bar-2','acx-lp-bar-3','acx-lp-bar-4'].forEach(id => { const e = $(id); if (e) e.style.right = '100%'; });

        // Reset result bars
        const bc = $('acx-r-bar-cur');  if (bc) bc.style.height = '0';
        const bp = $('acx-r-bar-proj'); if (bp) bp.style.height = '0';

        // Go to step 1
        go(1, true);
    }

    // ─────────────────────────────────────────────
    //  Step navigation & validation
    // ─────────────────────────────────────────────
    function flashErr(el) {
        if (!el) return;
        el.classList.add('acx-err');
        el.focus();
        Haptics.medium();
        setTimeout(() => el.classList.remove('acx-err'), 1600);
    }

    function syncStateFromInputs() {
        const g = (id) => { const e = $(id); return e ? e.value : ''; };
        ACX.name   = (g('acx-f-name') || '').trim() || ACX.name;
        ACX.email  = (g('acx-f-email') || '').trim() || ACX.email;
        ACX.age    = +g('acx-f-age')    || ACX.age;
        ACX.height = +g('acx-f-height') || ACX.height;
        ACX.weight = +g('acx-f-weight') || ACX.weight;
        ACX.sex    = g('acx-f-sex')     || ACX.sex;
        ACX.dad    = +g('acx-f-dad')    || ACX.dad;
        ACX.mom    = +g('acx-f-mom')    || ACX.mom;
        ACX.posture = +g('acx-f-posture') || ACX.posture;
        const slpRaw = +g('acx-f-sleep');
        ACX.sleep = slpRaw ? slpRaw / 10 : ACX.sleep;
    }

    function validateStep1() {
        const n = $('acx-f-name');
        const e = $('acx-f-email');
        if (!n || !n.value.trim()) { flashErr(n); return false; }
        const v = e && e.value.trim();
        if (!v || !isValidEmail(v)) { flashErr(e); return false; }
        return true;
    }
    function validateStep2() {
        const age = $('acx-f-age');
        const h   = $('acx-f-height');
        const w   = $('acx-f-weight');
        const s   = $('acx-f-sex');
        if (!age.value || +age.value < 14 || +age.value > 60) { flashErr(age); return false; }
        if (!h.value   || +h.value < 140  || +h.value > 220)  { flashErr(h); return false; }
        if (!w.value   || +w.value < 35   || +w.value > 200)  { flashErr(w); return false; }
        if (!s.value)                                          { flashErr(s); return false; }
        return true;
    }
    function validateStep3() {
        const d = $('acx-f-dad');
        const m = $('acx-f-mom');
        if (!d.value || +d.value < 140 || +d.value > 220) { flashErr(d); return false; }
        if (!m.value || +m.value < 130 || +m.value > 210) { flashErr(m); return false; }
        if (!ACX.plate) {
            const t = $('acx-t-plate');
            if (t) { t.classList.add('acx-err'); setTimeout(() => t.classList.remove('acx-err'), 1600); }
            Haptics.medium();
            return false;
        }
        return true;
    }
    function validateStep4() {
        if (!ACX.activity) {
            const t = $('acx-t-activity');
            if (t) { t.classList.add('acx-err'); setTimeout(() => t.classList.remove('acx-err'), 1600); }
            Haptics.medium();
            return false;
        }
        return true;
    }

    function go(n, silent) {
        if (!modal) return;
        // Forward validation gate
        if (!silent && n > ACX.step) {
            if (ACX.step === 1 && !validateStep1()) return;
            if (ACX.step === 2 && !validateStep2()) return;
            if (ACX.step === 3 && !validateStep3()) return;
            if (ACX.step === 4 && !validateStep4()) return;
        }
        syncStateFromInputs();

        // Fire Web3Forms on first transition past step 1 (early lead capture)
        if (!silent && ACX.step === 1 && n >= 2 && isValidEmail(ACX.email)) {
            submitCalculatorEmail(ACX.email, ACX.name);
        }

        // Show target step
        modal.querySelectorAll('.acx-step').forEach(s => s.classList.remove('acx-live'));
        const tgt = modal.querySelector(`.acx-step[data-step="${n}"]`);
        if (tgt) tgt.classList.add('acx-live');

        // Stepper state
        modal.querySelectorAll('#acx-stepper .acx-st-node').forEach(node => {
            const st = +node.dataset.step;
            node.classList.remove('acx-on','acx-done');
            if (st < n) node.classList.add('acx-done');
            else if (st === n) node.classList.add('acx-on');
        });
        ACX.step = n;
        if (!silent) Haptics.light();

        // Scroll modal body (NOT page) to top so user sees the new step header
        const body = modal.querySelector('.modal-body');
        if (body) body.scrollTop = 0;

        if (n >= 2 && n <= 4) liveProj();
    }

    function pick(el, group) {
        if (!el) return;
        const parent = el.parentElement;
        parent.querySelectorAll('.acx-tile').forEach(t => t.classList.remove('acx-on'));
        el.classList.add('acx-on');
        ACX[group] = el.dataset.val;
        Haptics.light();
        liveProj();
    }

    // Wire up step nav + tile picks (event delegation inside modal)
    if (modal) {
        modal.addEventListener('click', (e) => {
            const goBtn = e.target.closest('[data-acx-go]');
            if (goBtn) {
                e.preventDefault();
                go(+goBtn.dataset.acxGo);
                return;
            }
            const pickBtn = e.target.closest('[data-acx-pick]');
            if (pickBtn) {
                e.preventDefault();
                pick(pickBtn, pickBtn.dataset.acxPick);
                return;
            }
            if (e.target.closest('#acx-run-analysis')) {
                e.preventDefault();
                runAnalysis();
                return;
            }
            if (e.target.closest('#acx-retake')) {
                e.preventDefault();
                resetModal();
                return;
            }
        });

        // Live projection as user types / changes sliders / selects
        modal.addEventListener('input', (e) => {
            const t = e.target;
            if (t.id === 'acx-f-posture') {
                const pv = $('acx-posture-val'); if (pv) pv.textContent = t.value;
            }
            if (t.id === 'acx-f-sleep') {
                const sv = $('acx-sleep-val'); if (sv) sv.textContent = (t.value / 10).toFixed(1) + ' hrs';
            }
            // Any baseline/genetic/lifestyle input changes → recompute live projection
            if (['acx-f-age','acx-f-height','acx-f-weight','acx-f-sex','acx-f-dad','acx-f-mom','acx-f-posture','acx-f-sleep'].includes(t.id)) {
                liveProj();
            }
        });
        modal.addEventListener('change', (e) => {
            if (e.target.id === 'acx-f-sex') liveProj();
        });
    }

    // ─────────────────────────────────────────────
    //  Projection model
    // ─────────────────────────────────────────────
    function computeProjection() {
        const age  = ACX.age || 22;
        const h    = ACX.height || 170;
        const plate = ACX.plate || 'closed';
        const activity = ACX.activity || 'mod';
        const commit = +ACX.commit || 80;
        const sleep  = +ACX.sleep || 7;
        const posture = +ACX.posture || 5;
        const dad = ACX.dad || 176;
        const mom = ACX.mom || 164;

        // Posture reserve
        const postureInches = Math.max(0, (10 - posture)) * 0.18;

        // Bone response
        const plateMult    = plate === 'open' ? 1.4 : plate === 'fusing' ? 0.85 : 0.55;
        const ageMult      = age < 18 ? 1.3 : age < 23 ? 1.1 : age < 30 ? 0.9 : age < 40 ? 0.7 : 0.55;
        const activityMult = activity === 'ath' ? 1.2 : activity === 'mod' ? 1.0 : 0.7;
        const boneInches   = 0.9 * plateMult * ageMult * activityMult;

        // HGH: sleep + commitment + activity
        const sleepScore  = Math.min(1, Math.max(0, (sleep - 5) / 3.5));
        const commitScore = commit / 100;
        const hghInches   = 0.75 * sleepScore * commitScore * activityMult;

        // Genetic gap
        const mid    = (dad + mom + (ACX.sex === 'f' ? -13 : 13)) / 2;
        const gapCm  = Math.max(0, mid - h);
        const geneticInches = Math.min(1.0, gapCm / 2.54 * 0.18);

        const subtotal = postureInches + boneInches + hghInches + geneticInches;
        const commitFactor = 0.55 + commit * 0.005;
        const total = subtotal * commitFactor;

        const totalCm = total * 2.54;
        const weekly = [];
        for (let w = 0; w <= 12; w++) {
            const t = w / 12;
            const ease = t < 0.33 ? 0.4 * (t / 0.33)
                       : t < 0.66 ? 0.4 + 0.45 * ((t - 0.33) / 0.33)
                                  : 0.85 + 0.15 * ((t - 0.66) / 0.34);
            weekly.push(+(totalCm * ease).toFixed(2));
        }

        return {
            totalInches: +total.toFixed(2),
            totalCm: +totalCm.toFixed(1),
            posture: +postureInches.toFixed(2),
            bone: +boneInches.toFixed(2),
            hgh: +hghInches.toFixed(2),
            genetic: +geneticInches.toFixed(2),
            weeklyCm: weekly,
            commitFactor: commitFactor,
            gapCm: gapCm
        };
    }

    function liveProj() {
        syncStateFromInputs();
        const p   = computeProjection();
        const pct = Math.min(100, p.totalInches / 5 * 100);
        const val = p.totalInches ? '+' + p.totalInches.toFixed(1) + '"' : '—';
        ['acx-lp-val-2','acx-lp-val-3','acx-lp-val-4'].forEach(id => {
            const e = $(id); if (e) e.textContent = val;
        });
        ['acx-lp-bar-2','acx-lp-bar-3','acx-lp-bar-4'].forEach(id => {
            const e = $(id); if (e) e.style.right = (100 - pct) + '%';
        });
    }

    // ─────────────────────────────────────────────
    //  Analysis (step 5) — cancellable via ACX.analysisAborted
    // ─────────────────────────────────────────────
    function runAnalysis() {
        if (!validateStep4()) return;
        syncStateFromInputs();
        go(5);
        ACX.analysisAborted = false;

        // Re-submit email now with completed profile (in case they edited at step 1
        // — `submitCalculatorEmail` has an internal guard so it only fires once per session)
        if (isValidEmail(ACX.email)) {
            submitCalculatorEmail(ACX.email, ACX.name);
        }

        const steps = [
            {pct:8,   lbl:'Parsing biometric inputs',       msg:'inputs_received[10/10]',      time:400},
            {pct:18,  lbl:'Hashing session file',           msg:'file_id generated',           time:350},
            {pct:30,  lbl:'Calculating posture reserve',    msg:'postural_deficit detected',   time:500},
            {pct:44,  lbl:"Modeling Wolff's Law response",  msg:'bone_matrix stress curve OK', time:550},
            {pct:58,  lbl:'Endocrine ceiling projection',   msg:'HGH_max estimated',           time:500},
            {pct:72,  lbl:'Genetic midparent gap analysis', msg:'gap_delta computed',          time:500},
            {pct:86,  lbl:'Cross-referencing N=847',        msg:'nearest_match found',         time:600},
            {pct:96,  lbl:'Generating trajectory',          msg:'12-week curve plotted',       time:400},
            {pct:100, lbl:'Projection complete',            msg:'READY',                       time:300, done:true}
        ];
        const termW = $('acx-term-window');
        const fill  = $('acx-prog-fill');
        const pctL  = $('acx-prog-pct');
        const lblL  = $('acx-prog-label');
        if (termW) termW.innerHTML = '';
        let i = 0;
        function nextLine() {
            if (ACX.analysisAborted) return;
            if (i >= steps.length) { setTimeout(() => { if (!ACX.analysisAborted) showResult(); }, 400); return; }
            const s = steps[i];
            if (fill) fill.style.right = (100 - s.pct) + '%';
            if (pctL) pctL.textContent = s.pct + '%';
            if (lblL) lblL.textContent = s.lbl;
            if (termW) {
                const line = document.createElement('div');
                line.className = 'acx-tline' + (s.done ? ' acx-ok' : '');
                const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
                line.innerHTML =
                    `<span class="acx-t">[${ts}]</span>` +
                    `<span class="acx-a">${s.done ? '✓' : '▸'}</span>` +
                    `<span class="acx-m">${s.lbl} — <b style="color:${s.done ? 'var(--green)' : 'var(--accent)'}">${s.msg}</b></span>`;
                termW.appendChild(line);
                termW.scrollTop = termW.scrollHeight;
                while (termW.children.length > 9) termW.removeChild(termW.firstChild);
            }
            Haptics.light();
            i++;
            setTimeout(nextLine, s.time);
        }
        nextLine();
    }

    // ─────────────────────────────────────────────
    //  Result (step 6)
    // ─────────────────────────────────────────────
    function showResult() {
        go(6, true); // silent — we already validated
        const p = computeProjection();
        const currentCm = ACX.height || 170;
        const projCm    = currentCm + p.totalCm;
        const currentFt = cmToFtIn(currentCm);
        const projFt    = cmToFtIn(projCm);

        const setText = (id, v) => { const e = $(id); if (e) e.textContent = v; };
        setText('acx-r-name', (ACX.name || 'Subject').toUpperCase());
        setText('acx-file-id', genFileId());
        setText('acx-r-conf', (72 + Math.round(Math.random() * 18)) + '%');
        setText('acx-r-delta', '+' + p.totalInches.toFixed(1) + '"  (+' + p.totalCm.toFixed(1) + 'cm)');
        setText('acx-r-cur-h', currentFt + ' · ' + currentCm + 'cm');
        setText('acx-r-proj-h', projFt + ' · ' + projCm.toFixed(0) + 'cm');

        // Animate bars — anchor floor to (baseline - 20cm) so small deltas still read
        const floorCm   = Math.max(20, currentCm - 20);
        const rangeCm   = Math.max(1, projCm - floorCm);
        const curPctVis = ((currentCm - floorCm) / rangeCm) * 100;
        setTimeout(() => {
            const bc = $('acx-r-bar-cur');  if (bc) bc.style.height = Math.max(10, curPctVis * 0.78) + '%';
            const bp = $('acx-r-bar-proj'); if (bp) bp.style.height = (100 * 0.78) + '%';
        }, 120);

        // Readout
        setText('acx-m-posture', '+' + p.posture.toFixed(2) + '"');
        setText('acx-m-bone',    '+' + p.bone.toFixed(2) + '"');
        setText('acx-m-hgh',     '+' + p.hgh.toFixed(2) + '"');
        setText('acx-m-gap',     '+' + p.genetic.toFixed(2) + '"');

        // Breakdown
        const bdList = $('acx-bd-list');
        if (bdList) {
            const total = Math.max(0.01, p.posture + p.bone + p.hgh + p.genetic);
            const rows = [
                {n:'Postural realignment (CSE + NHM)', v:p.posture, c:'acx-ac'},
                {n:'Bone remodeling (AIS + Wolff)',    v:p.bone,    c:'acx-g'},
                {n:'Endocrine / HGH amplification',    v:p.hgh,     c:'acx-a'},
                {n:'Genetic ceiling recovery',         v:p.genetic, c:'acx-ac'}
            ];
            bdList.innerHTML = rows.map(r => {
                const pct = (r.v / total) * 100;
                return `<div class="acx-bd-row">
                    <span class="acx-bd-name">${r.n}</span>
                    <div class="acx-bd-meter"><div class="acx-bd-meter-fill ${r.c}" style="right:${100 - pct}%"></div></div>
                    <span class="acx-bd-pts acx-pos">+${r.v.toFixed(2)}"</span>
                </div>`;
            }).join('') + `<div class="acx-bd-row" style="border-top:1px solid var(--border2);margin-top:6px;padding-top:10px">
                <span class="acx-bd-name" style="color:var(--text);font-weight:700">Adherence modifier (${Math.round(p.commitFactor * 100)}%)</span>
                <div class="acx-bd-meter"><div class="acx-bd-meter-fill ${p.commitFactor >= 1 ? 'acx-g' : p.commitFactor >= 0.8 ? 'acx-a' : 'acx-r'}" style="right:${100 - Math.min(100, p.commitFactor * 80)}%"></div></div>
                <span class="acx-bd-pts ${p.commitFactor >= 0.9 ? 'acx-pos' : ''}">×${p.commitFactor.toFixed(2)}</span>
            </div>`;
        }

        drawChart(p.weeklyCm, currentCm);
        Haptics.success();

        // Backup: also submit email here in case step 1 submission was skipped
        if (isValidEmail(ACX.email)) submitCalculatorEmail(ACX.email, ACX.name);
    }

    function drawChart(weekly, baseline) {
        const svg = $('acx-chart-svg');
        if (!svg) return;
        const W = 400, H = 200, PAD_L = 6, PAD_R = 6, PAD_T = 16, PAD_B = 22;
        const maxCm = Math.max(...weekly) || 1;
        const pts = weekly.map((cm, i) => {
            const x = PAD_L + (W - PAD_L - PAD_R) * (i / 12);
            const y = H - PAD_B - (H - PAD_T - PAD_B) * (cm / Math.max(1, maxCm * 1.1));
            return [x, y];
        });
        const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
        const areaPath = path + ` L ${pts[pts.length - 1][0]},${H - PAD_B} L ${pts[0][0]},${H - PAD_B} Z`;
        const baseY = H - PAD_B;
        const x4 = PAD_L + (W - PAD_L - PAD_R) * (4 / 12);
        const x8 = PAD_L + (W - PAD_L - PAD_R) * (8 / 12);

        let grid = '';
        for (let g = 1; g <= 4; g++) {
            const y = H - PAD_B - ((H - PAD_T - PAD_B) * (g / 5));
            grid += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 3"/>`;
        }

        let wkLabels = '';
        [0, 4, 8, 12].forEach(w => {
            const x = PAD_L + (W - PAD_L - PAD_R) * (w / 12);
            wkLabels += `<text x="${x}" y="${H - 6}" text-anchor="middle" fill="#6a6a82" font-size="8" font-family="IBM Plex Mono" letter-spacing="1">W${w.toString().padStart(2, '0')}</text>`;
        });

        const phaseColors = ['#ff3040','#00d4ff','#00ff7f'];
        let dots = '';
        pts.forEach((p, i) => {
            const phase = i <= 4 ? 0 : i <= 8 ? 1 : 2;
            dots += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 12 ? 5 : 2.5}" fill="${phaseColors[phase]}" stroke="#000" stroke-width="${i === 12 ? 2 : 1}"/>`;
        });

        const last = pts[pts.length - 1];
        const finalLbl = `<g transform="translate(${last[0] - 54},${last[1] - 24})">
            <rect x="0" y="0" width="52" height="18" fill="#00ff7f" stroke="#000" stroke-width="1.5"/>
            <text x="26" y="12" text-anchor="middle" fill="#000" font-family="Outfit" font-weight="900" font-size="10">+${weekly[12].toFixed(1)} CM</text>
        </g>`;

        svg.innerHTML = `
            ${grid}
            <line x1="${x4}" y1="${PAD_T}" x2="${x4}" y2="${H - PAD_B}" stroke="#30304a" stroke-dasharray="2 3"/>
            <line x1="${x8}" y1="${PAD_T}" x2="${x8}" y2="${H - PAD_B}" stroke="#30304a" stroke-dasharray="2 3"/>
            <line x1="${PAD_L}" y1="${baseY}" x2="${W - PAD_R}" y2="${baseY}" stroke="#30304a" stroke-width="1"/>
            <path d="${areaPath}" fill="url(#acxChartGrad)" opacity="0.5"/>
            <path d="${path}" fill="none" stroke="#00ff7f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#acxChartGlow)"/>
            ${dots}
            ${wkLabels}
            <text x="${PAD_L + 4}" y="${baseY - 4}" fill="#6a6a82" font-size="7" font-family="IBM Plex Mono" letter-spacing="1">BASELINE ${baseline}CM</text>
            ${finalLbl}
            <defs>
                <linearGradient id="acxChartGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#00ff7f" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#00ff7f" stop-opacity="0"/>
                </linearGradient>
                <filter id="acxChartGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
        `;
        const pathEl = svg.querySelector('path[stroke="#00ff7f"]');
        if (pathEl && pathEl.getTotalLength) {
            const len = pathEl.getTotalLength() || 600;
            pathEl.style.strokeDasharray = len;
            pathEl.style.strokeDashoffset = len;
            pathEl.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,.9,.28,1)';
            requestAnimationFrame(() => { pathEl.style.strokeDashoffset = 0; });
        }
    }

    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────
    function cmToFtIn(cm) {
        const totalIn = cm / 2.54;
        const ft = Math.floor(totalIn / 12);
        const inch = Math.round(totalIn - ft * 12);
        return `${ft}'${inch}"`;
    }
    function genFileId() {
        const chars = 'abcdefghjkmnpqrstvwxyz23456789';
        let r = '';
        for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
        return r;
    }


    /* ── EXIT INTENT POPUP ── */
    const exitPopup   = document.getElementById('exit-popup');
    const exitDismiss = document.getElementById('exit-dismiss');
    // Fix #3A: Persist shown-state across refreshes
    let exitShown = !!sessionStorage.getItem('apexExitShown');

    function triggerExitPopup() {
        if (exitShown || !exitPopup) return;
        exitShown = true;
        sessionStorage.setItem('apexExitShown', '1');
        exitPopup.classList.add('open');
        exitPopup.setAttribute('aria-hidden', 'false');
        Haptics.medium();
    }

    if (exitPopup) {
        // Desktop: mouseleave toward top of viewport
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            document.addEventListener('mouseleave', e => {
                if (e.clientY < 5) triggerExitPopup();
            });
        } else {
            // Fix #3B: Mobile — scroll-back trigger
            // Fires when user scrolls UP past the 15% mark AFTER having scrolled past 75%.
            // (Previous 60%/25% was too easy — auto-triggered during normal back-navigation.)
            let reached75 = false;
            let lastY = window.scrollY;
            window.addEventListener('scroll', () => {
                if (exitShown) return;
                const y = window.scrollY;
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                if (docH <= 0) { lastY = y; return; }
                const pct = y / docH;
                if (pct >= 0.75) reached75 = true;
                // Scrolling up AND below 15% AND previously crossed 75% → show popup
                if (reached75 && y < lastY && pct < 0.15) {
                    triggerExitPopup();
                }
                lastY = y;
            }, { passive: true });
        }

        if (exitDismiss) {
            exitDismiss.addEventListener('click', () => {
                exitPopup.classList.remove('open');
                exitPopup.setAttribute('aria-hidden', 'true');
            });
        }

        // Close on overlay click
        exitPopup.addEventListener('click', e => {
            if (e.target === exitPopup) {
                exitPopup.classList.remove('open');
                exitPopup.setAttribute('aria-hidden', 'true');
            }
        });

        // Close exit popup on Escape
        exitPopup.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                exitPopup.classList.remove('open');
                exitPopup.setAttribute('aria-hidden', 'true');
            }
        });

        // Don't show if already purchased (basic check)
        document.querySelectorAll('.b-buy:not(.exit-cta)').forEach(btn => {
            btn.addEventListener('click', () => {
                exitShown = true;
                sessionStorage.setItem('apexExitShown', '1');
            });
        });
    }

    // ── Result Carousel ──
    const rcSlides = document.querySelectorAll('.rc-slide');
    const rcDots   = document.querySelectorAll('.rc-dot');
    const rcCur    = document.getElementById('rc-cur');
    if (rcSlides.length) {
        let rcIdx = 0;
        let rcTimer = null;

        function rcShow(n) {
            rcSlides[rcIdx].classList.remove('rc-active');
            rcDots[rcIdx].classList.remove('rc-dot-on');
            rcDots[rcIdx].setAttribute('aria-pressed', 'false');
            rcIdx = (n + rcSlides.length) % rcSlides.length;
            rcSlides[rcIdx].classList.add('rc-active');
            rcDots[rcIdx].classList.add('rc-dot-on');
            rcDots[rcIdx].setAttribute('aria-pressed', 'true');
            if (rcCur) rcCur.textContent = rcIdx + 1;
        }

        function rcStart() {
            rcTimer = setInterval(() => rcShow(rcIdx + 1), 4000);
        }

        function rcStop() {
            clearInterval(rcTimer);
        }

        rcDots.forEach(dot => {
            dot.addEventListener('click', () => {
                rcStop();
                rcShow(parseInt(dot.dataset.rc, 10));
                rcStart();
            });
        });

        // Pause on hover
        const carousel = document.querySelector('.result-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', rcStop);
            carousel.addEventListener('mouseleave', rcStart);
        }

        rcStart();
    }

});


/* ═══════════════════════════════════════════════════════════
   APEX RADAR / SONAR DISPLAY ENGINE
   Canvas-only, no external libs.
   Exposes: window.activateRadarBlip(idx)
   ═══════════════════════════════════════════════════════════ */
(function initRadar() {
    var canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var BLIPS = [
        { idx: 0, angle: 250, r: 0.65, color: '#ff3040', label: 'IMPACT',    fullRing: false },
        { idx: 1, angle:  55, r: 0.60, color: '#7c4dff', label: 'HGH',       fullRing: false },
        { idx: 2, angle:  15, r: 0.30, color: '#00d4ff', label: 'DECOMP',    fullRing: false },
        { idx: 3, angle: 195, r: 0.65, color: '#ff9100', label: 'DISC',      fullRing: false },
        { idx: 4, angle: 315, r: 0.70, color: '#00d4ff', label: 'NOCTURNAL', fullRing: false },
        { idx: 5, angle: 130, r: 0.55, color: '#7c4dff', label: 'NEURAL',    fullRing: false },
        { idx: 6, angle:   0, r: 0,    color: '#00e676', label: 'RELEASE',   fullRing: true  },
    ];

    var activeSet     = new Set();
    var currentIdx    = -1;
    var scanAngle     = 0;
    var fullRingAlpha = 0;
    var pulseStart    = {};

    function hexRgba(hex, a) {
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    function polarXY(angleDeg, rFrac, cx, cy, maxR) {
        var rad = (angleDeg - 90) * Math.PI / 180;
        return [cx + Math.cos(rad) * rFrac * maxR, cy + Math.sin(rad) * rFrac * maxR];
    }

    function sizeCanvas() {
        var field = canvas.parentElement;
        if (!field) return;
        var W = field.clientWidth  || field.offsetWidth  || 300;
        var H = field.clientHeight || field.offsetHeight || 280;
        canvas.width  = Math.max(W, 10);
        canvas.height = Math.max(H, 10);
    }

    function draw(ts) {
        var W = canvas.width, H = canvas.height;
        var cx = W / 2, cy = H / 2;
        var maxR = Math.min(W, H) * 0.40;

        ctx.clearRect(0, 0, W, H);

        /* Background */
        ctx.fillStyle = '#03080f';
        ctx.fillRect(0, 0, W, H);

        /* Radial bg glow */
        var bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.1);
        bgG.addColorStop(0,   'rgba(0,35,55,0.55)');
        bgG.addColorStop(0.6, 'rgba(0,12,22,0.25)');
        bgG.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = bgG;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 1.2, 0, Math.PI * 2);
        ctx.fill();

        /* Concentric rings */
        for (var i = 1; i <= 5; i++) {
            var rr = (i / 5) * maxR;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.strokeStyle = i === 5 ? 'rgba(0,212,255,0.32)' : 'rgba(0,212,255,0.09)';
            ctx.lineWidth = i === 5 ? 1.2 : 0.7;
            ctx.stroke();
        }

        /* CSE full outer ring */
        var fullTarget = (currentIdx === 6) ? 1 : 0;
        fullRingAlpha += (fullTarget - fullRingAlpha) * 0.055;
        if (fullRingAlpha > 0.015) {
            ctx.beginPath();
            ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,230,118,' + (fullRingAlpha * 0.92) + ')';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00e676';
            ctx.shadowBlur  = fullRingAlpha * 22;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,230,118,' + (fullRingAlpha * 0.12) + ')';
            ctx.lineWidth = 18;
            ctx.stroke();
        }

        /* Crosshairs */
        ctx.setLineDash([4, 7]);
        ctx.strokeStyle = 'rgba(0,212,255,0.14)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx, cy - maxR * 1.12); ctx.lineTo(cx, cy + maxR * 1.12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - maxR * 1.12, cy); ctx.lineTo(cx + maxR * 1.12, cy); ctx.stroke();
        ctx.setLineDash([2, 9]);
        ctx.strokeStyle = 'rgba(0,212,255,0.055)';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(cx - maxR, cy - maxR); ctx.lineTo(cx + maxR, cy + maxR); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + maxR, cy - maxR); ctx.lineTo(cx - maxR, cy + maxR); ctx.stroke();
        ctx.setLineDash([]);

        /* Range ticks */
        for (var a = 0; a < 360; a += 30) {
            var rad = (a - 90) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(rad) * maxR * 0.93, cy + Math.sin(rad) * maxR * 0.93);
            ctx.lineTo(cx + Math.cos(rad) * maxR,        cy + Math.sin(rad) * maxR);
            ctx.strokeStyle = 'rgba(0,212,255,0.22)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        /* Compass labels */
        ctx.font = "8px 'Courier New', monospace";
        ctx.fillStyle = 'rgba(0,212,255,0.26)';
        ctx.textAlign = 'center';
        ctx.fillText('000', cx, cy - maxR - 9);
        ctx.fillText('180', cx, cy + maxR + 15);
        ctx.textAlign = 'left';
        ctx.fillText('090', cx + maxR + 6, cy + 4);
        ctx.textAlign = 'right';
        ctx.fillText('270', cx - maxR - 6, cy + 4);

        /* Sweep trail */
        scanAngle += 0.024;
        var trailSteps = 30;
        var trailSpan  = Math.PI * 0.50;
        for (var t = 0; t < trailSteps; t++) {
            var alpha = Math.pow(t / trailSteps, 1.6) * 0.20;
            var a0 = scanAngle - trailSpan * (1 - t / trailSteps);
            var a1 = scanAngle - trailSpan * (1 - (t + 1) / trailSteps);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, maxR, a0, a1);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0,230,118,' + alpha + ')';
            ctx.fill();
        }

        /* Sweep line */
        var sx = cx + Math.cos(scanAngle) * maxR;
        var sy = cy + Math.sin(scanAngle) * maxR;
        var lg = ctx.createLinearGradient(cx, cy, sx, sy);
        lg.addColorStop(0,    'rgba(0,230,118,0.04)');
        lg.addColorStop(0.55, 'rgba(0,230,118,0.38)');
        lg.addColorStop(1,    'rgba(0,230,118,1)');
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = lg;
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur  = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        /* Center dot */
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle   = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur  = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        /* Blips */
        BLIPS.forEach(function(b) {
            if (!activeSet.has(b.idx)) return;
            if (b.fullRing) return;

            var isActive = (b.idx === currentIdx);
            var alpha    = isActive ? 1 : 0.36;
            var xy = polarXY(b.angle, b.r, cx, cy, maxR);
            var bx = xy[0], by = xy[1];

            /* Dual pulse rings */
            if (isActive) {
                if (!pulseStart[b.idx]) pulseStart[b.idx] = ts;
                for (var p = 0; p < 2; p++) {
                    var phase = ((ts - pulseStart[b.idx] + p * 750) % 1500) / 1500;
                    var pr    = 7 + phase * 28;
                    var pa    = (1 - phase) * (p === 0 ? 0.72 : 0.42);
                    ctx.beginPath();
                    ctx.arc(bx, by, pr, 0, Math.PI * 2);
                    ctx.strokeStyle = hexRgba(b.color, pa);
                    ctx.lineWidth   = p === 0 ? 1.5 : 1;
                    ctx.stroke();
                }
            }

            /* Blip ring */
            ctx.shadowColor = b.color;
            ctx.shadowBlur  = isActive ? 15 : 5;
            ctx.beginPath();
            ctx.arc(bx, by, 7, 0, Math.PI * 2);
            ctx.strokeStyle = hexRgba(b.color, alpha);
            ctx.lineWidth   = isActive ? 2 : 1.2;
            ctx.stroke();

            /* Inner dot */
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = hexRgba(b.color, alpha);
            ctx.fill();
            ctx.shadowBlur = 0;

            /* Label */
            var toRight  = bx >= cx;
            var toBottom = by >= cy;
            var lx = bx + (toRight  ? 13 : -13);
            var ly = by + (toBottom ? 15 : -8);
            ctx.font      = (isActive ? 'bold ' : '') + (isActive ? '9' : '8') + "px 'Courier New', monospace";
            ctx.fillStyle = hexRgba(b.color, alpha);
            ctx.textAlign = toRight ? 'left' : 'right';
            ctx.fillText(b.label, lx, ly);
        });

        ctx.textAlign = 'center';
        requestAnimationFrame(draw);
    }

    /* Public API */
    window.activateRadarBlip = function(idx) {
        if (idx < 0) {
            activeSet.clear();
            currentIdx    = -1;
            pulseStart    = {};
            fullRingAlpha = 0;
            return;
        }
        currentIdx = idx;
        activeSet.add(idx);
        delete pulseStart[idx];
    };

    /* Resize */
    var ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(sizeCanvas) : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);
    else window.addEventListener('resize', sizeCanvas, { passive: true });

    sizeCanvas();
    requestAnimationFrame(draw);
})();


/* ═══════════════════════════════════════════════════════════
   APEX v7 — CRO UPGRADE LAYER
   Proof bar ticker · price-lock date · hero load sweep
   Purchase feed · reality-check toggle
   ═══════════════════════════════════════════════════════════ */
(function initCROv7() {
    'use strict';

    const CITIES = [
        'Tokyo','Seoul','Singapore','Hong Kong','Bangkok',
        'Mumbai','Shanghai','Manila','Jakarta','Taipei',
        'London','Berlin','Paris','Madrid','Rome',
        'Amsterdam','Stockholm','Vienna','Warsaw','Lisbon',
        'São Paulo','Buenos Aires','Mexico City','Bogotá','Santiago',
        'Toronto','Sydney','Melbourne','New York','Los Angeles',
        'Chicago','Dubai','Prague'
    ];

    /* ── Proof bar ticker (Task 2A) ──
       Rotates 3 messages every 4s on desktop/tablet.
       Mobile (<768px) shows only message 0 statically (CSS-driven). */
    function initProofBar() {
        if (window.matchMedia('(max-width: 768px)').matches) return; // static on mobile

        const msgs = document.querySelectorAll('.pb-msg');
        if (msgs.length < 3) return;

        const cityEl = document.getElementById('pbCity');
        const timeEl = document.getElementById('pbTime');
        let idx = 0;
        function pickCity() {
            return CITIES[Math.floor(Math.random() * CITIES.length)];
        }
        function pickMinsAgo() {
            const mins = Math.floor(Math.random() * 59) + 1;
            return mins + ' minute' + (mins === 1 ? '' : 's') + ' ago';
        }

        // Initialize message-3 content so it isn't empty on first rotation
        if (cityEl) cityEl.textContent = pickCity();
        if (timeEl) timeEl.textContent = pickMinsAgo();

        function advance() {
            idx = (idx + 1) % msgs.length;
            // Refresh message-3 content each cycle
            if (idx === 2) {
                if (cityEl) cityEl.textContent = pickCity();
                if (timeEl) timeEl.textContent = pickMinsAgo();
            }
            msgs.forEach((m, i) => m.classList.toggle('pb-active', i === idx));
        }

        // Cancel any prior proof-bar interval (e.g. from a viewport-size change)
        if (window.__apexPbInt) { clearInterval(window.__apexPbInt); window.__apexPbInt = null; }
        window.__apexPbInt = setInterval(advance, 4000);
    }
    window.__apexInitProofBar = initProofBar;

    /* ── Price lock date (Task 2D) ──
       Sets the date to today + 3 days, formatted "Month DD, YYYY" */
    function initPriceLockDate() {
        const el = document.getElementById('priceLockDate');
        if (!el) return;
        const d = new Date();
        d.setDate(d.getDate() + 3);
        const months = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        el.textContent = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    /* ── Hero load-complete sweep (Task 2F) ──
       Fires once, 400ms after DOMContentLoaded. */
    function initHeroScan() {
        const scan = document.querySelector('.hero-scan');
        if (!scan) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        setTimeout(() => { scan.classList.add('scan-run'); }, 400);
    }

    /* ── Purchase feed — last 3 purchases (Task 2D) ──
       Renders 3 dynamic entries, refreshes every 90s with new data.
       Times are sorted oldest-to-newest visually, consistent with scan-reading. */
    function initPurchaseFeed() {
        const feed = document.getElementById('purchaseFeed');
        if (!feed) return;

        const firstNames = [
            'Marcus','Kai','Ethan','Liam','Noah','Jordan','Ryan','Alex','Dan','Max',
            'Leo','Hiro','Jun','Tarek','Diego','Luca','Nico','Ben','Sam','Jake',
            'Tom','Josh','Chris','Mike','Will','Adrian','Omar','Yuki','Arjun','Mateo'
        ];
        const lastInits = ['T.','R.','K.','M.','S.','B.','D.','L.','N.','H.','P.','W.','A.','J.','F.'];
        const cities = [
            'London','Toronto','Sydney','Berlin','Amsterdam','Tokyo','Seoul','Madrid',
            'Paris','New York','Los Angeles','Chicago','Melbourne','Vienna','Prague',
            'Warsaw','Singapore','Dubai','Mumbai','Lisbon','Copenhagen','Barcelona'
        ];

        function genEntry(maxHours) {
            const anon = Math.random() < 0.22;
            const firstN = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastI  = lastInits[Math.floor(Math.random() * lastInits.length)];
            const city   = cities[Math.floor(Math.random() * cities.length)];
            const hours  = Math.floor(Math.random() * maxHours) + 1;
            return {
                hours: hours,
                name:  anon ? 'Anonymous' : (firstN + ' ' + lastI),
                city:  anon ? ''          : city
            };
        }

        function render() {
            // Three entries spanning 1–8 hours, sorted ascending (most recent first)
            const entries = [
                genEntry(2),            // recent (1–2h)
                genEntry(5),            // mid   (1–5h)
                genEntry(8)             // older (1–8h)
            ].sort((a, b) => a.hours - b.hours);

            feed.innerHTML = entries.map(e => {
                const cityPart = e.city ? '<span class="pf-city"> from ' + e.city + '</span>' : '';
                const timePart = '<span class="pf-time"> — purchased ' + e.hours + ' hour' + (e.hours === 1 ? '' : 's') + ' ago</span>';
                return '<div class="pf-row"><span class="pf-dot">●</span><span class="pf-name">' + e.name + '</span>' + cityPart + timePart + '</div>';
            }).join('');
        }

        render();
        setInterval(render, 90000); // refresh every 90s as specified
    }

    /* ── Reality-check collapsible (Creative #5) ── */
    function initRealityCheck() {
        const btn = document.getElementById('realityToggle');
        const ans = document.getElementById('realityAnswer');
        if (!btn || !ans) return;

        btn.addEventListener('click', () => {
            const isOpen = ans.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (typeof Haptics !== 'undefined' && Haptics.light) Haptics.light();
        });
    }

    /* ── Init on DOMContentLoaded ── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initProofBar();
            initPriceLockDate();
            initHeroScan();
            initPurchaseFeed();
            initRealityCheck();
        });
    } else {
        // DOM already parsed
        initProofBar();
        initPriceLockDate();
        initHeroScan();
        initPurchaseFeed();
        initRealityCheck();
    }

})();


/* ═══════════════════════════════════════════════════════════
   APEX v8 — VISUAL POLISH LAYER (JS)
   · 1C  Stats strip count-up on viewport entry
   · 4A  Mobile proof-bar rotation (runs on all viewports)
   · 5   Magnetic CTA buttons (desktop only, pointer:fine)
   ═══════════════════════════════════════════════════════════ */
(function initV8Polish() {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1C · Count-up animation for .d-val (stats strip) ──
     Triggers once per element when the strip enters the viewport.
     Honors data-countup / data-prefix / data-suffix / data-decimals. */
  function initCountUp() {
    const targets = document.querySelectorAll('[data-countup]');
    if (!targets.length) return;

    const easeOut = t => 1 - Math.pow(1 - t, 3); // cubic easeOut
    const DURATION = 1200;

    function finalText(el) {
      const target   = parseFloat(el.getAttribute('data-countup')) || 0;
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const prefix   = el.getAttribute('data-prefix') || '';
      const suffix   = el.getAttribute('data-suffix') || '';
      return prefix + target.toFixed(decimals) + suffix;
    }

    function animateValue(el) {
      if (el._countedUp) return;
      el._countedUp = true;

      const target   = parseFloat(el.getAttribute('data-countup')) || 0;
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const prefix   = el.getAttribute('data-prefix') || '';
      const suffix   = el.getAttribute('data-suffix') || '';
      const start    = 0;

      // Respect reduced motion — set final value immediately
      if (prefersReduced) {
        el.textContent = finalText(el);
        return;
      }

      const startT = performance.now();
      function frame(now) {
        // If the element was forcibly finalized mid-animation, stop
        if (el._countupFinalized) return;
        const elapsed = now - startT;
        const t = Math.min(1, elapsed / DURATION);
        const eased = easeOut(t);
        const cur = start + (target - start) * eased;
        el.textContent = prefix + cur.toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = finalText(el);
      }
      requestAnimationFrame(frame);
    }

    // Force-finalize any in-flight countup (used when user scrolls past quickly)
    function finalizeAll() {
      targets.forEach(el => {
        if (el._countedUp) {
          el._countupFinalized = true;
          el.textContent = finalText(el);
        }
      });
    }

    // Observe the .d-strip container; when it enters the viewport,
    // animate all contained .d-val elements once.
    const strips = new Set();
    targets.forEach(t => {
      const strip = t.closest('.d-strip') || t.parentElement;
      if (strip) strips.add(strip);
    });

    if (!('IntersectionObserver' in window)) {
      // Fallback: animate immediately
      targets.forEach(animateValue);
      return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) {
          // If user scrolled PAST this element and countup was running,
          // snap all to final values — prevents stuck partial numbers
          // like "771" when target is "847".
          if (e.target.getBoundingClientRect().bottom < 0) {
            e.target.querySelectorAll('[data-countup]').forEach(el => {
              if (el._countedUp && !el._countupFinalized) {
                el._countupFinalized = true;
                el.textContent = finalText(el);
              }
            });
          }
          return;
        }
        e.target.querySelectorAll('[data-countup]').forEach(animateValue);
      });
    }, { threshold: [0, 0.25, 1], rootMargin: '0px 0px -40px 0px' });

    strips.forEach(s => obs.observe(s));

    // On tab hide/unload, snap all to final values so they aren't stuck partial
    // if the user comes back
    window.addEventListener('pagehide', finalizeAll);
    window.addEventListener('blur', finalizeAll);
  }

  /* ── 4A · Mobile proof-bar rotation ──
     The original JS skips rotation on mobile; with the new .pb-short
     truncated copy, rotation now fits on narrow screens. Mirror the
     existing desktop rotation pattern with a dedicated mobile loop. */
  function initMobileProofBar() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    const msgs = document.querySelectorAll('.pb-msg');
    if (msgs.length < 3) return;

    const cityShort = document.getElementById('pbCityShort');
    const cityDesktop = document.getElementById('pbCity');
    const timeDesktop = document.getElementById('pbTime');

    const CITIES = [
      'Tokyo','Seoul','Singapore','Hong Kong','Bangkok','Mumbai','Shanghai',
      'Manila','Jakarta','Taipei','London','Berlin','Paris','Madrid','Rome',
      'Amsterdam','Stockholm','Vienna','Warsaw','Lisbon','São Paulo','Buenos Aires',
      'Mexico City','Bogotá','Santiago','Toronto','Sydney','Melbourne','New York',
      'Los Angeles','Chicago','Dubai','Prague'
    ];
    const pickCity = () => CITIES[Math.floor(Math.random() * CITIES.length)];
    const pickMins = () => {
      const m = Math.floor(Math.random() * 59) + 1;
      return m + ' minute' + (m === 1 ? '' : 's') + ' ago';
    };

    // Seed dynamic content
    if (cityShort)   cityShort.textContent   = pickCity();
    if (cityDesktop) cityDesktop.textContent = cityShort ? cityShort.textContent : pickCity();
    if (timeDesktop) timeDesktop.textContent = pickMins();

    // If desktop rotation is already active we shouldn't double-rotate;
    // cancel any prior interval (desktop, or a stale mobile one) before starting ours
    if (window.__apexPbInt) { clearInterval(window.__apexPbInt); window.__apexPbInt = null; }
    let idx = 0;
    window.__apexPbInt = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      if (idx === 2) {
        const c = pickCity();
        if (cityShort) cityShort.textContent = c;
        if (cityDesktop) cityDesktop.textContent = c;
        if (timeDesktop) timeDesktop.textContent = pickMins();
      }
      msgs.forEach((m, i) => m.classList.toggle('pb-active', i === idx));
    }, 4000);
  }
  window.__apexInitMobileProofBar = initMobileProofBar;

  /* ── 5 · Magnetic CTA buttons (desktop, pointer:fine) ──
     When the cursor enters a ~90px proximity zone of a primary CTA
     (.b-buy, .b-main), the button translates toward the cursor with
     max offset of 6px, then returns to rest on leave. Uses the modern
     `translate` CSS property so it composes cleanly with the existing
     hover `transform: translate(-3px,-3px)` without overriding it.
     Registers subliminally as "the interface is aware of me" —
     Apple/Linear/Vercel-tier polish that lifts perceived quality. */
  function initMagneticCTAs() {
    if (prefersReduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    // Feature-detect the separate `translate` CSS property (Safari 14.1+, Chrome 104+, FF 72+)
    const supportsTranslateProp = CSS.supports && CSS.supports('translate', '1px 1px');
    if (!supportsTranslateProp) return; // bail gracefully on older browsers

    const MAGNET_RADIUS = 90;   // proximity trigger zone in px
    const MAX_OFFSET    = 6;    // max translation

    // Scope to truly primary CTAs — not the exit-dismiss or calc-btn
    const buttons = document.querySelectorAll('.b-buy, .b-main, .nav-cta');

    buttons.forEach(btn => {
      let rafId = null;
      let curX = 0, curY = 0;
      let tgtX = 0, tgtY = 0;
      let inProximity = false;

      function animate() {
        curX += (tgtX - curX) * 0.18;
        curY += (tgtY - curY) * 0.18;

        // Use `translate` property — composes with `transform` on hover
        btn.style.translate = curX.toFixed(2) + 'px ' + curY.toFixed(2) + 'px';

        if (Math.abs(tgtX - curX) > 0.05 || Math.abs(tgtY - curY) > 0.05) {
          rafId = requestAnimationFrame(animate);
        } else {
          rafId = null;
          if (Math.abs(curX) < 0.1 && Math.abs(curY) < 0.1) {
            btn.style.translate = '';
            btn.classList.remove('magnet-active');
          }
        }
      }

      function onMove(e) {
        const r = btn.getBoundingClientRect();
        if (r.width === 0) return; // display:none — skip

        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        // Proximity test: cursor within bounding rect expanded by MAGNET_RADIUS
        const withinX = Math.abs(dx) < r.width  / 2 + MAGNET_RADIUS;
        const withinY = Math.abs(dy) < r.height / 2 + MAGNET_RADIUS;
        const within  = withinX && withinY;

        if (within) {
          if (!inProximity) {
            inProximity = true;
            btn.classList.add('magnet-active');
          }
          // Scale pull by proximity strength (0..1)
          const distX = Math.max(0, Math.abs(dx) - r.width  / 2);
          const distY = Math.max(0, Math.abs(dy) - r.height / 2);
          const sx = 1 - Math.min(1, distX / MAGNET_RADIUS);
          const sy = 1 - Math.min(1, distY / MAGNET_RADIUS);
          const s  = Math.min(sx, sy);

          tgtX = dx * 0.25 * s;
          tgtY = dy * 0.25 * s;

          if (tgtX >  MAX_OFFSET) tgtX =  MAX_OFFSET;
          if (tgtX < -MAX_OFFSET) tgtX = -MAX_OFFSET;
          if (tgtY >  MAX_OFFSET) tgtY =  MAX_OFFSET;
          if (tgtY < -MAX_OFFSET) tgtY = -MAX_OFFSET;

          if (!rafId) rafId = requestAnimationFrame(animate);
        } else if (inProximity) {
          inProximity = false;
          tgtX = 0; tgtY = 0;
          if (!rafId) rafId = requestAnimationFrame(animate);
        }
      }

      document.addEventListener('mousemove', onMove, { passive: true });

      const reset = () => {
        inProximity = false;
        tgtX = 0; tgtY = 0;
        if (!rafId) rafId = requestAnimationFrame(animate);
      };
      window.addEventListener('scroll', reset, { passive: true });
      window.addEventListener('blur', reset);
      btn.addEventListener('mouseleave', reset);

      // On click, snap to rest so :active translate isn't doubled up
      btn.addEventListener('mousedown', () => {
        btn.style.translate = '';
        curX = 0; curY = 0; tgtX = 0; tgtY = 0;
      });
    });
  }

  // Init when DOM is ready
  function start() {
    initCountUp();
    initMobileProofBar();
    initMagneticCTAs();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();


/* ═══════════════════════════════════════════════════════════
   APEX v9 — IN-APP BROWSER DETECTION + GEO-PRICING DISPLAY
   · Detects TikTok/IG/FB webview and warns about Apple Pay
   · Shows pricing in user's local currency via ipapi.co geo-IP
   ═══════════════════════════════════════════════════════════ */
(function initV9() {
  'use strict';

  /* ── IN-APP BROWSER DETECTION ──
     When users open the site from TikTok/Instagram/Facebook ads,
     the link opens inside the app's embedded webview — where Apple Pay
     often doesn't work and cookies behave strangely. Show a dismissible
     banner advising them to open in Safari/Chrome for best checkout. */
  function initInAppBrowserWarning() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);

    // Detect common in-app browsers
    const isTikTok = /TikTok|musical_ly|Musical_ly|BytedanceWebview/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isFacebook = /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua);
    const isSnapchat = /Snapchat/i.test(ua);
    const isTwitter = /Twitter/i.test(ua);
    const isLinkedIn = /LinkedInApp/i.test(ua);

    const isInApp = isTikTok || isInstagram || isFacebook || isSnapchat || isTwitter || isLinkedIn;
    if (!isInApp) return;
    if (!isIOS && !isAndroid) return; // desktop/tablet webview = rare, skip

    // Don't show if user already dismissed this session
    try {
      if (sessionStorage.getItem('apex_inapp_dismissed')) return;
    } catch (e) {}

    // Identify which app for better messaging
    let appName = 'this app';
    if (isTikTok) appName = 'TikTok';
    else if (isInstagram) appName = 'Instagram';
    else if (isFacebook) appName = 'Facebook';
    else if (isSnapchat) appName = 'Snapchat';
    else if (isTwitter) appName = 'X (Twitter)';
    else if (isLinkedIn) appName = 'LinkedIn';

    // iOS needs "Open in Safari" flow, Android needs "Open in Chrome"
    const browserName = isIOS ? 'Safari' : 'Chrome';
    const iconMark = isIOS ? '⋯' : '⋮'; // iOS uses ... ; Android uses ⋮

    // Build banner
    const banner = document.createElement('div');
    banner.id = 'inapp-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = `
      <div class="iab-inner">
        <div class="iab-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
        </div>
        <div class="iab-body">
          <div class="iab-title">Best checkout in ${browserName}</div>
          <div class="iab-sub">You're viewing this in ${appName}. Apple Pay and some payment methods may not work here.</div>
          <div class="iab-how">Tap <strong>${iconMark}</strong> (top right) → <strong>Open in ${browserName}</strong></div>
        </div>
        <button class="iab-close" aria-label="Dismiss">×</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Dismiss handler
    const closeBtn = banner.querySelector('.iab-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.classList.add('iab-hidden');
        try { sessionStorage.setItem('apex_inapp_dismissed', '1'); } catch (e) {}
        setTimeout(() => banner.remove(), 300);
      });
    }

    // Animate in
    requestAnimationFrame(() => {
      setTimeout(() => banner.classList.add('iab-visible'), 50);
    });
  }

  /* ── GEO-PRICING DISPLAY ──
     Fetches the user's country/currency via ipapi.co (free, no API key,
     ~1000 req/day per IP). Shows price in their local currency on the
     page. Checkout still processes in USD through Lemon Squeezy;
     the displayed price is a friendly local-currency indicator.

     Strategy:
     - US / unknown → leave the page as-is ($24.99)
     - UK → £19.99
     - EU → €22.99
     - Canada → C$32.99
     - Australia → A$37.99
     - Everyone else → $24.99 (default)

     Targets all elements with `data-price-usd="24.99"` or legacy literal
     "$24.99" strings in specific containers. */
  function initGeoPricing() {
    // If the user already has a geo-cached pricing in localStorage, use it
    // (avoids flicker on reload). Otherwise, fetch fresh.
    const CACHE_KEY = 'apex_geo_pricing_v1';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

    const PRICING = {
      US:  { symbol: '$',   price: '24.99', code: 'USD' },
      GB:  { symbol: '£',   price: '19.99', code: 'GBP' },
      IE:  { symbol: '€',   price: '22.99', code: 'EUR' },
      DE:  { symbol: '€',   price: '22.99', code: 'EUR' },
      FR:  { symbol: '€',   price: '22.99', code: 'EUR' },
      IT:  { symbol: '€',   price: '22.99', code: 'EUR' },
      ES:  { symbol: '€',   price: '22.99', code: 'EUR' },
      NL:  { symbol: '€',   price: '22.99', code: 'EUR' },
      BE:  { symbol: '€',   price: '22.99', code: 'EUR' },
      AT:  { symbol: '€',   price: '22.99', code: 'EUR' },
      PT:  { symbol: '€',   price: '22.99', code: 'EUR' },
      FI:  { symbol: '€',   price: '22.99', code: 'EUR' },
      GR:  { symbol: '€',   price: '22.99', code: 'EUR' },
      CA:  { symbol: 'C$',  price: '32.99', code: 'CAD' },
      AU:  { symbol: 'A$',  price: '37.99', code: 'AUD' },
      NZ:  { symbol: 'NZ$', price: '39.99', code: 'NZD' },
    };

    const DEFAULT = { symbol: '$', price: '24.99', code: 'USD' };

    function applyPricing(pricing) {
      // Don't touch if it's USD (already correct)
      if (pricing.code === 'USD') return;

      const newPriceText = pricing.symbol + pricing.price;

      // 1. Pricing card main price (<span class="pricing-now">$24.99</span>)
      const pricingNow = document.querySelector('.pricing-now');
      if (pricingNow && /\$24\.99/.test(pricingNow.textContent)) {
        pricingNow.textContent = newPriceText;
      }

      // 2. "APEX Protocol" row in competitor comparison
      const pcApex = document.querySelector('.pc-apex-price');
      if (pcApex) {
        // Replace leading $24.99 while keeping the unit span intact
        const unitSpan = pcApex.querySelector('.pc-unit');
        pcApex.textContent = newPriceText;
        if (unitSpan) pcApex.appendChild(unitSpan);
      }

      // 3. Bundle deal row ("You get everything for $24.99")
      const dealPrice = document.querySelector('.trv-deal-price');
      if (dealPrice) dealPrice.textContent = newPriceText;

      // 4. Pricing subline ("$24.99 · Instant download · Lifetime access")
      document.querySelectorAll('.pricing-subline, .pricing-headline + * + .pricing-subline').forEach(el => {
        el.textContent = el.textContent.replace(/\$24\.99/g, newPriceText);
      });

      // 5. Headline ("$24.99 Once. Or Wonder Forever.")
      document.querySelectorAll('.s-title').forEach(el => {
        if (/\$24\.99/.test(el.textContent) && !el.dataset.geoApplied) {
          el.childNodes.forEach(node => {
            if (node.nodeType === 3 && /\$24\.99/.test(node.textContent)) {
              node.textContent = node.textContent.replace(/\$24\.99/g, newPriceText);
            }
          });
          el.dataset.geoApplied = '1';
        }
      });

      // 6. CTA buttons ("Get Instant Access — $24.99", "Access Protocol — $24.99", etc.)
      document.querySelectorAll('.b-buy, .b-ghost, .sb-main, .nav-cta').forEach(btn => {
        if (/\$24\.99/.test(btn.textContent)) {
          btn.textContent = btn.textContent.replace(/\$24\.99/g, newPriceText);
        }
      });

      // 7. Exit popup CTA
      document.querySelectorAll('.exit-cta').forEach(btn => {
        if (/\$24\.99/.test(btn.textContent)) {
          btn.textContent = btn.textContent.replace(/\$24\.99/g, newPriceText);
        }
      });

      // 8. Modal CTA ("Get Protocol · $24.99") — targets inner <span> to preserve <small> child
      const modalCta = document.getElementById('modal-cta-btn');
      if (modalCta) {
        const modalCtaSpan = modalCta.querySelector('span');
        if (modalCtaSpan && /\$24\.99/.test(modalCtaSpan.textContent)) {
          modalCtaSpan.textContent = modalCtaSpan.textContent.replace(/\$24\.99/g, newPriceText);
        } else if (!modalCtaSpan && /\$24\.99/.test(modalCta.textContent)) {
          // Fallback for plain-text CTAs
          modalCta.textContent = modalCta.textContent.replace(/\$24\.99/g, newPriceText);
        }
      }

      // 9. Pricing urgency ("8 spots left at $24.99")
      const puText = document.querySelector('.pu-text');
      if (puText) {
        // Be careful — this contains a child span for the count
        const html = puText.innerHTML;
        puText.innerHTML = html.replace(/\$24\.99/g, newPriceText);
      }

      // 10. Price-lock warning ("$24.99 guaranteed until...")
      const plText = document.querySelector('.pl-text');
      if (plText) {
        const html = plText.innerHTML;
        plText.innerHTML = html.replace(/\$24\.99/g, newPriceText);
      }

      // 11. Small indicator: add tiny note about currency near the main price
      // so users don't get confused when checkout shows USD
      if (!document.getElementById('geo-price-note')) {
        const pricingNote = document.querySelector('.pricing-note');
        if (pricingNote) {
          const note = document.createElement('div');
          note.id = 'geo-price-note';
          note.style.cssText = 'font-size:0.62rem;color:var(--text-dim);margin-top:4px;letter-spacing:0.3px';
          note.textContent = `≈ ${newPriceText} in your currency · billed in USD at current rate`;
          pricingNote.parentNode.insertBefore(note, pricingNote.nextSibling);
        }
      }
    }

    function processPricing(country) {
      const pricing = PRICING[country] || DEFAULT;
      applyPricing(pricing);
    }

    // Try cache first
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.country && cached.ts && (Date.now() - cached.ts < CACHE_TTL)) {
        processPricing(cached.country);
        return;
      }
    } catch (e) {}

    // Fetch fresh from ipapi.co (free tier: 1000 req/day per IP)
    fetch('https://ipapi.co/json/', { method: 'GET' })
      .then(r => {
        if (!r.ok) throw new Error('ipapi non-200');
        return r.json();
      })
      .then(data => {
        const country = (data && data.country_code) ? String(data.country_code).toUpperCase() : 'US';
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ country, ts: Date.now() }));
        } catch (e) {}
        processPricing(country);
      })
      .catch(() => {
        // Silent fail — page stays in USD, which is the intended default anyway
      });
  }

  // Run both features
  function start() {
    initInAppBrowserWarning();
    initGeoPricing();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

document.addEventListener('DOMContentLoaded', () => {
    const hTitle = document.querySelector('.h-title');
    const heroRight = document.querySelector('.hero-right');
    const heroWrap = document.querySelector('.hero-wrap');

    if (!hTitle || !heroRight || !heroWrap) return;

    const arrangeHeroVideo = () => {
        if (window.innerWidth <= 900) {
            // Вставляем видео физически после заголовка
            if (heroRight.parentElement !== hTitle.parentElement) {
                hTitle.insertAdjacentElement('afterend', heroRight);
            }
            // ГЛАВНОЕ: перебиваем твой CSS order: 99, чтобы видео не улетало вниз
            heroRight.style.setProperty('order', '1', 'important');
            heroRight.style.marginTop = '14px';
            heroRight.style.marginBottom = '14px';
            // Убираем нижний отступ у заголовка, чтобы видео было впритык
            hTitle.style.marginBottom = '0px';
        } else {
            // На десктопе возвращаем всё как было в правую колонку
            if (heroRight.parentElement !== heroWrap) {
                heroWrap.appendChild(heroRight);
            }
            heroRight.style.order = '';
            heroRight.style.marginTop = '';
            heroRight.style.marginBottom = '';
            hTitle.style.marginBottom = '';
        }
    };

    arrangeHeroVideo();
    window.addEventListener('resize', arrangeHeroVideo);
});


/* ═══════════════════════════════════════════════════════════
   PROOF BAR — viewport breakpoint guard
   Prevents double-rotation when user crosses the 768px boundary
   (e.g. tablet rotation, devtools resize). Both initProofBar (desktop,
   inside initCROv7 IIFE) and initMobileProofBar (mobile, inside
   initV8Polish IIFE) write their interval ID to window.__apexPbInt
   and clear any previous one on re-entry. This listener re-invokes
   both when the media query changes; each has its own self-guard
   so only the matching one will actually start a new interval.
   ═══════════════════════════════════════════════════════════ */
(function proofBarViewportGuard() {
    const mq = window.matchMedia('(max-width: 768px)');
    const handle = () => {
        // Clear current interval (whichever owns it)
        if (window.__apexPbInt) {
            clearInterval(window.__apexPbInt);
            window.__apexPbInt = null;
        }
        // Reset pb-active to message 0 for a clean restart
        document.querySelectorAll('.pb-msg').forEach((m, i) => {
            m.classList.toggle('pb-active', i === 0);
        });
        // Re-invoke both initializers; each self-guards on viewport match
        if (typeof window.__apexInitProofBar === 'function') window.__apexInitProofBar();
        if (typeof window.__apexInitMobileProofBar === 'function') window.__apexInitMobileProofBar();
    };
    if (mq.addEventListener) mq.addEventListener('change', handle);
    else if (mq.addListener)  mq.addListener(handle); // Safari < 14
})();
