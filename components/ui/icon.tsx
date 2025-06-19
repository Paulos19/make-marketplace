"use client"

import {
  Laptop,
  Moon,
  Smartphone,
  SunMedium,
  ToyBrick,
  Watch,
  BookOpen,
  Home,
  Sparkles, // Adicionado
  Shirt, // Adicionado
  Gift, // Adicionado
  Cpu, // Adicionado
  Baby, // Adicionado
  HeartPulse, // Adicionado
  BadgePercent, // Adicionado
  type LucideProps,
} from 'lucide-react'

// Objeto de ícones atualizado para incluir os novos.
export const Icons = {
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  smartphone: Smartphone,
  watch: Watch,
  toy: ToyBrick,
  book: BookOpen,
  home: Home,
  sparkles: Sparkles,
  shirt: Shirt,
  gift: Gift,
  cpu: Cpu,
  baby: Baby,
  heartPulse: HeartPulse,
  badgePercent: BadgePercent,
}

// O tipo IconName agora será gerado automaticamente com os novos ícones.
export type IconName = keyof typeof Icons

interface IconProps extends LucideProps {
  name: IconName
}

export const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = Icons[name]
  if (!LucideIcon) {
    // Fallback para um ícone padrão caso o nome seja inválido.
    const DefaultIcon = Icons['laptop']
    return <DefaultIcon {...props} />
  }
  return <LucideIcon {...props} />
}
