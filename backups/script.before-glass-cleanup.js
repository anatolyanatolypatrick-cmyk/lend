const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const nav = document.querySelector(".nav");
const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
const siteHeader = document.querySelector(".site-header");

function updateHeaderTheme() {
  if (!siteHeader) {
    return;
  }

  const headerRect = siteHeader.getBoundingClientRect();
  const underHeader = document.elementFromPoint(window.innerWidth / 2, Math.min(window.innerHeight - 1, headerRect.bottom + 8));
  const isOnLightSurface = Boolean(underHeader?.closest(".light-surface"));

  siteHeader.classList.toggle("is-on-light", isOnLightSurface);
}

function moveNavIndicator(link) {
  if (!nav || !link) {
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();

  nav.style.setProperty("--nav-x", `${linkRect.left - navRect.left - 12}px`);
  nav.style.setProperty("--nav-w", `${linkRect.width + 24}px`);
  nav.classList.add("has-indicator");

  navLinks.forEach((item) => item.classList.toggle("is-active", item === link));
}

function hideNavIndicator() {
  if (!nav) {
    return;
  }

  nav.classList.remove("has-indicator");
  navLinks.forEach((item) => item.classList.remove("is-active"));
}

function updateNavForScroll() {
  const insideTarget = document.querySelector("#inside");
  const methodTarget = document.querySelector("#method");
  const insideLink = navLinks.find((link) => link.getAttribute("href") === "#inside");

  if (insideTarget && methodTarget && insideLink) {
    const insideRect = insideTarget.getBoundingClientRect();
    const methodRect = methodTarget.getBoundingClientRect();

    if (insideRect.top <= window.innerHeight * 0.45 && methodRect.top > window.innerHeight * 0.45) {
      moveNavIndicator(insideLink);
      return;
    }
  }

  const activeLink = navLinks.find((link) => {
    const section = document.querySelector(link.getAttribute("href"));

    if (!section) {
      return false;
    }

    const rect = section.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.25;
  });

  if (activeLink) {
    moveNavIndicator(activeLink);
  } else {
    hideNavIndicator();
  }
}

function getCounterParts(text) {
  const match = text.trim().match(/^([^0-9]*)([0-9]+)(.*)$/);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    value: Number(match[2]),
    suffix: match[3],
  };
}

