const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const nav = document.querySelector(".nav");
const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
const siteHeader = document.querySelector(".site-header");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
let navScrollLockUntil = 0;

function closeMobileMenu() {
  if (!siteHeader || !mobileMenuToggle) {
    return;
  }

  siteHeader.classList.remove("is-menu-open");
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  window.requestAnimationFrame(updateHeaderTheme);
}

if (siteHeader && mobileMenuToggle) {
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("is-menu-open");
    mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
    window.requestAnimationFrame(updateHeaderTheme);
  });

  document.addEventListener("click", (event) => {
    if (!siteHeader.classList.contains("is-menu-open") || siteHeader.contains(event.target) || mobileNav?.contains(event.target)) {
      return;
    }

    closeMobileMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
}

function updateHeaderTheme() {
  if (!siteHeader) {
    return;
  }

  const headerRect = siteHeader.getBoundingClientRect();
  const probeX = window.innerWidth / 2;
  const probeY = Math.min(window.innerHeight - 1, headerRect.bottom + 8);
  const stack = document.elementsFromPoint
    ? document.elementsFromPoint(probeX, probeY)
    : [document.elementFromPoint(probeX, probeY)].filter(Boolean);
  const isOverDarkFomo = stack.some((element) => !siteHeader.contains(element) && !mobileNav?.contains(element) && Boolean(element.closest(".fomo-banner")));
  const isOnLightSurface = !isOverDarkFomo && stack.some((element) => {
    if (siteHeader.contains(element) || mobileNav?.contains(element)) {
      return false;
    }

    return Boolean(element.closest(".light-surface"));
  });

  siteHeader.classList.toggle("is-on-light", isOnLightSurface);
  mobileNav?.classList.toggle("is-on-light", isOnLightSurface);
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
  if (performance.now() < navScrollLockUntil) {
    return;
  }

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

  const activationLine = window.innerHeight * 0.45;
  const activeLink = navLinks
    .map((link) => {
      const section = document.querySelector(link.getAttribute("href"));

      if (!section) {
        return null;
      }

      const rect = section.getBoundingClientRect();

      if (rect.top > activationLine || rect.bottom < 120) {
        return null;
      }

      return { link, distance: Math.abs(rect.top - activationLine) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)[0]?.link;

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
    closeMobileMenu();

    if (link.dataset.swipeTriggered === "true") {
      event.preventDefault();
      link.dataset.swipeTriggered = "false";
      return;
    }

    const target = document.querySelector(link.getAttribute("href"));
    const targetNavLink = navLinks.includes(link)
      ? link
      : navLinks.find((item) => item.getAttribute("href") === link.getAttribute("href"));

    if (target && targetNavLink) {
      navScrollLockUntil = performance.now() + (prefersReducedMotion ? 0 : 760);
      moveNavIndicator(targetNavLink);
    }

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });

    if (targetNavLink) {
      window.setTimeout(() => {
        moveNavIndicator(targetNavLink);
        navScrollLockUntil = 0;
      }, prefersReducedMotion ? 0 : 760);
    }
  });
});

const swipeAccessButton = document.querySelector(".access-button");

