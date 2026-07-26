document.body.classList.add("is-loading");

const loader = document.querySelector(".loader");
const header = document.querySelector(".site-header");
const cursorFollower = document.querySelector("#cursorFollower");
const navToggle = document.querySelector("#navToggle");
const mainNav = document.querySelector(".main-nav");
const filterButtons = [...document.querySelectorAll(".filter-btn")];
const portfolioShowcase = document.querySelector("#portfolioShowcase");
const portfolioNavPrev = document.querySelector(".portfolio-nav-prev");
const portfolioNavNext = document.querySelector(".portfolio-nav-next");
const trackTop = document.querySelector('[data-track="top"]');
const trackBottom = document.querySelector('[data-track="bottom"]');
const caseStudyShell = document.querySelector(".case-study-shell");
const quotes = [...document.querySelectorAll(".quote")];
const bookingForm = document.querySelector("#bookingForm");
const formSuccess = document.querySelector("#formSuccess");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getWorks = () => (window.SpiritWorks ? window.SpiritWorks.getWorks() : []);

const splitWorksIntoRows = (works) => {
  const midpoint = Math.ceil(works.length / 2);
  return {
    top: works.slice(0, midpoint),
    bottom: works.slice(midpoint),
  };
};

/* ── Loader & header ── */
window.addEventListener("load", () => {
  setTimeout(() => {
    loader?.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    document.querySelectorAll(".hero-inner .reveal").forEach((el) => {
      el.classList.add("is-visible");
    });
  }, 700);
});

window.addEventListener(
  "scroll",
  () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 20);
  },
  { passive: true }
);

/* ── Mobile nav ── */
navToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", open);
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    navToggle?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

/* ── Testimonials ── */
let quoteIndex = 0;
if (quotes.length > 1) {
  setInterval(() => {
    quotes[quoteIndex].classList.remove("is-current");
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quotes[quoteIndex].classList.add("is-current");
  }, 5000);
}

/* ── Scroll reveal ── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

const observeReveals = () => {
  document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
    revealObserver.observe(el);
  });
};

/* ── Portfolio rendering ── */
const getCardImage = (work) => work.cardImage || work.gallery?.[0] || work.heroImage || "";

const renderProjectCard = (work) => `
  <article class="project-card" data-category="${escapeHtml(work.categories.join(" "))}" data-project="${escapeHtml(work.id)}">
    <div class="project-card-inner">
      <button class="project-trigger magnetic" type="button" aria-label="Open ${escapeHtml(work.title)}">
        <div class="project-slide">
          <img src="${escapeHtml(getCardImage(work))}" alt="${escapeHtml(work.cardAlt)}" loading="lazy" draggable="false" />
        </div>
        <div class="project-meta">
          <strong>${escapeHtml(work.title)}</strong>
          <p class="project-subtitle">${escapeHtml(work.subtitle)}</p>
        </div>
      </button>
    </div>
  </article>
`;

const renderCaseGallery = (work) => {
  if (!work.gallery?.length) return "";

  return `
    <section class="case-gallery-section">
      <div class="case-gallery-head">
        <h4>Project Photos</h4>
        <div class="case-gallery-nav">
          <button type="button" class="case-gallery-prev magnetic" aria-label="Scroll photos left">←</button>
          <button type="button" class="case-gallery-next magnetic" aria-label="Scroll photos right">→</button>
        </div>
      </div>
      <div class="case-gallery-shell">
        <div class="case-gallery-fade case-gallery-fade--left" aria-hidden="true"></div>
        <div class="case-gallery-fade case-gallery-fade--right" aria-hidden="true"></div>
        <div class="case-gallery-row">
          ${work.gallery
            .map(
              (img, index) => `
            <figure class="case-gallery-item" style="--gallery-delay:${index * 0.08}s">
              <div class="case-gallery-item-inner">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(work.title)} photo ${index + 1}" loading="lazy" draggable="false" />
              </div>
            </figure>
          `
            )
            .join("")}
        </div>
      </div>
      <div class="case-gallery-scroll-ui">
        <p class="case-gallery-hint" aria-hidden="true">
          <span class="case-gallery-hint-arrow">←</span>
          Slide
          <span class="case-gallery-hint-arrow">→</span>
        </p>
        <div class="case-gallery-track" aria-hidden="true">
          <div class="case-gallery-thumb"></div>
        </div>
      </div>
    </section>
  `;
};

