import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import ScrambleHeroTitle from "./ScrambleHeroTitle";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return [h(DefaultTheme.Layout), h(ScrambleHeroTitle)];
  }
};
