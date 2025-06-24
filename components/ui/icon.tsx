import {
  Sun, Moon, Laptop, Smartphone, Watch, ToyBrick, Book, Home, Sparkles, Shirt, Gift, Cpu, Baby, HeartPulse, BadgePercent,
  Dumbbell, // Adicionado
  Shapes,   // Adicionado
  LucideProps
} from 'lucide-react';

// Mapeamento de todos os ícones disponíveis na sua aplicação.
// Adicionar um novo ícone aqui o torna disponível em todo o site.
export const Icons = {
  sun: Sun,
  moon: Moon,
  laptop: Laptop,
  smartphone: Smartphone,
  watch: Watch,
  toy: ToyBrick,
  book: Book,
  home: Home,
  sparkles: Sparkles,
  shirt: Shirt,
  gift: Gift,
  cpu: Cpu,
  baby: Baby,
  heartPulse: HeartPulse,
  badgePercent: BadgePercent,
  dumbbell: Dumbbell, // Adicionado
  shapes: Shapes,     // Adicionado
};

// O tipo 'IconName' é gerado automaticamente a partir das chaves do objeto 'Icons'.
export type IconName = keyof typeof Icons;

// Componente reutilizável para renderizar qualquer ícone da sua biblioteca.
export const Icon = ({ name, ...props }: { name: IconName } & LucideProps) => {
  const IconComponent = Icons[name];

  // Fallback para o caso de um nome de ícone inválido ser passado (embora o TypeScript deva prevenir isso).
  if (!IconComponent) {
    const FallbackIcon = Icons['shapes'];
    return <FallbackIcon {...props} />;
  }

  return <IconComponent {...props} />;
};