const updateCaseGalleryScroll = (section) => {
  const row = section.querySelector(".case-gallery-row");
  const thumb = section.querySelector(".case-gallery-thumb");
  if (!row || !thumb) return;

  const maxScroll = row.scrollWidth - row.clientWidth;
  const thumbWidth = maxScroll > 0 ? (row.clientWidth / row.scrollWidth) * 100 : 100;
  const thumbLeft = maxScroll > 0 ? (row.scrollLeft / maxScroll) * (100 - thumbWidth) : 0;

  thumb.style.width = `${thumbWidth}%`;
  thumb.style.left = `${thumbLeft}%`;

  section.classList.toggle("at-start", row.scrollLeft <= 8);
  section.classList.toggle("at-end", maxScroll <= 8 || row.scrollLeft >= maxScroll - 8);
  section.classList.toggle("is-static", maxScroll <= 8);
};

const initCaseGalleryRows = (root = document) => {
  root.querySelectorAll(".case-gallery-section:not([data-ready])").forEach((section) => {
    section.dataset.ready = "true";
    const row = section.querySelector(".case-gallery-row");
    if (!row) return;

    const onScroll = () => updateCaseGalleryScroll(section);
    row.addEventListener("scroll", onScroll, { passive: true });
    window.setTimeout(() => updateCaseGalleryScroll(section), 60);
    window.addEventListener("resize", onScroll, { passive: true });

    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    const onPointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      isDragging = true;
      startX = event.clientX;
      scrollStart = row.scrollLeft;
      row.classList.add("is-dragging");
      section.classList.add("is-scrolling");
      row.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!isDragging) return;
      event.preventDefault();
      row.scrollLeft = scrollStart - (event.clientX - startX);
    };

    const onPointerUp = (event) => {
      if (!isDragging) return;
      isDragging = false;
      row.classList.remove("is-dragging");
      section.classList.remove("is-scrolling");
      row.releasePointerCapture(event.pointerId);
      updateCaseGalleryScroll(section);
    };

    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);
  });
};

const scrollCaseGallery = (button, direction) => {
  const section = button.closest(".case-gallery-section");
  const row = section?.querySelector(".case-gallery-row");
  if (!row) return;
  row.scrollBy({ left: direction * Math.max(row.clientWidth * 0.75, 320), behavior: "smooth" });
  window.setTimeout(() => updateCaseGalleryScroll(section), 320);
};

const samplePaletteFromSrc = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.decoding = "async";
    if (src.startsWith("http")) img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let bestAccent = null;
        let bestScore = -1;

        for (let i = 0; i < pixels.length; i += 4) {
          const pr = pixels[i];
          const pg = pixels[i + 1];
          const pb = pixels[i + 2];
          r += pr;
          g += pg;
          b += pb;

          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const luminance = (pr + pg + pb) / 3;
          const score = saturation * 1.5 + (luminance / 255) * 0.3;

          if (saturation > 0.14 && luminance > 24 && luminance < 245 && score > bestScore) {
            bestScore = score;
            bestAccent = { r: pr, g: pg, b: pb };
          }
        }

        const count = pixels.length / 4;
        const soft = {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        };

        resolve({
          soft,
          accent: bestAccent || soft,
        });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });

const getWorkImageSources = (work) => {
  const sources = [work.cardImage, ...(work.gallery || []), ...(work.heroImages || [])].filter(Boolean);
  return [...new Set(sources)];
};

const brightenColor = ({ r, g, b }, amount = 0.58) => {
  const mix = (channel) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  return { r: mix(r), g: mix(g), b: mix(b) };
};

