<script setup lang="ts">
import { inBrowser } from "vitepress";
import { onBeforeUnmount, onMounted, ref } from "vue";

const cursorRef = ref<HTMLElement | null>(null);
const shouldUseCustomCursor = ref(false);
const hovered = ref(false);
const isVisible = ref(false);

const mousePos = { x: -100, y: -100 };
const currentPos = { x: -100, y: -100 };
const scaleState = { current: 1, target: 1 };
const restingPos = { x: -100, y: -100 };

let rafId = 0;
let isAnimating = false;

type NavigatorWithHints = Navigator & {
  connection?: {
    saveData?: boolean;
  };
  deviceMemory?: number;
};

const shouldEnableCustomCursor = () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const userAgent = navigator.userAgent;
  // 给你Safari大爷看的
  const isSafari =
    /Safari\//.test(userAgent) &&
    !/Chrome\//.test(userAgent) &&
    !/Chromium\//.test(userAgent) &&
    !/Edg\//.test(userAgent) &&
    !/OPR\//.test(userAgent) &&
    !/CriOS\//.test(userAgent) &&
    !/FxiOS\//.test(userAgent);

  if (reducedMotion || coarsePointer || isSafari) {
    return false;
  }

  const navigatorWithHints = navigator as NavigatorWithHints;
  const saveData = navigatorWithHints.connection?.saveData === true;
  const lowMemory =
    typeof navigatorWithHints.deviceMemory === "number" && navigatorWithHints.deviceMemory <= 4;
  const lowThreads =
    typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const veryHighDpr = window.devicePixelRatio >= 2.5;

  if (saveData || lowMemory || lowThreads || veryHighDpr) {
    return false;
  }

  return true;
};

const isInteractiveTarget = (target: EventTarget | null) => {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) return false;

  const directInteractiveTarget = element.closest(
    [
      "a",
      "button",
      "summary",
      "label",
      "input",
      "textarea",
      "select",
      "[data-cursor='hover']",
      ".clickable",
      ".VPButton",
      ".VPLink",
      ".DocSearch-Button",
      ".DocSearch-Form",
      ".DocSearch-Hit a"
    ].join(",")
  );

  if (directInteractiveTarget) {
    return true;
  }

  const semanticButtonTarget = element.closest("[role='button']");
  if (!semanticButtonTarget) {
    return false;
  }

  if (
    semanticButtonTarget.closest(
      [
        "#local-search",
        ".DocSearch-Container",
        ".DocSearch-Modal",
        ".DocSearch-Dropdown",
        ".DocSearch-Hits"
      ].join(",")
    )
  ) {
    return false;
  }

  return semanticButtonTarget.matches(
    [
      ".VPSidebarItem > .item",
      ".VPSidebarItem .caret",
      ".VPSwitch",
      ".VPFlyout > .button",
      ".VPNavBarHamburger",
      ".VPLocalNav .menu"
    ].join(",")
  );
};

const updateCursorTransform = () => {
  if (!cursorRef.value) return;

  cursorRef.value.style.transform = `translate3d(${currentPos.x}px, ${currentPos.y}px, 0) translate(-50%, -50%) scale(${scaleState.current})`;
};

const stopAnimation = () => {
  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  isAnimating = false;
};

const animate = () => {
  const ease = 0.2;
  const scaleEase = 0.22;
  currentPos.x += (mousePos.x - currentPos.x) * ease;
  currentPos.y += (mousePos.y - currentPos.y) * ease;
  scaleState.current += (scaleState.target - scaleState.current) * scaleEase;

  updateCursorTransform();

  const isPositionSettled =
    Math.abs(mousePos.x - currentPos.x) < 0.1 &&
    Math.abs(mousePos.y - currentPos.y) < 0.1;
  const isScaleSettled = Math.abs(scaleState.target - scaleState.current) < 0.01;

  if (isPositionSettled && isScaleSettled) {
    currentPos.x = mousePos.x;
    currentPos.y = mousePos.y;
    scaleState.current = scaleState.target;
    updateCursorTransform();
    stopAnimation();
    return;
  }

  rafId = window.requestAnimationFrame(animate);
};

const startAnimation = () => {
  if (isAnimating || document.visibilityState === "hidden") return;

  isAnimating = true;
  rafId = window.requestAnimationFrame(animate);
};

const onPointerMove = (event: PointerEvent) => {
  mousePos.x = event.clientX;
  mousePos.y = event.clientY;
  isVisible.value = true;
  startAnimation();
};

