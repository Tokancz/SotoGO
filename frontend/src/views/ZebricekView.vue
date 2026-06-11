<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  leaderboardApi,
  type LeaderboardData,
  type LeaderboardEntry,
  type LeaderboardMetric,
} from '@/services/leaderboard'
import TopBar from '@/components/layout/TopBar.vue'
import SgAvatar from '@/components/ui/SgAvatar.vue'
import SgIcon from '@/components/SgIcon.vue'
import SgSegmentedControl from '@/components/ui/SgSegmentedControl.vue'

const data = ref<LeaderboardData | null>(null)
const loading = ref(true)
const error = ref(false)
const metric = ref<LeaderboardMetric>('xp')

const metricOptions: { value: LeaderboardMetric; label: string; icon: string }[] = [
  { value: 'xp', label: 'XP', icon: 'star' },
  { value: 'battles', label: 'Bitvy', icon: 'zap' },
  { value: 'time', label: 'Čas v gymu', icon: 'award' },
]

// Whether the player already appears in the returned top slice — if not, their
// own row is pinned separately at the bottom.
const meInList = computed(
  () => !!data.value && data.value.entries.some((e) => e.id === data.value!.me.id),
)

const subtitle = computed(() =>
  data.value ? `${data.value.total} ${data.value.total === 1 ? 'hráč' : 'hráčů'}` : undefined,
)

async function load() {
  loading.value = true
  error.value = false
  try {
    data.value = await leaderboardApi.get(metric.value)
  } catch (err) {
    console.error('Načtení žebříčku selhalo:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(metric, load)

/** Human-readable holding time, e.g. "2 h 5 m" / "12 m" / "0 m". */
function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} m` : `${m} m`
}

/** The value shown in a row's right column, per the active metric. */
function metricValue(e: LeaderboardEntry): string {
  if (metric.value === 'battles') return `${e.battlesWon}×`
  if (metric.value === 'time') return fmtTime(e.gymSeconds)
  return `${e.xp.toLocaleString('cs-CZ')} XP`
}

/** Icon shown next to each row's value, matching the active metric. */
const metricIcon = computed(
  () => ({ xp: 'star', battles: 'zap', time: 'award' } as const)[metric.value],
)

const isMe = (e: LeaderboardEntry) => e.id === data.value?.me.id
const rankClass = (rank: number) =>
  rank <= 3 ? `row__rank--${({ 1: 'gold', 2: 'silver', 3: 'bronze' } as const)[rank as 1 | 2 | 3]}` : ''
</script>

<template>
  <div class="screen">
    <TopBar title="Žebříček" :subtitle="subtitle" />

    <div class="screen__scroll">
      <div class="metricbar">
        <SgSegmentedControl v-model="metric" :options="metricOptions" full-width />
      </div>

      <p v-if="loading" class="hint">Načítám žebříček…</p>
      <p v-else-if="error" class="hint">Žebříček se nepodařilo načíst. Zkus to později.</p>

      <template v-else-if="data">
        <ul :key="metric" class="list">
          <li
            v-for="(e, i) in data.entries"
            :key="e.id"
            class="row sg-rise"
            :class="{ 'row--me': isMe(e) }"
            :style="{ '--sg-rise-delay': `${Math.min(i, 14) * 35}ms` }"
          >
            <span class="row__rank" :class="rankClass(e.rank)">{{ e.rank }}</span>
            <SgAvatar :src="e.avatarUrl ?? undefined" :name="e.username" :size="40" />
            <span class="row__body">
              <span class="row__name">{{ e.username }}<span v-if="isMe(e)" class="row__you">Ty</span></span>
              <span class="row__lvl">Level {{ e.level }}</span>
            </span>
            <span class="row__xp"><SgIcon :name="metricIcon" :size="15" class="row__xpicon" />{{ metricValue(e) }}</span>
          </li>
        </ul>

        <!-- Player is outside the top slice — pin their own rank. -->
        <div v-if="!meInList" class="pinned">
          <div class="pinned__label"><SgIcon name="user" :size="13" /> Tvoje pozice</div>
          <ul class="list">
            <li class="row row--me">
              <span class="row__rank">{{ data.me.rank }}</span>
              <SgAvatar :src="data.me.avatarUrl ?? undefined" :name="data.me.username" :size="40" />
              <span class="row__body">
                <span class="row__name">{{ data.me.username }}<span class="row__you">Ty</span></span>
                <span class="row__lvl">Level {{ data.me.level }}</span>
              </span>
              <span class="row__xp"><SgIcon :name="metricIcon" :size="15" class="row__xpicon" />{{ metricValue(data.me) }}</span>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.screen { position: absolute; inset: 0; display: flex; flex-direction: column; }
.screen__scroll { flex: 1; overflow-y: auto; padding: 14px 16px 90px; }

.metricbar { margin-bottom: 14px; }

.hint { padding: 40px 0; text-align: center; color: var(--text-muted); font-size: 14px; }

.list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  @include soft-card(var(--radius-md));
}
.row--me {
  background: color-mix(in srgb, var(--brand) 9%, var(--surface-card));
  box-shadow: inset 0 0 0 2px var(--brand);
}
.row__rank {
  flex: none;
  width: 30px;
  text-align: center;
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 15px;
  color: var(--text-secondary);
}
.row__rank--gold { color: var(--gold-700); }
.row__rank--silver { color: #8a9099; }
.row__rank--bronze { color: #b06b3a; }
.row__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.row__name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 15px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row__you {
  flex: none;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-on-brand);
  background: var(--brand);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
}
.row__lvl { font-size: 12px; color: var(--text-muted); }
.row__xp {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 14px;
  color: var(--gold-700);
}
.row__xpicon { flex: none; }

.pinned { margin-top: 18px; }
.pinned__label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 2px 8px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
</style>