const accentColor = ({ r, g, b }) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const boost = 1.28 + (1 - saturation) * 0.42;
  const avg = (r + g + b) / 3;

  return brightenColor(
    {
      r: Math.min(255, Math.round(avg + (r - avg) * boost)),
      g: Math.min(255, Math.round(avg + (g - avg) * boost)),
      b: Math.min(255, Math.round(avg + (b - avg) * boost)),
    },
    0.38
  );
};

const colorDistance = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

const pushUniqueColor = (list, color) => {
  if (!color) return;
  if (list.some((entry) => colorDistance(entry, color) < 38)) return;
  list.push(color);
};

const applyCaseStudyAmbience = async (study, work) => {
  const orbs = [...study.querySelectorAll(".case-ambience-orb")];
  const photoEl = study.querySelector(".case-ambience-photo");
  if (!orbs.length || !work) return;

  const heroSrc = work.cardImage || work.gallery?.[0] || work.heroImages?.[0] || "";
  if (photoEl && heroSrc) {
    photoEl.style.backgroundImage = `url("${heroSrc}")`;
  }

  const orbColors = [];
  for (const src of getWorkImageSources(work)) {
    const palette = await samplePaletteFromSrc(src);
    if (!palette) continue;

    pushUniqueColor(orbColors, accentColor(palette.accent));
    if (orbColors.length < orbs.length) {
      pushUniqueColor(orbColors, brightenColor(palette.soft, 0.48));
    }
    if (orbColors.length >= orbs.length) break;
  }

  if (!orbColors.length) orbColors.push({ r: 180, g: 180, b: 180 });

  while (orbColors.length < orbs.length) {
    const base = orbColors[orbColors.length % orbColors.length];
    pushUniqueColor(orbColors, brightenColor(base, 0.18));
    if (orbColors.length < orbs.length) {
      orbColors.push(brightenColor(base, 0.28));
    }
  }

  orbs.forEach((orb, index) => {
    const { r, g, b } = orbColors[index];
    orb.style.setProperty("--orb-r", String(r));
    orb.style.setProperty("--orb-g", String(g));
    orb.style.setProperty("--orb-b", String(b));
  });

  const primary = orbColors[0];
  study.style.setProperty("--work-accent-r", String(primary.r));
  study.style.setProperty("--work-accent-g", String(primary.g));
  study.style.setProperty("--work-accent-b", String(primary.b));
  study.classList.add("has-ambience");
};

const initCaseStudyAmbience = (root = document) => {
  const works = window.SpiritWorks?.getWorks(true) || getWorks();
  root.querySelectorAll(".case-study").forEach((study) => {
    const work = works.find((item) => item.id === study.dataset.detail);
    if (work) applyCaseStudyAmbience(study, work);
  });
};

const initPhotoGlows = (root = document) => {
  root.querySelectorAll(".case-gallery-item img").forEach((img) => {
    if (img.dataset.glowReady) return;
    img.dataset.glowReady = "true";

    const applyGlow = () => {
      const item = img.closest(".case-gallery-item");
      if (!item) return;

      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
        }

        const count = pixels.length / 4;
        item.style.setProperty("--photo-r", String(Math.round(r / count)));
        item.style.setProperty("--photo-g", String(Math.round(g / count)));
        item.style.setProperty("--photo-b", String(Math.round(b / count)));
        item.classList.add("has-photo-glow");
      } catch {
        item.classList.add("has-photo-glow");
      }
    };

    if (img.complete) applyGlow();
    else img.addEventListener("load", applyGlow, { once: true });
  });
};

