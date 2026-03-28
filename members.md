---
layout: page
sidebar: false
---
<script setup lang="ts">
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers,
  VPTeamPageSection
} from 'vitepress/theme'

const coreMembers = [
  {
    avatar: '/image/members/jiesendesi.webp',
    name: '杰森德斯',
    title: '创始人',
    links: [
      { icon: 'googlehome', link: 'https://jiesendesi.github.io/my-react-app/' }
    ],
    sponsor: 'https://ifdian.net/a/Suzuha0326_/plan',
    actionText: '加入功劳簿',
  },
  {
    avatar: '/image/members/gymbag.webp',
    name: 'GymBag',
    title: '走后门进来的',
    sponsor: 'https://ifdian.net/a/xuanxuan1221/plan',
    actionText: '我很可爱，请给我钱',
  }
]

const partners = [
  {
    avatar: '/image/members/CSTF.webp',
    name: 'C.S.T.F.',
    title: '技术支援',
  },
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      Our Members
    </template>
    <template #lead>
      以下成员在SILANDRI中发挥着至关重要的作用。
    </template>
  </VPTeamPageTitle>

  <VPTeamMembers size="medium" :members="coreMembers" />

  <VPTeamPageSection>
    <template #title>Partners</template>
    <template #lead>以下合作伙伴为SILANDRI的建设做出了不可磨灭的贡献。</template>
    <template #members>
      <VPTeamMembers size="medium" :members="partners" />
    </template>
  </VPTeamPageSection>
</VPTeamPage>
