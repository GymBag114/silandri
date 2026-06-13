<script setup lang="ts">
import { useData } from "vitepress";
import { VPButton, VPFeatures, VPImage } from "vitepress/theme";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";

type HeroImage =
  | string
  | {
    src?: string;
    alt?: string;
    [key: string]: unknown;
  };

type HeroAction = {
  text?: string;
  link?: string;
  theme?: string;
};

type HomeFeature = {
  title?: string;
  details?: string;
  [key: string]: unknown;
};

type HomeHero = {
  name?: string;
  text?: string;
  tagline?: string;
  image?: HeroImage;
  actions?: HeroAction[];
};

type SectionInfo = {
  code?: string;
  name?: string;
  label?: string;
};

type SectionKey = "hero" | "values" | "protocols" | "cta";

type HomeFrontmatter = {
  layout?: string;
  silHero?: HomeHero;
  silFeatures?: HomeFeature[];
  silSections?: Partial<Record<SectionKey, SectionInfo>>;
};

const DEFAULT_SECTIONS: Record<SectionKey, Required<SectionInfo>> = {
  hero: { code: "00", name: "CONVERGENCE", label: "收束" },
  values: { code: "01", name: "MANIFESTO", label: "宣言" },
  protocols: { code: "02", name: "DOCTRINE", label: "教义" },
  cta: { code: "03", name: "DEPLOY", label: "部署" }
};

const heroVisible = ref(false);
const { frontmatter } = useData();
const homeFrontmatter = computed(() => frontmatter.value as unknown as HomeFrontmatter);

const isHome = computed(() => homeFrontmatter.value.layout === "home");
const hero = computed<HomeHero>(() => homeFrontmatter.value.silHero ?? {});
const features = computed<HomeFeature[]>(() => homeFrontmatter.value.silFeatures ?? []);
const actions = computed<HeroAction[]>(() => hero.value.actions ?? []);
const heroTagline = computed(() => String(hero.value.tagline ?? ""));
const heroTaglineLead = computed(() => heroTagline.value.slice(0, 4));
const heroTaglineTail = computed(() => heroTagline.value.slice(4));

const sections = computed<Record<SectionKey, Required<SectionInfo>>>(() => {
  const provided = homeFrontmatter.value.silSections ?? {};
  const out = {} as Record<SectionKey, Required<SectionInfo>>;
  (Object.keys(DEFAULT_SECTIONS) as SectionKey[]).forEach((key) => {
    const base = DEFAULT_SECTIONS[key];
    const override = provided[key] ?? {};
    out[key] = {
      code: typeof override.code === "string" && override.code ? override.code : base.code,
      name: typeof override.name === "string" && override.name ? override.name : base.name,
      label: typeof override.label === "string" && override.label ? override.label : base.label
    };
  });
  return out;
});

const heroImage = computed(() => {
  const image = hero.value.image;
  if (image && typeof image === "object" && "src" in image) return image;
  if (typeof image === "string") return { src: image, alt: hero.value.name ?? "SILANDRI" };
  return { src: "/image/SILANDRI/logo-hero.webp", alt: hero.value.name ?? "SILANDRI" };
});

const valueWords = computed(() => {
  const titles = features.value
    .map((feature) => (typeof feature?.title === "string" ? feature.title : ""))
    .filter(Boolean)
    .slice(0, 3);

  return titles.length ? titles : ["团结", "平等", "秩序"];
});

const valueCards = computed(() => {
  const fallback: HomeFeature[] = [
    { title: "团结", details: "组织的整体利益高于个人利益" },
    { title: "平等", details: "地位对等、零排挤政策、试错容忍" },
    { title: "秩序", details: "严格执行标准化作业程序" }
  ];
  const source = features.value.length ? features.value : fallback;
  return source.slice(0, 3).map((item) => ({
    title: typeof item?.title === "string" ? item.title : "",
    details: typeof item?.details === "string" ? item.details : ""
  }));
});

const heroTitleText = computed(() => (hero.value.name ? String(hero.value.name) : "SILANDRI"));

const activeSection = ref<SectionKey>("hero");

// Sections painted on a forced-dark panel regardless of the color theme.
// While one is active the fixed anchor overlay must flip to light ink,
// otherwise dark theme text sits on a dark panel and disappears.
const DARK_SECTIONS: readonly SectionKey[] = ["values", "cta"];
const activeIsDark = computed(() => DARK_SECTIONS.includes(activeSection.value));