function animateCounter(element, delay) {
  const parts = getCounterParts(element.dataset.finalValue || element.textContent);

  if (!parts) {
    return;
  }

  element.dataset.finalValue = `${parts.prefix}${parts.value}${parts.suffix}`;

  if (prefersReducedMotion) {
    element.textContent = element.dataset.finalValue;
    return;
  }

  window.setTimeout(() => {
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(parts.value * eased);

      element.textContent = `${parts.prefix}${current}${parts.suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = element.dataset.finalValue;
      }
    }

    element.textContent = `${parts.prefix}0${parts.suffix}`;
    requestAnimationFrame(tick);
  }, delay);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (navLinks.includes(link)) {
      moveNavIndicator(link);
    }

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });

    window.setTimeout(() => moveNavIndicator(link), prefersReducedMotion ? 0 : 420);
  });
});

window.addEventListener("load", () => {
  document.body.classList.add("is-loaded");

  document.querySelectorAll(".top-stats strong").forEach((stat, index) => {
    animateCounter(stat, 220 + index * 140);
  });

  updateNavForScroll();
  updateHeaderTheme();
  updateMobileModuleFocus();
  updateMobileBriefFocus();
});

window.addEventListener("resize", () => {
  const activeLink = navLinks.find((link) => link.classList.contains("is-active"));

  if (activeLink) {
    moveNavIndicator(activeLink);
  }

  updateHeaderTheme();
  updateMobileModuleFocus();
  updateMobileBriefFocus();
});

window.addEventListener("scroll", () => {
  updateNavForScroll();
  updateHeaderTheme();
  updateMobileModuleFocus();
  updateMobileBriefFocus();
}, { passive: true });

const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (observedSections.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) {
        return;
      }

      const link = navLinks.find((item) => item.getAttribute("href") === `#${visible.target.id}`);

      moveNavIndicator(link);
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
  );

  observedSections.forEach((section) => observer.observe(section));
}

const insideSection = document.querySelector("#inside");
const audienceSection = document.querySelector("#audience");
const accessSection = document.querySelector("#access");
const proPlan = document.querySelector("[data-pro-plan]");
const moduleGrid = insideSection?.querySelector(".module-grid");
const moduleCards = moduleGrid ? Array.from(moduleGrid.querySelectorAll(".module-card")) : [];
const marketBriefGrid = document.querySelector(".market-brief-grid");
const marketBriefRows = marketBriefGrid ? Array.from(marketBriefGrid.querySelectorAll(".market-brief-row")) : [];
const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");

const proPlanOptions = {
  quarter: {
    title: "Полный доступ на 90 дней",
    price: "$50",
    copy: "Тот же полный доступ, но на более долгий срок.",
    benefit: "Выгоднее, чем три месяца отдельно",
    button: "Выбрать 3 месяца",
  },
  year: {
    title: "Полный доступ на год",
    price: "$150",
    copy: "Максимальный срок доступа ко всем текущим и новым отчётам.",
    benefit: "Экономия $90 относительно помесячной оплаты",
    button: "Выбрать год",
  },
};

proPlan?.querySelectorAll("[data-duration]").forEach((button) => {
  button.addEventListener("click", () => {
    const option = proPlanOptions[button.dataset.duration];

    if (!option) {
      return;
    }

    proPlan.querySelectorAll("[data-duration]").forEach((item) => item.classList.toggle("is-active", item === button));
    proPlan.querySelector("[data-pro-title]").textContent = option.title;
    proPlan.querySelector("[data-pro-price]").textContent = option.price;
    proPlan.querySelector("[data-pro-copy]").textContent = option.copy;
    proPlan.querySelector("[data-pro-benefit]").textContent = option.benefit;
    proPlan.querySelector("[data-pro-button]").textContent = option.button;
  });
});

function setFocusedModule(card) {
  if (!moduleCards.length) {
    return;
  }

  moduleGrid.classList.toggle("has-active-focus", Boolean(card));
  moduleCards.forEach((item) => item.classList.toggle("is-focused", item === card));
}

function updateMobileModuleFocus() {
  if (!coarsePointer.matches || !moduleCards.length) {
    return;
  }

  const viewportCenter = window.innerHeight / 2;
  const visibleCards = moduleCards.filter((card) => {
    const rect = card.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  });

  if (!visibleCards.length) {
    return;
  }

  const closestCard = visibleCards.reduce((closest, card) => {
    const closestRect = closest.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const closestDistance = Math.abs((closestRect.top + closestRect.bottom) / 2 - viewportCenter);
    const cardDistance = Math.abs((cardRect.top + cardRect.bottom) / 2 - viewportCenter);

    return cardDistance < closestDistance ? card : closest;
  });

  setFocusedModule(closestCard);
}

function setFocusedBriefRow(row) {
  if (!marketBriefRows.length) {
    return;
  }

  marketBriefRows.forEach((item) => item.classList.toggle("is-focused", item === row));
}

function updateMobileBriefFocus() {
  if (!coarsePointer.matches || !marketBriefRows.length) {
    return;
  }

  const viewportCenter = window.innerHeight / 2;
  const visibleRows = marketBriefRows.filter((row) => {
    const rect = row.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  });

  if (!visibleRows.length) {
    return;
  }

  const closestRow = visibleRows.reduce((closest, row) => {
    const closestRect = closest.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const closestDistance = Math.abs((closestRect.top + closestRect.bottom) / 2 - viewportCenter);
    const rowDistance = Math.abs((rowRect.top + rowRect.bottom) / 2 - viewportCenter);

    return rowDistance < closestDistance ? row : closest;
  });

  setFocusedBriefRow(closestRow);
}

if (moduleGrid && moduleCards.length) {
  moduleGrid.classList.add("has-focus-motion");

  moduleCards.forEach((card) => {
    card.addEventListener("pointerenter", () => {
      if (!coarsePointer.matches) {
        setFocusedModule(card);
      }
    });

    card.addEventListener("focusin", () => setFocusedModule(card));
  });

  moduleGrid.addEventListener("pointerleave", () => {
    if (!coarsePointer.matches) {
      setFocusedModule(null);
    }
  });
}

if (marketBriefGrid && marketBriefRows.length) {
  marketBriefGrid.classList.add("has-focus-motion");

  marketBriefRows.forEach((row) => {
    row.addEventListener("pointerenter", () => {
      if (!coarsePointer.matches) {
        setFocusedBriefRow(row);
      }
    });
  });

  marketBriefGrid.addEventListener("pointerleave", () => {
    if (!coarsePointer.matches) {
      setFocusedBriefRow(null);
    }
  });
}

if (audienceSection) {
  const audienceRevealObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      audienceSection.classList.add("is-visible");
      audienceRevealObserver.disconnect();
    },
    { rootMargin: "-8% 0px -14% 0px", threshold: 0.16 },
  );

  audienceRevealObserver.observe(audienceSection);
}

if (insideSection) {
  const insideRevealObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      insideSection.querySelectorAll(".inside-background-chart").forEach((backgroundChart) => {
        if (!backgroundChart.getAttribute("src")) {
          backgroundChart.src = backgroundChart.dataset.src;
        }
      });

      insideSection.classList.add("is-visible");
      insideRevealObserver.disconnect();
    },
    { rootMargin: "-12% 0px -18% 0px", threshold: 0.22 },
  );

  insideRevealObserver.observe(insideSection);
}

if (accessSection) {
  const accessRevealObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      accessSection.classList.add("is-visible");
      accessRevealObserver.disconnect();
    },
    { rootMargin: "-12% 0px -12% 0px", threshold: 0.18 },
  );

  accessRevealObserver.observe(accessSection);
}
