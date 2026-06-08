<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import TopBar from '@/components/layout/TopBar.vue'
import SgChallengeCard from '@/components/game/SgChallengeCard.vue'
import SgAchievementBadge from '@/components/game/SgAchievementBadge.vue'
import SgIcon from '@/components/SgIcon.vue'

const game = useGameStore()
</script>

<template>
  <div class="screen">
    <TopBar title="Výzvy" :subtitle="`${game.dailyDoneCount}/${game.challenges.length} denních splněno`" />

    <div class="screen__scroll">
      <div class="banner">
        <div class="banner__icon"><SgIcon name="calendar-clock" :size="22" /></div>
        <div class="banner__body">
          <div class="banner__title">Denní výzvy</div>
          <div class="banner__sub">Obnoví se za 6 h 12 min</div>
        </div>
        <div class="banner__reward">
          <div class="banner__amount">+{{ game.dailyXpAvailable }}</div>
          <div class="banner__caption">XP k získání</div>
        </div>
      </div>

      <span class="eyebrow screen__eyebrow">Dnešní úkoly</span>
      <div class="quests">
        <SgChallengeCard
          v-for="(c, i) in game.challenges"
          :key="i"
          :title="c.title"
          :icon="c.icon"
          :color="c.cat ? game.cats[c.cat].color : 'var(--brand)'"
          :value="c.value"
          :max="c.max"
          :reward="c.reward"
          :done="c.done"
        />
      </div>

      <div class="screen__sectionhead">
        <span class="eyebrow">Achievementy</span>
        <span class="screen__count">{{ game.unlockedAchievements }}/{{ game.achievements.length }}</span>
      </div>
      <div class="achievements">
        <SgAchievementBadge
          v-for="(a, i) in game.achievements"
          :key="i"
          :title="a.title"
          :description="a.desc"
          :icon="a.icon"
          :tier="a.tier"
          :unlocked="a.unlocked"
          :value="a.value"
          :max="a.max"
          :size="64"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.screen { position: absolute; inset: 0; display: flex; flex-direction: column; }
.screen__scroll { flex: 1; overflow-y: auto; padding: 14px 16px 90px; }
.screen__eyebrow { display: block; margin-bottom: 10px; }
.screen__sectionhead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
.screen__count { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }

.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-night);
  color: var(--text-on-night);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  margin-bottom: 18px;
}
.banner__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: rgba(245, 163, 0, 0.18);
  color: var(--gold-300);
  @include flex-center;
  flex: none;
}
.banner__body { flex: 1; }
.banner__title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 15px; }
.banner__sub { font-size: 12px; color: var(--text-on-night-muted); }
.banner__reward { text-align: right; }
.banner__amount { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 20px; color: var(--gold-300); }
.banner__caption { font-family: var(--font-mono); font-size: 10px; color: var(--text-on-night-muted); }

.quests { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }

.achievements {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px 8px;
  @include soft-card;
  padding: 20px 12px;
}
</style>