const renderCaseStudy = (work) => `
  <article class="case-study" data-detail="${escapeHtml(work.id)}">
    <div class="case-study-ambience" aria-hidden="true">
      <div class="case-ambience-photo"></div>
      <span class="case-ambience-orb case-ambience-orb--1"></span>
      <span class="case-ambience-orb case-ambience-orb--2"></span>
      <span class="case-ambience-orb case-ambience-orb--3"></span>
      <span class="case-ambience-orb case-ambience-orb--4"></span>
      <span class="case-ambience-orb case-ambience-orb--5"></span>
      <span class="case-ambience-orb case-ambience-orb--6"></span>
    </div>
    <div class="case-study-content">
      <div class="case-header">
        <h3>${escapeHtml(work.title)}</h3>
        <p>${escapeHtml(work.services)}</p>
      </div>
      <div class="case-body">
        <dl class="case-meta-list">
          <div><dt>Industry</dt><dd>${escapeHtml(work.industry)}</dd></div>
          <div><dt>Client</dt><dd>${escapeHtml(work.client)}</dd></div>
          <div><dt>Year</dt><dd>${escapeHtml(work.year)}</dd></div>
        </dl>
        <div class="case-copy">
          ${work.brandStory ? `<div class="case-brand-story"><span>Brand Story</span><p>${escapeHtml(work.brandStory).replace(/\n/g, "<br />")}</p></div>` : ""}
        </div>
      </div>
      ${renderCaseGallery(work)}
    </div>
  </article>
`;

const renderWorks = () => {
  const works = getWorks();
  const rows = splitWorksIntoRows(works);

  if (trackTop && trackBottom) {
    if (!works.length) {
      trackTop.innerHTML = `<p class="empty-works">No projects available yet.</p>`;
      trackBottom.innerHTML = "";
    } else {
      trackTop.innerHTML = rows.top.map(renderProjectCard).join("");
      trackBottom.innerHTML = rows.bottom.map(renderProjectCard).join("");
    }
  }

  if (caseStudyShell) {
    caseStudyShell.innerHTML = works.length
      ? `<button class="btn btn-outline case-close magnetic" type="button" id="caseClose">Close Work</button>` +
        works.map(renderCaseStudy).join("")
      : "";
  }

  observeReveals();
  initMagnetic();
  initPortfolioRows();
  initCaseGalleryRows(caseStudyShell);
  initPhotoGlows(caseStudyShell);
  initCaseStudyAmbience(caseStudyShell);
  updatePortfolioScrollState();
};

/* ── Horizontal portfolio interactions ── */
const getPortfolioScrollStep = () => {
  const card = document.querySelector(".portfolio-row .project-card:not(.is-hidden)");
  if (!card) return 360;
  const track = card.closest(".portfolio-track");
  const gap = track ? parseFloat(getComputedStyle(track).gap) || 32 : 32;
  return card.offsetWidth + gap;
};

const getPortfolioRows = () => [...document.querySelectorAll(".portfolio-row")];

const syncPortfolioRows = (sourceRow, scrollLeft) => {
  getPortfolioRows().forEach((row) => {
    if (row !== sourceRow) row.scrollLeft = scrollLeft;
  });
};

const updatePortfolioScrollState = () => {
  const rows = getPortfolioRows();
  if (!portfolioShowcase || !rows.length) return;

  const atStart = rows.every((row) => row.scrollLeft <= 8);
  const atEnd = rows.every((row) => {
    const maxScroll = row.scrollWidth - row.clientWidth;
    return maxScroll <= 8 || row.scrollLeft >= maxScroll - 8;
  });

  portfolioShowcase.classList.toggle("at-start", atStart);
  portfolioShowcase.classList.toggle("at-end", atEnd);

  if (portfolioNavPrev) portfolioNavPrev.disabled = atStart;
  if (portfolioNavNext) portfolioNavNext.disabled = atEnd;
};

const scrollPortfolioRows = (direction) => {
  const step = getPortfolioScrollStep() * direction;

  getPortfolioRows().forEach((row) => {
    row.scrollBy({ left: step, behavior: "smooth" });
  });

  window.setTimeout(updatePortfolioScrollState, 320);
};