if (swipeAccessButton) {
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeActive = false;
  let swipeMoved = false;
  let suppressNextClick = false;
  let swipeOffset = 0;
  let swipeMax = 136;

  function getSwipeMax() {
    const buttonWidth = swipeAccessButton.offsetWidth;
    const orbWidth = swipeAccessButton.querySelector(".access-button-orb")?.offsetWidth || 50;
    return Math.max(92, buttonWidth - orbWidth - 12);
  }

  function goToAccessTarget() {
    const target = document.querySelector(swipeAccessButton.getAttribute("href"));

    if (!target) {
      return;
    }

    swipeAccessButton.dataset.swipeTriggered = "true";
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

    function resetSwipe() {
      swipeOffset = 0;
      swipeAccessButton.style.setProperty("--swipe-x", "0px");
      swipeAccessButton.style.setProperty("--swipe-progress", "0");
      swipeAccessButton.style.setProperty("--swipe-label-x", "0px");
      swipeAccessButton.classList.remove("is-swiping");
    }

    function updateSwipeVisuals(offset) {
      const progress = Math.min(offset / swipeMax, 1);
      swipeAccessButton.style.setProperty("--swipe-x", `${offset}px`);
      swipeAccessButton.style.setProperty("--swipe-progress", progress.toFixed(3));
      swipeAccessButton.style.setProperty("--swipe-label-x", `${Math.round(progress * 14)}px`);
    }

  swipeAccessButton.addEventListener("pointerdown", (event) => {
    if (event.button && event.button !== 0) {
      return;
    }

    event.preventDefault();
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    swipeActive = true;
    swipeMoved = false;
    swipeOffset = 0;
    swipeMax = getSwipeMax();

    try {
      swipeAccessButton.setPointerCapture?.(event.pointerId);
    } catch {
      // Some browsers can reject capture on anchor elements; dragging still works without it.
    }

    swipeAccessButton.classList.add("is-swiping");
  });

  swipeAccessButton.addEventListener("pointermove", (event) => {
    if (!swipeActive) {
      return;
    }

    const deltaX = Math.max(0, event.clientX - swipeStartX);
    const deltaY = Math.abs(event.clientY - swipeStartY);

    if (deltaY > 90 && deltaX < 12) {
      swipeActive = false;
      resetSwipe();
      return;
    }

    if (deltaX > 0) {
        event.preventDefault();
        swipeMoved = deltaX > 4;
        suppressNextClick = swipeMoved;
        swipeOffset = Math.min(deltaX, swipeMax);
        updateSwipeVisuals(swipeOffset);
      }
    });

  swipeAccessButton.addEventListener("pointerup", (event) => {
    if (!swipeActive) {
      return;
    }

    swipeActive = false;

    if (swipeMoved) {
      event.preventDefault();
    }

    if (swipeOffset >= swipeMax * 0.72) {
      updateSwipeVisuals(swipeMax);
      goToAccessTarget();
      window.setTimeout(resetSwipe, prefersReducedMotion ? 0 : 420);
      return;
    }

    if (!swipeMoved) {
      goToAccessTarget();
    }

    resetSwipe();
  });

  ["pointercancel"].forEach((eventName) => {
    swipeAccessButton.addEventListener(eventName, () => {
      swipeActive = false;
      resetSwipe();
    });
  });

  swipeAccessButton.addEventListener("click", (event) => {
    if (suppressNextClick) {
      event.preventDefault();
      suppressNextClick = false;
      swipeMoved = false;
    }
  }, true);

  swipeAccessButton.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
}

window.addEventListener("load", () => {
  document.body.classList.add("is-loaded");

  document.querySelectorAll(".top-stats strong").forEach((stat, index) => {
    animateCounter(stat, 220 + index * 140);
  });

  updateNavForScroll();
  updateHeaderTheme();
});

window.addEventListener("resize", () => {
  const activeLink = navLinks.find((link) => link.classList.contains("is-active"));

  if (activeLink) {
    moveNavIndicator(activeLink);
  }

  updateHeaderTheme();
});

window.addEventListener("scroll", () => {
  updateNavForScroll();
  updateHeaderTheme();
}, { passive: true });

const insideSection = document.querySelector("#inside");
const audienceSection = document.querySelector("#audience");
const accessSection = document.querySelector("#access");
const proPlan = document.querySelector("[data-pro-plan]");
const riskPanel = insideSection?.querySelector(".risk-panel");

const proPlanOptions = {
  quarter: {
    title: "Полный доступ на 90 дней",
    oldPrice: "$50",
    copy: "Пробный период 2 дня. Тот же полный доступ, но на более долгий срок.",
    benefit: "Выгоднее, чем три месяца отдельно",
    button: "Выбрать 3 месяца",
  },
  year: {
    title: "Полный доступ на год",
    oldPrice: "$150",
    copy: "Пробный период 2 дня. Максимальный срок доступа ко всем текущим и новым отчётам.",
    benefit: "Экономия до 38%",
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
    proPlan.querySelector("[data-pro-old-price]").textContent = option.oldPrice;
    proPlan.querySelector("[data-pro-copy]").textContent = option.copy;
    proPlan.querySelector("[data-pro-benefit]").textContent = option.benefit;
    proPlan.querySelector("[data-pro-button-label]").textContent = option.button;
  });
});

const isMobileReveal = window.matchMedia("(max-width: 860px)").matches;

document.querySelectorAll(".audience-section, .fomo-section, #inside, .win-block--format, .strategy-section, .plans-section, .faq-section").forEach((section) => {
  const sectionRevealObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      if (section === insideSection) {
        insideSection.querySelectorAll(".inside-background-chart").forEach((backgroundChart) => {
          if (!backgroundChart.getAttribute("src")) {
            backgroundChart.src = backgroundChart.dataset.src;
          }
        });
      }

      section.classList.add("is-visible");
      sectionRevealObserver.disconnect();
    },
    isMobileReveal
      ? { rootMargin: "0px 0px 22% 0px", threshold: 0.02 }
      : { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  sectionRevealObserver.observe(section);
});

if (isMobileReveal) {
  document.querySelectorAll(".audience-card, #inside .inside-copy, #inside .analytics-copy, #inside .analytics-board, .win-block--format .format-layout, .access-kicker, .access-copy h2, .access-copy > p").forEach((item) => {
    const mobileRevealObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        item.classList.add("is-mobile-visible");
        mobileRevealObserver.disconnect();
      },
      { rootMargin: "0px 0px 34% 0px", threshold: 0.02 },
    );

    mobileRevealObserver.observe(item);
  });
}

if (riskPanel) {
  const riskRevealObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      riskPanel.classList.add("is-visible");
      riskRevealObserver.disconnect();
    },
    isMobileReveal
      ? { rootMargin: "0px 0px -8% 0px", threshold: 0.28 }
      : { rootMargin: "0px 0px -18% 0px", threshold: 0.38 },
  );

  riskRevealObserver.observe(riskPanel);
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

document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) {
      return;
    }

    document.querySelectorAll(".faq-item[open]").forEach((openedItem) => {
      if (openedItem !== item) {
        openedItem.open = false;
      }
    });
  });
});

const fomoBanner = document.querySelector(".fomo-banner");
const fomoScene = fomoBanner?.querySelector(".fomo-scene");

if (fomoBanner && fomoScene) {
  const resizeFomoScene = () => {
    fomoBanner.style.setProperty("--fomo-scene-scale", String(fomoBanner.clientWidth / 390));
  };

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeFomoScene).observe(fomoBanner);
  } else {
    window.addEventListener("resize", resizeFomoScene);
  }

  resizeFomoScene();
}
