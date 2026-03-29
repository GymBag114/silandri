---
layout: page
title: 成员
description: 通过本网页浏览 SILANDRI（席兰德里）的核心成员、合作伙伴与当前公开成员结构。
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
    ]
  },
  {
    avatar: '/image/members/gymbag.webp',
    name: 'GymBag',
    title: '走后门进来的',
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
