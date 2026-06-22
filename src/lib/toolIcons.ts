import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Files,
  MessageCircle,
  Network,
  Search,
  Shuffle,
  Smartphone,
} from 'lucide-react'

const ICON_HINT_MAP: Record<string, LucideIcon> = {
  'message-chatbot': Bot,
  'device-mobile': Smartphone,
  'arrows-shuffle': Shuffle,
  'chart-bar': BarChart3,
  files: Files,
  'brand-office': Briefcase,
  brain: Brain,
  search: Search,
  sitemap: Network,
}

export function toolIconFromHint(iconHint: string): LucideIcon {
  return ICON_HINT_MAP[iconHint] ?? MessageCircle
}

export const TOOL_ICON_TILE_STYLES: Record<string, { tile: string; icon: string }> = {
  'message-chatbot': { tile: 'bg-indigo-600', icon: 'text-white' },
  'device-mobile': { tile: 'bg-amber-100', icon: 'text-amber-800' },
  'arrows-shuffle': { tile: 'bg-green-100', icon: 'text-green-900' },
  'chart-bar': { tile: 'bg-amber-100', icon: 'text-amber-800' },
  files: { tile: 'bg-green-100', icon: 'text-green-900' },
  'brand-office': { tile: 'bg-blue-100', icon: 'text-blue-800' },
  brain: { tile: 'bg-orange-100', icon: 'text-orange-800' },
  search: { tile: 'bg-stone-200', icon: 'text-stone-600' },
  sitemap: { tile: 'bg-stone-100', icon: 'text-stone-600' },
}

export function toolIconTileClasses(iconHint: string): { tile: string; icon: string } {
  return TOOL_ICON_TILE_STYLES[iconHint] ?? { tile: 'bg-stone-100', icon: 'text-stone-600' }
}
