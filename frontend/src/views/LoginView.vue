<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useGoogleSignIn } from '@/composables/useGoogleSignIn'
import SgSegmentedControl from '@/components/ui/SgSegmentedControl.vue'
import SgInput from '@/components/ui/SgInput.vue'
import SgButton from '@/components/ui/SgButton.vue'
import SgSwitch from '@/components/ui/SgSwitch.vue'
import SgIcon from '@/components/SgIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

type Mode = 'login' | 'register'
const mode = ref<Mode>('login')
const isReg = computed(() => mode.value === 'register')

const username = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const remember = ref(true)

const loading = ref(false)
const error = ref<string | null>(null)

const scrollEl = ref<HTMLElement | null>(null)
const googleEl = ref<HTMLElement | null>(null)

function messageFrom(e: unknown): string {
  if (e instanceof AxiosError) {
    if (e.response?.data?.error) return e.response.data.error as string
    if (e.code === 'ERR_NETWORK') return 'Server neodpovídá. Běží backend?'
  }
  return 'Něco se pokazilo, zkus to znovu.'
}

function goAfterAuth() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/mapa'
  router.replace(redirect)
}

function switchMode(next: Mode) {
  mode.value = next
  error.value = null
  scrollEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submit() {
  if (loading.value) return
  error.value = null
  loading.value = true
  try {
    if (isReg.value) {
      await auth.register(username.value.trim(), email.value.trim(), password.value, remember.value)
    } else {
      await auth.login(email.value.trim(), password.value, remember.value)
    }
    goAfterAuth()
  } catch (e) {
    error.value = messageFrom(e)
  } finally {
    loading.value = false
  }
}

const { render: renderGoogle, configured: googleConfigured, error: googleError } = useGoogleSignIn(
  async (credential) => {
    error.value = null
    loading.value = true
    try {
      await auth.loginWithGoogle(credential, remember.value)
      goAfterAuth()
    } catch (e) {
      error.value = messageFrom(e)
    } finally {
      loading.value = false
    }
  },
)

onMounted(() => {
  if (googleConfigured && googleEl.value) renderGoogle(googleEl.value)
})
</script>

<template>
  <div class="login">
    <div ref="scrollEl" class="login__scroll">
      <header class="login__hero">
        <div class="login__sheen" />
        <span class="login__ring" style="width: 150px; height: 150px" />
        <span class="login__ring" style="width: 260px; height: 260px" />
        <span class="login__ring" style="width: 380px; height: 380px" />
        <div class="login__mark"><SgIcon name="tram-front" :size="40" /></div>
        <div class="login__wordmark">Šoto<span>GO</span></div>
        <div class="login__tag">Chyť je všechny · sbírej MHD</div>
      </header>

      <section class="login__sheet">
        <span class="login__grab" />
        <form class="login__body" @submit.prevent="submit">
          <SgSegmentedControl
            full-width
            :model-value="mode"
            :options="[
              { value: 'login', label: 'Přihlášení' },
              { value: 'register', label: 'Registrace' },
            ]"
            @update:model-value="switchMode"
          />

          <h1 class="login__title">{{ isReg ? 'Pojď sbírat' : 'Vítej zpátky, šotouši' }}</h1>

          <p v-if="error" class="login__error">{{ error }}</p>

          <SgInput
            v-if="isReg"
            v-model="username"
            label="Přezdívka"
            placeholder="napr. sotous_petr"
            leading-icon="at-sign"
          />

          <SgInput
            v-model="email"
            label="E-mail"
            type="email"
            placeholder="petr@email.cz"
            leading-icon="mail"
          />

          <SgInput
            v-model="password"
            label="Heslo"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            leading-icon="lock"
          >
            <template #trailing>
              <button
                type="button"
                class="login__eye"
                :aria-label="showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'"
                @click="showPassword = !showPassword"
              >
                <SgIcon :name="showPassword ? 'eye-off' : 'eye'" :size="20" />
              </button>
            </template>
          </SgInput>

          <div class="login__row">
            <SgSwitch v-model="remember" label="Zůstat přihlášen" />
            <button v-if="!isReg" type="button" class="login__link">Zapomenuté heslo?</button>
          </div>

          <SgButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            trailing-icon="arrow-right"
            :disabled="loading"
          >
            {{ isReg ? 'Vytvořit účet' : 'Přihlásit se' }}
          </SgButton>

          <div class="login__div">nebo</div>

          <div v-if="googleConfigured" class="login__google">
            <div ref="googleEl" />
            <p v-if="googleError" class="login__hint">{{ googleError }}</p>
          </div>
          <p v-else class="login__hint">
            Přihlášení přes Google zatím není nastavené.
          </p>

          <p class="login__foot">
            {{ isReg ? 'Už máš účet? ' : 'Nemáš účet? ' }}
            <button type="button" class="login__link" @click="switchMode(isReg ? 'login' : 'register')">
              {{ isReg ? 'Přihlas se' : 'Zaregistruj se' }}
            </button>
          </p>
        </form>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login {
  position: fixed;
  inset: 0;
  background: var(--brand);
}

// Single scroll container so the hero collapses naturally as the form scrolls up.
.login__scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.login__hero {
  position: relative;
  height: 300px;
  overflow: hidden;
  background: radial-gradient(120% 80% at 50% -10%, var(--green-400) 0%, var(--green-500) 42%, var(--green-600) 100%);
}
.login__sheen {
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 40% at 78% 8%, rgba(255, 255, 255, 0.18), transparent 60%);
}
.login__ring {
  position: absolute;
  left: 50%;
  top: 120px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
}
.login__mark {
  position: absolute;
  top: 86px;
  left: 50%;
  transform: translateX(-50%);
  width: 78px;
  height: 78px;
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand);
  background: #fff;
  box-shadow: 0 14px 30px rgba(11, 28, 8, 0.4), 0 0 0 6px rgba(255, 255, 255, 0.1);
}
.login__wordmark {
  position: absolute;
  top: 186px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 34px;
  letter-spacing: -0.02em;
  color: #fff;
  span { color: var(--green-200); }
}
.login__tag {
  position: absolute;
  top: 232px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.login__sheet {
  position: relative;
  z-index: 2;
  margin-top: -30px;
  min-height: calc(100dvh - 270px);
  background: var(--bg-app);
  border-radius: 30px 30px 0 0;
  box-shadow: 0 -10px 40px rgba(11, 28, 8, 0.18);
}
.login__grab {
  display: block;
  width: 40px;
  height: 5px;
  border-radius: 999px;
  background: var(--border-strong);
  margin: 10px auto 0;
}
.login__body {
  // Cap the form width on desktop so it doesn't stretch edge to edge.
  max-width: 460px;
  margin-inline: auto;
  padding: 14px 22px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login__title {
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 22px;
  color: var(--text-primary);
  margin: 2px 0 -4px;
}

.login__error {
  background: var(--danger-soft);
  color: var(--danger-500);
  font-size: 13.5px;
  font-weight: var(--fw-medium);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin: 0;
}

.login__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.login__link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 13px;
  color: var(--text-brand);
}
.login__eye {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-muted);
  display: inline-flex;
}

.login__div {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 12px;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  &::before,
  &::after {
    content: '';
    height: 1px;
    flex: 1;
    background: var(--border-default);
  }
}

.login__google {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  // Center the iframe Google renders into.
  :deep(> div) { display: flex; justify-content: center; }
}
.login__hint {
  text-align: center;
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0;
}

.login__foot {
  text-align: center;
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 2px 0 0;
}
</style>