const initPortfolioNavigation = () => {
  if (portfolioNavPrev?.dataset.initialized) return;
  if (portfolioNavPrev) portfolioNavPrev.dataset.initialized = "1";

  portfolioNavPrev?.addEventListener("click", () => scrollPortfolioRows(-1));
  portfolioNavNext?.addEventListener("click", () => scrollPortfolioRows(1));
};

const initPortfolioRows = () => {
  document.querySelectorAll(".portfolio-row").forEach((row) => {
    if (row.dataset.initialized) return;
    row.dataset.initialized = "1";

    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    const getPointerX = (event) => event.pageX ?? event.touches?.[0]?.pageX ?? 0;

    const onPointerDown = (event) => {
      if (event.target.closest("button, a")) return;
      isDragging = true;
      row.classList.add("is-dragging");
      startX = getPointerX(event);
      scrollStart = row.scrollLeft;
    };

    const onPointerMove = (event) => {
      if (!isDragging) return;
      event.preventDefault();
      const walk = (getPointerX(event) - startX) * 1.12;
      row.scrollLeft = scrollStart - walk;
      syncPortfolioRows(row, row.scrollLeft);
      updatePortfolioScrollState();
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      row.classList.remove("is-dragging");
      updatePortfolioScrollState();
    };

    row.addEventListener("mousedown", onPointerDown);
    row.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    row.addEventListener("touchstart", onPointerDown, { passive: true });
    row.addEventListener("touchmove", onPointerMove, { passive: false });
    row.addEventListener("touchend", onPointerUp, { passive: true });

    row.addEventListener("scroll", () => updatePortfolioScrollState(), { passive: true });
  });

  initPortfolioNavigation();
  updatePortfolioScrollState();
};

window.addEventListener("resize", () => updatePortfolioScrollState(), { passive: true });

/* ── Case study ── */
const closeProject = () => {
  document.body.classList.remove("is-project-open");
  caseStudyShell?.classList.remove("is-open");
  history.replaceState(null, "", window.location.pathname);
};

const openProject = (projectId, shouldScroll = true) => {
  const study = caseStudyShell?.querySelector(`[data-detail="${CSS.escape(projectId)}"]`);
  if (!study || !caseStudyShell) return;

  document.body.classList.add("is-project-open");
  caseStudyShell.classList.add("is-open");
  caseStudyShell.querySelectorAll(".case-study").forEach((s) => {
    s.classList.toggle("is-active", s === study);
  });

  if (shouldScroll) study.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#project-${projectId}`);

  study.querySelector(".case-gallery-row")?.scrollTo({ left: 0 });
  const gallerySection = study.querySelector(".case-gallery-section");
  if (gallerySection) updateCaseGalleryScroll(gallerySection);

  const work = getWorks().find((item) => item.id === projectId);
  if (work) applyCaseStudyAmbience(study, work);
};

caseStudyShell?.addEventListener("click", (event) => {
  if (event.target.closest("#caseClose")) {
    closeProject();
    return;
  }

  if (event.target.closest(".case-gallery-prev")) {
    scrollCaseGallery(event.target, -1);
    return;
  }

  if (event.target.closest(".case-gallery-next")) {
    scrollCaseGallery(event.target, 1);
  }
});

renderWorks();

window.addEventListener("storage", (event) => {
  if (event.key === window.SpiritWorks?.WORKS_KEY) renderWorks();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    document.querySelectorAll(".project-card").forEach((card) => {
      const cats = card.dataset.category.split(" ");
      card.classList.toggle("is-hidden", filter !== "all" && !cats.includes(filter));
    });
    updatePortfolioScrollState();
  });
});

portfolioShowcase?.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-project]");
  if (trigger) openProject(trigger.dataset.project);
});

document.querySelectorAll(".main-nav a, .footer-nav a, .brand, .to-top").forEach((link) => {
  link.addEventListener("click", () => closeProject());
});