// Per-section entrance flags. A lightweight observer flips each true once, as
// the section nears the viewport, driving the staggered slam-in motion in CSS.
// Initialising all false keeps SSR output and the first client render identical.
const inView = reactive<Record<SectionKey, boolean>>({
  hero: false,
  values: false,
  protocols: false,
  cta: false
});

const heroRef = ref<HTMLElement | null>(null);
const valuesRef = ref<HTMLElement | null>(null);
const protocolsRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);

const sectionRefs: Record<SectionKey, ReturnType<typeof ref<HTMLElement | null>>> = {
  hero: heroRef,
  values: valuesRef,
  protocols: protocolsRef,
  cta: ctaRef
};

let viewportResizeHandler: (() => void) | null = null;
let sectionObserver: IntersectionObserver | null = null;
let entranceObserver: IntersectionObserver | null = null;

const setViewportHeightVar = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--sil-vh", `${vh}px`);
};

const scrollToSection = (key: SectionKey) => {
  const el = sectionRefs[key]?.value;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const sectionKeys = Object.keys(DEFAULT_SECTIONS) as SectionKey[];

onMounted(() => {
  if (!window.CSS?.supports("height", "100dvh")) {
    setViewportHeightVar();
    viewportResizeHandler = () => {
      setViewportHeightVar();
    };
    window.addEventListener("resize", viewportResizeHandler, { passive: true });
    window.addEventListener("orientationchange", viewportResizeHandler);
  }

  if (isHome.value) {
    void nextTick(() => {
      heroVisible.value = true;
    });

    if (typeof IntersectionObserver !== "undefined") {
      sectionObserver = new IntersectionObserver(
        (entries) => {
          const ordered = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const top = ordered[0];
          if (!top) return;
          const key = top.target.getAttribute("data-section") as SectionKey | null;
          if (key && key in sectionRefs) {
            activeSection.value = key;
          }
        },
        { threshold: [0.2, 0.4, 0.6, 0.8], rootMargin: "-30% 0% -30% 0%" }
      );

      sectionKeys.forEach((key) => {
        const el = sectionRefs[key]?.value;
        if (el) sectionObserver?.observe(el);
      });

      // Separate, friendlier observer purely for entrance animations: fire once
      // as a section nears view, then stop watching it.
      entranceObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const key = entry.target.getAttribute("data-section") as SectionKey | null;
            if (key && key in inView) {
              inView[key] = true;
              entranceObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -15% 0px" }
      );

      sectionKeys.forEach((key) => {
        const el = sectionRefs[key]?.value;
        if (el) entranceObserver?.observe(el);
      });
    } else {
      // No IntersectionObserver: reveal every section so nothing stays hidden.
      sectionKeys.forEach((key) => {
        inView[key] = true;
      });
    }
  }
});

onBeforeUnmount(() => {
  if (viewportResizeHandler) {
    window.removeEventListener("resize", viewportResizeHandler);
    window.removeEventListener("orientationchange", viewportResizeHandler);
    viewportResizeHandler = null;
  }
  sectionObserver?.disconnect();
  sectionObserver = null;
  entranceObserver?.disconnect();
  entranceObserver = null;
});
</script>

<template>
  <div v-if="isHome" class="SilandriHome" :class="{ 'is-ready': heroVisible, 'is-on-dark': activeIsDark }">
    <!-- Right-side section anchor index -->
    <nav class="SilandriHome-anchors" aria-label="章节锚点">
      <button
        v-for="key in sectionKeys"
        :key="key"
        type="button"
        class="SilandriHome-anchor"
        :class="{ 'is-active': activeSection === key }"
        :aria-label="`跳转至 ${sections[key].code} ${sections[key].name}`"
        @click="scrollToSection(key)"
      >
        <span class="SilandriHome-anchor-code">{{ sections[key].code }}</span>
        <span class="SilandriHome-anchor-dot" />
        <span class="SilandriHome-anchor-label">{{ sections[key].name }}</span>
      </button>
    </nav>

    <!-- HERO -->
    <section
      ref="heroRef"
      class="SilandriHome-hero"
      :class="{ 'is-in-view': inView.hero }"
      data-section="hero"
    >
      <div class="SilandriHome-bg" aria-hidden="true">
        <div class="SilandriHome-bg-disc sil-enter sil-enter--scale" style="--i: 1" />
        <div class="SilandriHome-bg-triangle" />
        <div class="SilandriHome-bg-block" />
        <div class="SilandriHome-bg-halftone" />
        <span class="SilandriHome-bg-number sil-enter sil-enter--scale" style="--i: 0">{{ sections.hero.code }}</span>
      </div>

      <div class="SilandriHome-ticker" aria-hidden="true">
        <div class="SilandriHome-ticker-track">
          <span class="SilandriHome-ticker-seq">SILANDRI&nbsp;//&nbsp;席兰德里&nbsp;//&nbsp;CROSS-PLATFORM&nbsp;//&nbsp;建设 · 竞技&nbsp;//&nbsp;</span>
          <span class="SilandriHome-ticker-seq">SILANDRI&nbsp;//&nbsp;席兰德里&nbsp;//&nbsp;CROSS-PLATFORM&nbsp;//&nbsp;建设 · 竞技&nbsp;//&nbsp;</span>
        </div>
      </div>

      <span class="SilandriHome-letter-mark" aria-hidden="true">S</span>

      <div class="SilandriHome-wordmark sil-reveal" :class="{ 'is-visible': heroVisible }">
        <div class="SilandriHome-hero-body">
          <div class="SilandriHome-emblem">
            <div class="SilandriHome-emblem-glow" />
            <div class="SilandriHome-emblem-halftone" aria-hidden="true" />
            <div class="SilandriHome-emblem-reticle" aria-hidden="true" />
            <span class="SilandriHome-emblem-bracket SilandriHome-emblem-bracket--tl" aria-hidden="true" />
            <span class="SilandriHome-emblem-bracket SilandriHome-emblem-bracket--tr" aria-hidden="true" />
            <span class="SilandriHome-emblem-bracket SilandriHome-emblem-bracket--bl" aria-hidden="true" />
            <span class="SilandriHome-emblem-bracket SilandriHome-emblem-bracket--br" aria-hidden="true" />
            <VPImage
              class="SilandriHome-emblem-image"
              :image="heroImage"
            />
          </div>
          <div class="SilandriHome-hero-copy">
            <div class="SilandriHome-hero-code" aria-hidden="true">
              <span>{{ `[ PROTOCOL.${sections.hero.code} ]` }}</span>
              <span class="SilandriHome-hero-code-dash">—</span>
              <span>{{ sections.hero.name }}</span>
            </div>
            <h1
              class="SilandriHome-title"
              :data-text="heroTitleText"
            >{{ heroTitleText }}</h1>
            <p v-if="hero.text" class="SilandriHome-subtitle">{{ String(hero.text) }}</p>
            <p v-if="heroTagline" class="SilandriHome-tagline" aria-hidden="true">
              <span class="SilandriHome-tagline-slash">//</span>
              <span class="SilandriHome-tagline-part">{{ heroTagline }}</span>
            </p>
          </div>
        </div>
      </div>

      <div class="SilandriHome-vertical-mark" aria-hidden="true">
        <span>SILANDRI · 席兰德里 · 2023 →</span>
      </div>

      <div class="SilandriHome-scroll">
        <span>SCROLL TO BEGIN</span>
        <i />
      </div>
    </section>

    <!-- VALUES -->
    <section
      ref="valuesRef"
      class="SilandriHome-values"
      :class="{ 'is-in-view': inView.values }"
      data-section="values"
    >
      <div class="SilandriHome-bg" aria-hidden="true">
        <span class="SilandriHome-bg-number SilandriHome-bg-number--values-left">{{ sections.values.code }}</span>
        <span class="SilandriHome-bg-number SilandriHome-bg-number--values-right">{{ sections.values.code }}</span>
        <div class="SilandriHome-bg-circle" />
        <div class="SilandriHome-bg-stripes" />
      </div>

      <div class="SilandriHome-values-inner">
        <div class="SilandriHome-kicker sil-enter">
          <span class="SilandriHome-kicker-bracket">//</span>
          <span>{{ sections.values.code }} · {{ sections.values.name }}</span>
          <span class="SilandriHome-kicker-bracket">·</span>
          <span>{{ sections.values.label }}</span>
          <span class="SilandriHome-kicker-bracket">//</span>
        </div>
        <div class="SilandriHome-values-title sil-enter">
          <span class="SilandriHome-values-line SilandriHome-values-line-break">
            <span class="SilandriHome-values-lead sil-scramble">{{ heroTaglineLead || valueWords[0] }}</span>
            <span class="SilandriHome-values-tail sil-scramble">{{ heroTaglineTail || valueWords.slice(1).join("") }}</span>
          </span>
        </div>

        <ul class="SilandriHome-values-cards">
          <li
            v-for="(card, i) in valueCards"
            :key="i"
            class="SilandriHome-values-card sil-enter"
            :style="{ '--i': i }"
          >
            <span class="SilandriHome-values-card-index">#{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="SilandriHome-values-card-title">{{ card.title }}</span>
            <span v-if="card.details" class="SilandriHome-values-card-desc">{{ card.details }}</span>
            <span class="SilandriHome-values-card-diag" aria-hidden="true" />
            <span class="SilandriHome-values-card-corner SilandriHome-values-card-corner--tl" aria-hidden="true" />
            <span class="SilandriHome-values-card-corner SilandriHome-values-card-corner--br" aria-hidden="true" />
          </li>
        </ul>

        <div class="SilandriHome-divider" />
        <div class="SilandriHome-values-actions">
          <VPButton
            v-for="action in actions.slice(0, 2)"
            :key="String(action.text ?? action.link)"
            :text="String(action.text ?? '')"
            :href="action.link"
            size="big"
            :theme="action.theme ?? 'brand'"
          />
          <template v-if="!actions.length">
            <VPButton text="阅读 Wiki" href="/guide/intro" size="big" theme="brand" />
            <VPButton text="成员页" href="/members" size="big" theme="alt" />
          </template>
        </div>
      </div>
    </section>

    <!-- PROTOCOLS -->
    <section
      ref="protocolsRef"
      class="SilandriHome-protocols"
      :class="{ 'is-in-view': inView.protocols }"
      data-section="protocols"
    >
      <div class="SilandriHome-bg" aria-hidden="true">
        <span class="SilandriHome-bg-number SilandriHome-bg-number--protocols">{{ sections.protocols.code }}</span>
        <div class="SilandriHome-bg-ring" />
        <div class="SilandriHome-bg-bar" />
      </div>

      <div class="SilandriHome-protocols-head">
        <div class="SilandriHome-protocols-head-main sil-enter">
          <div class="SilandriHome-protocols-code">
            <span>[ {{ sections.protocols.code }} · {{ sections.protocols.name }} ]</span>
          </div>
          <h2 class="SilandriHome-section-title sil-scramble">{{ sections.protocols.label }}</h2>
          <p class="SilandriHome-section-subtitle">Features // Doctrine</p>
        </div>
        <div class="SilandriHome-section-meta sil-enter" style="--i: 1">
          <span>VOL. 1.0</span>
          <span>PUBLIC RECORD</span>
        </div>
      </div>

      <VPFeatures v-if="features.length" class="SilandriHome-features" :features="features" />
    </section>

    <!-- CTA -->
    <section
      ref="ctaRef"
      class="SilandriHome-cta"
      :class="{ 'is-in-view': inView.cta }"
      data-section="cta"
    >
      <div class="SilandriHome-cta-target" />
      <div class="SilandriHome-bg" aria-hidden="true">
        <span class="SilandriHome-bg-number SilandriHome-bg-number--cta">{{ sections.cta.code }}</span>
        <span class="SilandriHome-cta-tick SilandriHome-cta-tick--n" />
        <span class="SilandriHome-cta-tick SilandriHome-cta-tick--s" />
        <span class="SilandriHome-cta-tick SilandriHome-cta-tick--e" />
        <span class="SilandriHome-cta-tick SilandriHome-cta-tick--w" />
        <div class="SilandriHome-cta-stripes" />
      </div>
      <div class="SilandriHome-cta-vertical" aria-hidden="true">
        <span>{{ sections.cta.code }} // {{ sections.cta.name }} // INITIATE</span>
      </div>

      <div class="SilandriHome-cta-inner">
        <h3 class="SilandriHome-cta-title SilandriHome-cta-title-break sil-enter">
          <span class="SilandriHome-cta-lead sil-scramble" data-shadow="ACCESS">ACCESS</span>
          <span class="SilandriHome-cta-tail sil-scramble" data-shadow="SILANDRI">SILANDRI</span>
        </h3>
        <p class="SilandriHome-cta-text sil-enter" style="--i: 1">查看组织章程、成员结构与后续建设记录</p>
        <div class="SilandriHome-cta-actions sil-enter" style="--i: 2">
          <span class="SilandriHome-cta-burst" aria-hidden="true">
            <span v-for="n in 8" :key="n" class="SilandriHome-cta-burst-ray" :style="{ '--r': `${(n - 1) * 45}deg` }" />
          </span>
          <VPButton
            class="SilandriHome-cta-button"
            text="立刻加入"
            href="/guide/intro#加入流程"
            size="big"
            theme="brand"
          />
        </div>
      </div>
    </section>
  </div>
</template>
