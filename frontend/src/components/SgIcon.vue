<script setup lang="ts">
// Thin wrapper around lucide-vue-next. The design + seed data reference icons by
// their kebab-case Lucide name (e.g. "tram-front"); this maps those to the
// PascalCase components. Only the icons the app actually uses are registered,
// keeping the bundle tree-shakeable.
import {
  ArrowRight,
  AtSign,
  Award,
  BatteryFull,
  Bell,
  Bug,
  Bus,
  BusFront,
  CalendarCheck,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Layers,
  LayoutGrid,
  List,
  LocateFixed,
  Lock,
  LogOut,
  Mail,
  Map,
  MapPin,
  Navigation,
  Plus,
  Route,
  ScanLine,
  Search,
  Shield,
  Signal,
  Sparkles,
  Star,
  Target,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  User,
  Volume2,
  Wifi,
  X,
  Zap,
  type LucideProps,
} from 'lucide-vue-next'
import type { FunctionalComponent } from 'vue'
import { computed } from 'vue'

const registry: Record<string, FunctionalComponent<LucideProps>> = {
  'arrow-right': ArrowRight,
  'at-sign': AtSign,
  award: Award,
  'battery-full': BatteryFull,
  bell: Bell,
  bug: Bug,
  bus: Bus,
  'bus-front': BusFront,
  'calendar-check': CalendarCheck,
  'calendar-clock': CalendarClock,
  camera: Camera,
  check: Check,
  'check-circle-2': CheckCircle2,
  'chevron-right': ChevronRight,
  crown: Crown,
  eye: Eye,
  'eye-off': EyeOff,
  flame: Flame,
  layers: Layers,
  'layout-grid': LayoutGrid,
  list: List,
  'locate-fixed': LocateFixed,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  map: Map,
  'map-pin': MapPin,
  navigation: Navigation,
  plus: Plus,
  route: Route,
  'scan-line': ScanLine,
  search: Search,
  shield: Shield,
  signal: Signal,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  'train-front': TrainFront,
  'train-front-tunnel': TrainFrontTunnel,
  'tram-front': TramFront,
  user: User,
  'volume-2': Volume2,
  wifi: Wifi,
  x: X,
  zap: Zap,
}

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    strokeWidth?: number
  }>(),
  { size: undefined, strokeWidth: 2 },
)

const component = computed(() => registry[props.name] ?? null)
</script>

<template>
  <component
    :is="component"
    v-if="component"
    :size="size"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>
