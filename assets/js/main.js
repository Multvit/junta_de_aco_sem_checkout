/* =========================================================
   Junta de Aço · Multvit — interações e motion
   ========================================================= */

/* ===================== CONFIGURAÇÃO ===================== */
const CONFIG = {
  whatsapp: "https://wa.me/554498400223?text=" + encodeURIComponent("Olá! Tenho interesse no Junta de Aço e gostaria de tirar algumas dúvidas."),
  // Assistente virtual (n8n). Deixe "" para desligar; aí o botão flutuante do WhatsApp volta a aparecer.
  chatN8n: "https://n8n.multvit.com/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat",
  metaPixelId: "",   // ex.: "1234567890" (Meta Pixel do Junta de Aço)
  clarityId: "",     // ex.: "abc123xyz" (Microsoft Clarity)
};
/* ======================================================== */

(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const M = window.Motion;
  const animated = document.documentElement.classList.contains("m") && !!M;
  const ease = [0.2, 0.8, 0.2, 1];

  /* ---------- Tracking ---------- */
  function loadTracking() {
    if (CONFIG.metaPixelId) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", CONFIG.metaPixelId); fbq("track", "PageView");
    }
    if (CONFIG.clarityId) {
      (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", CONFIG.clarityId);
    }
  }
  const track = (ev, data) => { try { if (typeof fbq === "function") fbq("track", ev, data); } catch (e) {} };
  loadTracking();

  /* ---------- Assistente virtual (n8n) ---------- */
  function loadChat() {
    if (!CONFIG.chatN8n) return;
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://cdn.jsdelivr.net/npm/@n8n/chat@1.45.5/dist/style.css";
    document.head.appendChild(css);
    import("https://cdn.jsdelivr.net/npm/@n8n/chat@1.45.5/dist/chat.bundle.es.js").then(({ createChat }) => {
      createChat({
        webhookUrl: CONFIG.chatN8n,
        initialMessages: ["Olá! 👋", "João aqui, como posso te ajudar hoje?"],
        i18n: { en: { title: "Fale com o João 👋", subtitle: "Tire todas as suas dúvidas sobre o Junta de Aço", footer: "", getStarted: "Nova conversa", inputPlaceholder: "Escreva sua dúvida..." } },
      });
      document.documentElement.classList.add("has-chat");
    }).catch(() => {});
  }
  // Carrega depois do conteúdo principal para não pesar na abertura da página
  if (document.readyState === "complete") setTimeout(loadChat, 1200);
  else addEventListener("load", () => setTimeout(loadChat, 1200));

  /* ---------- Links ---------- */
  $$(".js-wa").forEach(a => {
    a.href = CONFIG.whatsapp; a.target = "_blank"; a.rel = "noopener";
    a.addEventListener("click", () => track("Contact", { content_name: "WhatsApp Junta de Aço" }));
  });
  const year = $("#year"); if (year) year.textContent = new Date().getFullYear();

  /* ---------- Depoimentos em vídeo: carrega o YouTube só no clique ---------- */
  $$(".js-yt").forEach(b => b.addEventListener("click", () => {
    const wrap = document.createElement("div"); wrap.className = "vframe";
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = b.getAttribute("aria-label") || "Depoimento em vídeo";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    wrap.appendChild(f); b.replaceWith(wrap);
    track("ViewContent", { content_name: "Depoimento em vídeo" });
  }));

  /* ---------- Header: sólido ao rolar, esconde ao descer ---------- */
  const nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  const hero = $(".hero");
  let lastY = scrollY, ticking = false;
  function onScrollNav() {
    const y = scrollY;
    const overHero = y < (hero ? hero.offsetHeight - 80 : 200);
    nav.classList.toggle("is-solid", !overHero || !menu.hidden);
    if (menu.hidden) nav.classList.toggle("is-hidden", y > lastY && y > 400);
    lastY = y;
  }
  burger.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open; burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.remove("is-hidden"); onScrollNav();
  });
  $$("a", menu).forEach(a => a.addEventListener("click", () => { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); onScrollNav(); }));

  /* ---------- WhatsApp flutuante ---------- */
  const waFloat = $(".wa-float");
  function onScrollFloat() {
    waFloat.classList.toggle("is-on", scrollY > (hero ? hero.offsetHeight * 0.7 : 400));
  }

  /* ---------- Trilha da jornada (desenho pelo scroll) + etapas ---------- */
  const steps = $("#detailSteps"), trail = $("#trail");
  const dsKicker = $("#dsKicker"), dsValue = $("#dsValue"), dsLabel = $("#dsLabel"), dsBadge = $(".ds-badge");
  const trailSvg = $("#trailSvg"), trailBg = $("#trailBg");
  let trailLen = 0;
  function buildTrail() {
    if (!steps) return;
    const H = Math.max(200, steps.offsetHeight), W = 40, seg = 170, amp = 14;
    let d = `M${W / 2} 0`, y = 0, dir = 1;
    while (y < H) {
      const ny = Math.min(H, y + seg);
      d += ` C ${W / 2 + amp * dir} ${y + (ny - y) * 0.35}, ${W / 2 + amp * dir} ${y + (ny - y) * 0.65}, ${W / 2} ${ny}`;
      y = ny; dir *= -1;
    }
    trailSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    trailSvg.setAttribute("width", W); trailSvg.setAttribute("height", H);
    trailBg.setAttribute("d", d); trail.setAttribute("d", d);
    trailLen = trail.getTotalLength();
    trail.style.strokeDasharray = `${trailLen} ${trailLen}`;
    trail.style.strokeDashoffset = reduce ? "0" : String(trailLen);
  }
  buildTrail();
  addEventListener("load", buildTrail);
  let trailT; addEventListener("resize", () => { clearTimeout(trailT); trailT = setTimeout(() => { buildTrail(); onScrollTrail(); }, 150); });
  function onScrollTrail() {
    if (!steps || reduce || !trailLen) return;
    const r = steps.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / r.height));
    trail.style.strokeDashoffset = String(trailLen * (1 - p));
  }
  let activeStep = -1;
  const dsteps = $$(".dstep");
  function setStep(i) {
    if (i === activeStep) return; activeStep = i;
    dsteps.forEach((s, j) => s.classList.toggle("is-active", j === i));
    const s = dsteps[i];
    dsKicker.textContent = s.dataset.k; dsValue.textContent = s.dataset.v; dsLabel.textContent = s.dataset.l;
    if (!reduce) { dsBadge.classList.remove("swap"); void dsBadge.offsetWidth; dsBadge.classList.add("swap"); }
  }
  function onScrollSteps() {
    const mid = innerHeight * (innerWidth <= 900 ? 0.62 : 0.5);
    let idx = 0;
    dsteps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) idx = i; });
    setStep(idx);
  }
  setStep(0);

  /* ---------- Parallax leve ---------- */
  const parallax = $$(".parallax");
  function onScrollParallax() {
    if (reduce) return;
    parallax.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0, ${(c * parseFloat(el.dataset.speed)).toFixed(1)}px, 0)`;
    });
  }

  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { onScrollNav(); onScrollFloat(); onScrollTrail(); onScrollSteps(); onScrollParallax(); ticking = false; });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- Accordion animado ---------- */
  $$(".acc-item").forEach(d => {
    const sum = $("summary", d), body = $(".acc-body", d);
    sum.addEventListener("click", e => {
      if (reduce || !M) return;
      e.preventDefault();
      if (d.open) {
        M.animate(body, { height: [body.offsetHeight + "px", "0px"], opacity: [1, 0] }, { duration: 0.35, ease }).then(() => { d.open = false; body.style.height = ""; body.style.opacity = ""; });
      } else {
        $$(".acc-item[open]").forEach(o => { if (o !== d) o.open = false; });
        d.open = true;
        const h = body.scrollHeight;
        M.animate(body, { height: ["0px", h + "px"], opacity: [0, 1] }, { duration: 0.45, ease }).then(() => { body.style.height = ""; });
      }
    });
  });

  /* ---------- Split de títulos em palavras ---------- */
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const o = document.createElement("span"); o.className = "sw";
            const i = document.createElement("span"); i.textContent = part; o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    $$(".sw", el).forEach(s => s.setAttribute("aria-hidden", "true"));
  }
  $$(".split").forEach(splitWords);

  /* ---------- Contadores ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || "0", 10);
    const fmt = v => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce || !M) { el.textContent = fmt(to); return; }
    M.animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: v => { el.textContent = fmt(v); } });
  }

  /* ---------- Coreografia (Motion) ---------- */
  if (animated) {
    const { animate, stagger, inView } = M;
    const mobile = innerWidth <= 900;

    // Hero: entrada
    animate(".hero-title .w", { transform: ["translateY(110%)", "translateY(0%)"] }, { duration: 1.1, delay: stagger(0.08, { startDelay: mobile ? 0.35 : 0.15 }), ease });
    animate(".hero-copy .rv", { opacity: [0, 1], transform: ["translateY(22px)", "translateY(0px)"] }, { duration: 0.9, delay: stagger(0.1, { startDelay: mobile ? 0.7 : 0.6 }), ease });
    animate(".hv-halo", { opacity: [0, 1] }, { duration: 1.6, delay: 0.1 });
    animate(".hv-product", { transform: ["translateZ(60px) scale(.82) rotate(-6deg)", "translateZ(60px) scale(1) rotate(0deg)"] }, { type: "spring", stiffness: 70, damping: 14, delay: 0.2 });
    animate(".hv-product", { opacity: [0, 1], filter: ["blur(16px)", "blur(0px)"] }, { duration: 0.9, delay: 0.2, ease });
    animate(".hv-ring", { opacity: [0, 1] }, { duration: 1.4, delay: 0.7 });
    animate(".hv-orbit", { opacity: [0, 1] }, { duration: 1.2, delay: 0.9 });

    // Títulos de seção: palavra por palavra ao entrar
    $$(".split").forEach(t => {
      inView(t, () => { animate($$(".sw > span", t), { transform: ["translateY(105%)", "translateY(0%)"] }, { duration: 0.95, delay: stagger(0.05), ease }); }, { amount: 0.4 });
    });

    // Reveal em cascata por grupo (fora do hero)
    const groups = new Map();
    $$(".rv").filter(el => !el.closest(".hero")).forEach(el => {
      const g = el.closest(".problem-grid, .ben-grid, .formula, .steps, .kit-grid, .vid-grid, .acc, .proof-grid") || el;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(el);
    });
    groups.forEach((els, g) => {
      inView(g, () => { animate(els, { opacity: [0, 1], transform: ["translateY(28px)", "translateY(0px)"] }, { duration: 0.85, delay: stagger(0.08), ease }); }, { amount: 0.15, margin: "0px 0px -8% 0px" });
    });

    // CTA principal: pulso de atenção após a entrada
    setTimeout(() => animate(".hero-ctas .btn-sun", { scale: [1, 1.04, 1] }, { duration: 0.7, ease: "easeInOut" }), 2600);
  }

  // Contadores (com ou sem Motion)
  const counters = $$(".count");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
    counters.forEach(c => io.observe(c));
  }

  /* ---------- Tilt 3D + reflexo no pote ---------- */
  const hv = $("#heroVisual"), stage = $("#heroStage"), glare = $(".hv-glare");
  if (!reduce && hv && finePointer) {
    let raf = 0, tx = 0, ty = 0;
    hv.addEventListener("pointermove", e => {
      const r = hv.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        stage.style.transform = `rotateY(${tx * 16}deg) rotateX(${-ty * 12}deg)`;
        glare.style.setProperty("--gx", (tx + 0.5) * 100 + "%"); glare.style.setProperty("--gy", (ty + 0.5) * 100 + "%");
        raf = 0;
      });
    });
    hv.addEventListener("pointerleave", () => { stage.style.transform = ""; });
  }

  /* ---------- Cápsulas flutuando (canvas) ----------
     Cápsulas de duas cores sobem devagar, girando no próprio eixo
     (o giro achata a cápsula, como se virasse em 3D). */
  const css = getComputedStyle(document.documentElement);
  const SUN = css.getPropertyValue("--sun-rgb").trim() || "247,202,22";
  const LILAC = css.getPropertyValue("--lilac-rgb").trim() || "207,168,245";
  const CREAM = css.getPropertyValue("--cream-rgb").trim() || "247,243,250";
  function capsules(canvas, opts) {
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, running = false, ps = [];
    const host = canvas.parentElement;
    const mobile = () => innerWidth < 900;
    const pickColor = () => { const r = Math.random(); return r < 0.45 ? CREAM : r < 0.75 ? LILAC : SUN; };
    const make = init => ({
      x: Math.random() * w, y: init ? Math.random() * h : h + 30 * dpr,
      s: (Math.random() * 7 + 6) * dpr, vy: (Math.random() * 0.3 + 0.16) * dpr,
      sw: Math.random() * 0.5 + 0.2, amp: (Math.random() * 24 + 12) * dpr, ph: Math.random() * 6.28,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.01,
      flip: Math.random() * 6.28, vf: Math.random() * 0.018 + 0.006,
      c: pickColor(), c2: Math.random() < 0.5 ? SUN : CREAM, o: Math.random() * 0.22 + 0.14, outline: Math.random() < 0.4,
    });
    function capsule(p, x, y) {
      const L = p.s * 1.25, R = p.s * 0.55; // meio comprimento e raio
      const sy = Math.max(0.2, Math.abs(Math.cos(p.flip)));
      const a = p.o * Math.min(1, y / (h * 0.15) + 0.1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.scale(1, sy);
      const body = () => { ctx.beginPath(); ctx.moveTo(-L + R, -R); ctx.lineTo(L - R, -R); ctx.arc(L - R, 0, R, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-L + R, R); ctx.arc(-L + R, 0, R, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); };
      if (p.outline) {
        body(); ctx.strokeStyle = `rgba(${p.c},${a * 1.7})`; ctx.lineWidth = 1.2 * dpr; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
      } else {
        body(); ctx.save(); ctx.clip();
        ctx.fillStyle = `rgba(${p.c},${a})`; ctx.fillRect(-L, -R, L, R * 2);
        ctx.fillStyle = `rgba(${p.c2},${a})`; ctx.fillRect(0, -R, L, R * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`; ctx.fillRect(-L + R, -R * 0.6, L * 1.2, R * 0.28);
        ctx.restore();
      }
      ctx.restore();
    }
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = host.clientWidth * dpr; h = canvas.height = host.clientHeight * dpr;
      ps = Array.from({ length: mobile() ? opts.mobile : opts.desktop }, () => make(true));
    }
    let t = 0;
    function frame() {
      if (!running) return;
      t += 0.016; ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.y -= p.vy; p.rot += p.vr + Math.sin(t * p.sw + p.ph) * 0.003; p.flip += p.vf;
        if (p.y < -30 * dpr) { ps[i] = make(false); continue; }
        capsule(p, p.x + Math.sin(t * p.sw + p.ph) * p.amp, p.y);
      }
      requestAnimationFrame(frame);
    }
    resize();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
    const io = new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting && !document.hidden;
      if (vis && !running) { running = true; requestAnimationFrame(frame); } else if (!vis) running = false;
    });
    io.observe(host);
    document.addEventListener("visibilitychange", () => { if (document.hidden) running = false; else { io.unobserve(host); io.observe(host); } });
  }

  capsules($("#fx"), { desktop: 24, mobile: 11 });
  capsules($("#fx2"), { desktop: 16, mobile: 8 });
})();