const initialProject = window.location.hash.match(/^#project-(.+)$/)?.[1];
if (initialProject) setTimeout(() => openProject(initialProject, false), 800);

const initHeroLogoLightning = () => {
  const wrap = document.querySelector("#heroLogoWrap");
  if (!wrap || !window.matchMedia("(pointer: fine)").matches) return;

  const onPointerMove = (event) => {
    const rect = wrap.getBoundingClientRect();
    const pad = 48;
    const inside =
      event.clientX >= rect.left - pad &&
      event.clientX <= rect.right + pad &&
      event.clientY >= rect.top - pad &&
      event.clientY <= rect.bottom + pad;

    wrap.classList.toggle("is-cursor-over", inside);
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
};

initHeroLogoLightning();

/* ── Custom cursor follower ── */
const initCursorFollower = () => {
  if (!cursorFollower || !window.matchMedia("(pointer: fine)").matches) return;

  const mark = cursorFollower.querySelector(".cursor-follower-mark");
  const glow = cursorFollower.querySelector(".cursor-follower-glow");
  const interactiveSelector =
    "a, button, input, textarea, select, .magnetic, .project-card, .project-trigger, .social-icon, .filter-btn, .contact-method, .portfolio-nav";

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let scale = 1;
  let targetScale = 1;
  let visible = false;

  const render = () => {
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.35) {
      currentX = targetX;
      currentY = targetY;
    } else {
      const ease = Math.min(0.5, 0.14 + distance * 0.012);
      currentX += dx * ease;
      currentY += dy * ease;
    }

    scale += (targetScale - scale) * 0.2;

    cursorFollower.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${scale})`;

    if (mark) {
      mark.style.filter =
        targetScale > 1
          ? "drop-shadow(0 0 16px rgba(255, 255, 255, 0.45))"
          : "drop-shadow(0 0 8px rgba(255, 255, 255, 0.15))";
    }

    if (glow) {
      glow.style.opacity = targetScale > 1 ? "0.85" : "0";
    }

    requestAnimationFrame(render);
  };

  const onPointerMove = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;

    if (!visible) {
      currentX = targetX;
      currentY = targetY;
      visible = true;
      cursorFollower.classList.add("is-visible");
    }
  };

  const onPointerOver = (event) => {
    const isHover = Boolean(event.target.closest(interactiveSelector));
    targetScale = isHover ? 1.32 : 1;
    cursorFollower.classList.toggle("is-hover", isHover);
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => {
    visible = false;
    targetScale = 1;
    cursorFollower.classList.remove("is-visible", "is-hover");
  });

  requestAnimationFrame(render);
};

initCursorFollower();

/* ── Magnetic hover ── */
function initMagnetic() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  document.querySelectorAll(".magnetic").forEach((el) => {
    if (el.dataset.magneticInit) return;
    el.dataset.magneticInit = "1";

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}
initMagnetic();

/* ── Booking form ── */
const validateField = (field) => {
  const errorEl = field.closest(".form-field")?.querySelector(".field-error");
  let message = "";

  if (field.required && !field.value.trim()) {
    message = "This field is required.";
  } else if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
    message = "Enter a valid email address.";
  } else if (field.type === "tel" && field.required && field.value.trim().length < 6) {
    message = "Enter a valid phone number.";
  }

  field.classList.toggle("is-invalid", Boolean(message));
  if (errorEl) errorEl.textContent = message;
  return !message;
};

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  formSuccess.hidden = true;

  const fields = [...bookingForm.querySelectorAll("input, select, textarea")].filter(
    (f) => f.name && f.required
  );
  if (!fields.every(validateField)) return;

  window.SpiritWorks.addInquiry(Object.fromEntries(new FormData(bookingForm)));
  bookingForm.reset();
  formSuccess.hidden = false;
  bookingForm.querySelector('[type="submit"]').disabled = true;

  setTimeout(() => {
    formSuccess.hidden = true;
    bookingForm.querySelector('[type="submit"]').disabled = false;
  }, 6000);
});

bookingForm?.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.classList.contains("is-invalid")) validateField(field);
  });
});

observeReveals();
