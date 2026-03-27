<script setup lang="ts">
import { useData } from "vitepress";
import { VPButton, VPFeatures, VPImage } from "vitepress/theme";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

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
  [key: string]: unknown;
};

type HomeHero = {
  name?: string;
  text?: string;
  tagline?: string;
  image?: HeroImage;
  actions?: HeroAction[];
};

type HomeFrontmatter = {
  layout?: string;
  hero?: HomeHero;
  features?: HomeFeature[];
};

const heroVisible = ref(false);
const { frontmatter } = useData();
const homeFrontmatter = computed(() => frontmatter.value as unknown as HomeFrontmatter);

const isHome = computed(() => homeFrontmatter.value.layout === "home");
const hero = computed<HomeHero>(() => homeFrontmatter.value.hero ?? {});
const features = computed<HomeFeature[]>(() => homeFrontmatter.value.features ?? []);
const actions = computed<HeroAction[]>(() => hero.value.actions ?? []);
const heroTagline = computed(() => String(hero.value.tagline ?? ""));
const heroTaglineLead = computed(() => heroTagline.value.slice(0, 4));
const heroTaglineTail = computed(() => heroTagline.value.slice(4));

const heroImage = computed(() => {
  const image = hero.value.image;
  if (image && typeof image === "object" && "src" in image) return image;
  if (typeof image === "string") return { src: image, alt: hero.value.name ?? "SILANDRI" };
  return { src: "/image/SILANDRI/SILANDRI.png", alt: hero.value.name ?? "SILANDRI" };
});

const valueWords = computed(() => {
  const titles = features.value
    .map((feature) => (typeof feature?.title === "string" ? feature.title : ""))
    .filter(Boolean)
    .slice(0, 3);

  return titles.length ? titles : ["团结", "平等", "秩序"];
});

let viewportResizeHandler: (() => void) | null = null;

const setViewportHeightVar = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--sil-vh", `${vh}px`);
};

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
  }
});

onBeforeUnmount(() => {
  if (viewportResizeHandler) {
    window.removeEventListener("resize", viewportResizeHandler);
    window.removeEventListener("orientationchange", viewportResizeHandler);
    viewportResizeHandler = null;
  }
});
</script>

<template>
  <div v-if="isHome" class="SilandriHome">
    <section class="SilandriHome-hero">
      <div class="SilandriHome-wordmark sil-reveal" :class="{ 'is-visible': heroVisible }">
        <div class="SilandriHome-hero-body">
          <div class="SilandriHome-emblem">
            <div class="SilandriHome-emblem-glow" />
            <VPImage
              class="SilandriHome-emblem-image"
              :image="heroImage"
            />
          </div>
          <div class="SilandriHome-hero-copy">
            <h1 class="SilandriHome-title">{{ hero.name ? String(hero.name) : "SILANDRI" }}</h1>
            <p v-if="hero.text" class="SilandriHome-subtitle">{{ String(hero.text) }}</p>
          </div>
        </div>
      </div>
      <div class="SilandriHome-scroll">
        <span>SCROLL TO BEGIN</span>
        <i />
      </div>
    </section>

    <section class="SilandriHome-values">
      <div class="SilandriHome-noise" />
      <div class="SilandriHome-values-inner">
        <div class="SilandriHome-kicker">// Core Values //</div>
        <div class="SilandriHome-values-title">
          <span class="SilandriHome-values-line SilandriHome-values-line-break">
            <span class="SilandriHome-values-lead sil-scramble">{{ heroTaglineLead || valueWords[0] }}</span>
            <span class="SilandriHome-values-tail sil-scramble">{{ heroTaglineTail || valueWords.slice(1).join("") }}</span>
          </span>
        </div>
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

    <section class="SilandriHome-protocols">
      <div class="SilandriHome-protocols-head">
        <div>
          <h2 class="SilandriHome-section-title sil-scramble">誓约</h2>
          <p class="SilandriHome-section-subtitle">Features</p>
        </div>
        <div class="SilandriHome-section-meta">
          VOL. 1.0
          <br />
          PUBLIC RECORD
        </div>
      </div>

      <VPFeatures v-if="features.length" class="SilandriHome-features" :features="features" />
    </section>

    <section class="SilandriHome-cta">
      <div class="SilandriHome-cta-target" />
      <div class="SilandriHome-cta-inner">
        <h3 class="SilandriHome-cta-title SilandriHome-cta-title-break">
          <span class="SilandriHome-cta-lead sil-scramble">ACCESS</span>
          <span class="SilandriHome-cta-tail sil-scramble">SILANDRI</span>
        </h3>
        <p class="SilandriHome-cta-text">查看组织章程、成员结构与后续建设记录</p>
        <div class="SilandriHome-cta-actions">
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
