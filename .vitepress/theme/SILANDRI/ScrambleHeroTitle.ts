import { inBrowser, useRoute } from "vitepress";
import { defineComponent, nextTick, onBeforeUnmount, onMounted, watch } from "vue";

const SCRAMBLE_CHARS = "{}?+{^*<>[]!~";
const TARGETS = [".VPHomeHero .name", ".VPTeamPageTitle .title"] as const;

export default defineComponent({
  name: "ScrambleHeroTitle",
  setup() {
    const route = useRoute();
    let observers: IntersectionObserver[] = [];
    let startTimeout: number | null = null;
    let intervalId: number | null = null;

    const clearTimers = () => {
      if (startTimeout !== null) {
        window.clearTimeout(startTimeout);
        startTimeout = null;
      }

      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const cleanup = () => {
      clearTimers();
      observers.forEach((observer) => observer.disconnect());
      observers = [];
    };

    const runScramble = (element: HTMLElement) => {
      const original = (element.getAttribute("data-scramble-original") ?? element.textContent ?? "").trim();
      if (!original) return;

      element.setAttribute("data-scramble-original", original);
      clearTimers();

      let iteration = 0;
      startTimeout = window.setTimeout(() => {
        intervalId = window.setInterval(() => {
          const nextText = original
            .split("")
            .map((letter, index) => {
              if (index < iteration) return original[index];
              if (letter === " ") return " ";
              return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            })
            .join("");

          element.textContent = nextText;

          if (iteration >= original.length) {
            clearTimers();
            element.textContent = original;
          }

          iteration += 1 / 3;
        }, 40);
      }, 80);
    };

    const setupObserver = () => {
      if (!inBrowser) return;

      cleanup();
      TARGETS.forEach((selector) => {
        const titleEl = document.querySelector<HTMLElement>(selector);
        if (!titleEl) return;

        const playedOnPath = titleEl.getAttribute("data-scramble-played-path");
        if (playedOnPath === route.path) return;

        const observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (!entry?.isIntersecting) return;
            titleEl.setAttribute("data-scramble-played-path", route.path);
            runScramble(titleEl);
            observer.disconnect();
          },
          { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
        );

        observer.observe(titleEl);
        observers.push(observer);
      });
    };

    onMounted(() => {
      void nextTick(setupObserver);
    });

    watch(
      () => route.path,
      () => {
        void nextTick(setupObserver);
      }
    );

    onBeforeUnmount(() => {
      cleanup();
    });

    return () => null;
  }
});