const onPointerOver = (event: PointerEvent) => {
  hovered.value = isInteractiveTarget(event.target);
};

const onPointerOut = (event: PointerEvent) => {
  const nextTarget = event.relatedTarget;
  hovered.value = isInteractiveTarget(nextTarget);
};

const onPointerDown = () => {
  scaleState.target = 0.8;
  startAnimation();
};

const onPointerUp = () => {
  scaleState.target = 1;
  startAnimation();
};

const onWindowBlur = () => {
  hovered.value = false;
  isVisible.value = false;
  onPointerUp();
};

const onPointerLeave = () => {
  hovered.value = false;
  isVisible.value = false;
  mousePos.x = restingPos.x;
  mousePos.y = restingPos.y;
  scaleState.target = 1;
  startAnimation();
};

const onVisibilityChange = () => {
  if (document.visibilityState === "hidden") {
    hovered.value = false;
    isVisible.value = false;
    stopAnimation();
    return;
  }

  startAnimation();
};

onMounted(() => {
  if (!inBrowser) return;

  shouldUseCustomCursor.value = shouldEnableCustomCursor();
  if (!shouldUseCustomCursor.value) return;

  document.documentElement.classList.add("sil-cursor-active");

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerover", onPointerOver, { passive: true });
  window.addEventListener("pointerout", onPointerOut, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("blur", onWindowBlur);
  document.addEventListener("visibilitychange", onVisibilityChange);

  updateCursorTransform();
});

onBeforeUnmount(() => {
  if (!inBrowser || !shouldUseCustomCursor.value) return;

  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerover", onPointerOver);
  window.removeEventListener("pointerout", onPointerOut);
  window.removeEventListener("pointerdown", onPointerDown);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  window.removeEventListener("pointerleave", onPointerLeave);
  window.removeEventListener("blur", onWindowBlur);
  document.removeEventListener("visibilitychange", onVisibilityChange);

  stopAnimation();

  document.documentElement.classList.remove("sil-cursor-active");
});
</script>

<template>
  <div
    v-if="shouldUseCustomCursor"
    ref="cursorRef"
    class="SilCursor"
    :class="{ 'is-hovered': hovered, 'is-visible': isVisible }"
    aria-hidden="true"
  >
    <div class="SilCursor-box">
      <span class="SilCursor-edge is-top" />
      <span class="SilCursor-edge is-right" />
      <span class="SilCursor-edge is-bottom" />
      <span class="SilCursor-edge is-left" />
      <span class="SilCursor-cross is-h" />
      <span class="SilCursor-cross is-v" />
    </div>
  </div>
</template>

<style scoped>
.SilCursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;
  mix-blend-mode: difference;
  color: #ff5f00;
  opacity: 0;
  transform: translate3d(-100px, -100px, 0);
  visibility: hidden;
  will-change: transform;
  transition:
    opacity 0.12s ease,
    visibility 0.12s ease;
}

.SilCursor.is-visible {
  opacity: 1;
  visibility: visible;
}

.SilCursor-box {
  position: relative;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(0deg);
  transition:
    width 0.3s ease,
    height 0.3s ease,
    transform 0.3s ease,
    opacity 0.3s ease;
}

.SilCursor.is-hovered .SilCursor-box {
  width: 48px;
  height: 48px;
  transform: rotate(45deg);
}

.SilCursor-edge {
  position: absolute;
  background: #fff;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.SilCursor-edge.is-top,
.SilCursor-edge.is-bottom {
  left: 0;
  width: 100%;
  height: 1px;
}

.SilCursor-edge.is-top {
  top: 0;
}

.SilCursor-edge.is-bottom {
  bottom: 0;
}

.SilCursor-edge.is-left,
.SilCursor-edge.is-right {
  top: 0;
  width: 1px;
  height: 100%;
}

.SilCursor-edge.is-left {
  left: 0;
}

.SilCursor-edge.is-right {
  right: 0;
}

.SilCursor.is-hovered .SilCursor-edge {
  opacity: 1;
}

.SilCursor-cross {
  position: absolute;
  background: #fff;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.SilCursor-cross.is-h {
  width: 100%;
  height: 2px;
}

.SilCursor-cross.is-v {
  width: 2px;
  height: 100%;
}

.SilCursor.is-hovered .SilCursor-cross {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .SilCursor-box,
  .SilCursor-edge,
  .SilCursor-cross {
    transition: none !important;
  }
}
</style>
