import DefaultTheme from "vitepress/theme";
import { Analytics } from "@vercel/analytics/vue";
import { SpeedInsights } from "@vercel/speed-insights/vue";
import { h } from "vue";
import HomePage from "./HomePage.vue";
import ScrambleHeroTitle from "./ScrambleHeroTitle";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h("div", [
      h(
        DefaultTheme.Layout,
        null,
        {
          "home-hero-before": () => h(HomePage)
        }
      ),
      h(ScrambleHeroTitle),
      h(SpeedInsights),
      h(Analytics)
    ]);
  }
};
