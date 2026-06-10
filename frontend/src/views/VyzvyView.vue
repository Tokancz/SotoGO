<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import TopBar from '@/components/layout/TopBar.vue'
import SgChallengeCard from '@/components/game/SgChallengeCard.vue'
import SgAchievementBadge from '@/components/game/SgAchievementBadge.vue'
import SgIcon from '@/components/SgIcon.vue'

const game = useGameStore()

// Live "obnoví se za…" countdown to the end of the current quest period.
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined

const resetLabel = computed(() => {
  if (!game.questsEndsAt) return ''
  const ms = new Date(game.questsEndsAt).getTime() - now.value
  if (ms <= 0) return 'Obnovuje se…'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `Obnoví se za ${h} h ${m} min` : `Obnoví se za ${m} min`
})

const claimingId = ref<string | null>(null)

async function onClaim(id: string) {
  if (claimingId.value) return
  claimingId.value = id
  try {
    await game.claimQuest(id)
  } catch (err) {
    console.error('Vyzvednutí odměny selhalo:', err)
  } finally {
    claimingId.value = null
  }
}

onMounted(() => {
  game.loadQuests()
  ticker = setInterval(() => {
    now.value = Date.now()
    // Period rolled over while the screen was open — pull the fresh set.
    if (game.questsEndsAt && now.value >= new Date(game.questsEndsAt).getTime()) {
      game.loadQuests()
    }
  }, 30_000)
})

onBeforeUnmount(() => clearInterval(ticker))
</script>

<template>
  <div class="screen">
    <TopBar title="Výzvy" :subtitle="`${game.dailyDoneCount}/${game.quests.length} denních splněno`" />

    <div class="screen__scroll">
      <div class="banner">
        <div class="banner__icon"><SgIcon name="calendar-clock" :size="22" /></div>
        <div class="banner__body">
          <div class="banner__title">Denní výzvy</div>
          <div class="banner__sub">{{ resetLabel }}</div>
        </div>
        <div class="banner__reward">
          <div class="banner__amount">+{{ game.dailyXpAvailable }}</div>
          <div class="banner__caption">XP k získání</div>
        </div>
      </div>

      <h2 class="eyebrow screen__eyebrow">Dnešní úkoly</h2>
      <p v-if="!game.quests.length" class="hint">Načítám výzvy…</p>
      <ul v-else class="quests">
        <li v-for="(q, i) in game.quests" :key="q.id" class="sg-rise" :style="{ '--sg-rise-delay': `${i * 55}ms` }">
          <SgChallengeCard
            :title="q.title"
            :icon="q.icon"
            :color="q.cat ? game.cats[q.cat].color : 'var(--brand)'"
            :value="q.value"
            :max="q.max"
            :reward="q.reward"
            :done="q.done"
            :claimed="q.claimed"
            claimable
            :claiming="claimingId === q.id"
            @claim="onClaim(q.id)"
          />
        </li>
      </ul>

      <div class="screen__sectionhead">
        <h2 class="eyebrow">Achievementy</h2>
        <span class="screen__count">{{ game.unlockedAchievements }}/{{ game.achievements.length }}</span>
      </div>
      <ul class="achievements">
        <li v-for="(a, i) in game.achievements" :key="i" class="sg-rise" :style="{ '--sg-rise-delay': `${Math.min(i, 12) * 30}ms` }">
          <SgAchievementBadge
            :title="a.title"
            :description="a.desc"
            :icon="a.icon"
            :tier="a.tier"
            :color="a.color"
            :unlocked="a.unlocked"
            :value="a.value"
            :max="a.max"
            :size="64"
          />
        </li>
      </ul>
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

.quests { display: flex; flex-direction: column; gap: 10px; margin: 0 0 24px; padding: 0; list-style: none; }
.hint { padding: 22px 0; text-align: center; color: var(--text-muted); font-size: 14px; }

.achievements {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px 8px;
  @include soft-card;
  padding: 20px 12px;
  margin: 0;
  list-style: none;
}
</style>
