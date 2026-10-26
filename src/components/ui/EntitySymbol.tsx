import type { CSSProperties } from "react";
import {
  Baby,
  Banknote,
  Bath,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Camera,
  Car,
  CircleDollarSign,
  Coffee,
  Dumbbell,
  Film,
  Flower2,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Handshake,
  HeartPulse,
  Home,
  Laptop,
  Leaf,
  Map,
  Music,
  Newspaper,
  Package,
  Paintbrush,
  Paperclip,
  PawPrint,
  Pill,
  Pin,
  Plane,
  Receipt,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Sun,
  Tag,
  Target,
  Tent,
  Train,
  TrendingUp,
  Truck,
  Utensils,
  Wallet,
  Wifi,
  Wine,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Keep stored emoji identities stable across palettes. Recognized symbols get
// the reference's stroked treatment; custom emoji remain visible as a fallback.
const iconGroups: [LucideIcon, string[]][] = [
  [Tag, ["🏷", "📎"]],
  [Sparkles, ["🌟", "🎉", "✨"]],
  [Smartphone, ["📱"]],
  [Dumbbell, ["🏃", "💪", "🏋", "⚽", "🧘"]],
  [PawPrint, ["🐶", "🐱", "🐾"]],
  [Coffee, ["☕"]],
  [Gift, ["🎁"]],
  [Car, ["🚕", "🚗", "🚙", "🅿", "🛵"]],
  [HeartPulse, ["🩺", "🏥", "🧑‍⚕", "🧠", "🧪"]],
  [BookOpen, ["📚", "📖"]],
  [Home, ["🏠", "🛋", "🪑", "🔑"]],
  [ShoppingBasket, ["🛒", "🧺", "🥑"]],
  [Utensils, ["🍽", "🍔", "🍕", "🍜", "🍰", "🍿", "🧑‍🍳"]],
  [Wine, ["🍷", "🍺"]],
  [Fuel, ["⛽"]],
  [Bus, ["🚌"]],
  [Plane, ["✈", "🧳", "🏖"]],
  [Bike, ["🚲"]],
  [Zap, ["💡", "🔋"]],
  [Receipt, ["🧾"]],
  [Wrench, ["🔧", "🛠", "🧹", "🧼", "🧻", "🪥"]],
  [Leaf, ["🌱", "🪴", "🍃"]],
  [ShoppingBag, ["🛍"]],
  [Shirt, ["👕"]],
  [Gamepad2, ["🎮", "🎲", "🕹"]],
  [Film, ["🎬", "🎟"]],
  [Music, ["🎵", "🎧"]],
  [Laptop, ["💻", "🧑‍💻"]],
  [Paintbrush, ["🎨"]],
  [Banknote, ["💰", "💸"]],
  [Building2, ["🏦"]],
  [Wallet, ["🐷", "💳"]],
  [TrendingUp, ["📈", "📊"]],
  [Target, ["🎯"]],
  [GraduationCap, ["🎓", "🧑‍🏫"]],
  [Briefcase, ["💼"]],
  [Baby, ["🧸", "🍼", "👶"]],
  [Scissors, ["💇", "✂"]],
  [Pill, ["💊"]],
  [Map, ["🗺"]],
  [Pin, ["📌"]],
  [Package, ["📦", "📬"]],
  [Bath, ["🚿"]],
  [Camera, ["📷"]],
  [Newspaper, ["📰"]],
  [Tent, ["⛺", "🛶", "🎣"]],
  [CircleDollarSign, ["🪙"]],
  [Handshake, ["🤝"]],
  [Truck, ["🚚"]],
  [Train, ["🚇", "🚆"]],
  [Wifi, ["📡", "🌐"]],
  [Flower2, ["🌼"]],
  [Sun, ["☀", "❄"]],
  [Paperclip, ["🔗"]],
];
const icons: Partial<Record<string, LucideIcon>> = Object.fromEntries(
  iconGroups.flatMap(([Icon, symbols]) => symbols.map((symbol) => [symbol, Icon] as const)),
);

/** Shared presentation for categories, income, goals and business identities.
 * CSS selects emoji or Lucide before hydration, avoiding palette-flash and
 * keeping the component usable without subscribing every row to the store. */
export function EntitySymbol({
  emoji,
  color,
  size = 18,
}: {
  emoji: string;
  color?: string;
  size?: number;
}) {
  const Icon = icons[emoji.replace(/\uFE0F/g, "")];
  return (
    <span
      aria-hidden="true"
      className={`entity-symbol ${Icon ? "has-icon" : ""}`}
      style={color ? ({ "--entity-accent": color } as CSSProperties) : undefined}
    >
      <span className="entity-symbol-emoji">{emoji}</span>
      {Icon && <Icon className="entity-symbol-icon" size={size} strokeWidth={2} />}
    </span>
  );
}
