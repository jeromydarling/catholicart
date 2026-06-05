import {
  AlertOctagon,
  Album,
  Award,
  BookOpen,
  Building2,
  Compass,
  Flame,
  GraduationCap,
  HandHeart,
  MapPin,
  PlayCircle,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MenuLink {
  to: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

export interface MenuColumn {
  heading: string;
  links: MenuLink[];
}

export interface MegaMenuFeature {
  eyebrow: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  paletteFrom: string;
  paletteTo: string;
}

export interface MegaMenuDef {
  id: "commission" | "trust" | "movement";
  label: string;
  columns: MenuColumn[];
  feature: MegaMenuFeature;
}

export const MENUS: MegaMenuDef[] = [
  {
    id: "commission",
    label: "Commission",
    columns: [
      {
        heading: "Begin",
        links: [
          {
            to: "/browse",
            label: "Browse the guild",
            description: "Read each artist's vocation. Study their portfolios.",
            icon: Users,
          },
          {
            to: "/map",
            label: "Map of the Body of Christ",
            description: "Find the hand near you, or commission across the world.",
            icon: MapPin,
          },
          {
            to: "/demo",
            label: "Walk through a commission",
            description: "Eight steps from the letter to the certificate. No signup.",
            icon: PlayCircle,
          },
          {
            to: "/features",
            label: "Every feature, plainly",
            description: "The whole guild in one room — live, and in gestation.",
            icon: Sparkles,
          },
        ],
      },
      {
        heading: "By tradition",
        links: [
          {
            to: "/orders",
            label: "Religious orders",
            description: "Benedictines, Franciscans, Dominicans, Carmelites.",
            icon: HandHeart,
          },
          {
            to: "/partnerships",
            label: "Diocesan partnerships",
            description: "Episcopal commissions and parish registries.",
            icon: Building2,
          },
        ],
      },
    ],
    feature: {
      eyebrow: "Never commissioned before?",
      title: "Walk through one in two minutes.",
      body: "A guided demo with chromeless screenshots — see exactly what a commission looks like, end to end.",
      to: "/demo",
      cta: "Start the walkthrough",
      paletteFrom: "#5d6f3d",
      paletteTo: "#1f2a11",
    },
  },
  {
    id: "trust",
    label: "Trust",
    columns: [
      {
        heading: "Transparency",
        links: [
          {
            to: "/ledger",
            label: "The Ledger",
            description:
              "Every commission. Every dollar to the artist. Every dollar we kept.",
            icon: ScrollText,
          },
          {
            to: "/catalog",
            label: "Annual catalog",
            description: "The yearbook of commissioned beauty.",
            icon: Album,
          },
        ],
      },
      {
        heading: "About the guild",
        links: [
          {
            to: "/about",
            label: "Mission",
            description: "What we're for, and what we're against.",
            icon: Compass,
          },
          {
            to: "/manifesto",
            label: "Read the manifesto",
            description: "Beauty is the front line.",
            icon: Flame,
          },
        ],
      },
    ],
    feature: {
      eyebrow: "Right now in escrow",
      title: "Funds held, never co-mingled.",
      body: "Released only when patrons approve each milestone.",
      to: "/ledger",
      cta: "See the ledger",
      paletteFrom: "#3a4d8f",
      paletteTo: "#0e1840",
    },
  },
  {
    id: "movement",
    label: "Movement",
    columns: [
      {
        heading: "Quarterly",
        links: [
          {
            to: "/journal",
            label: "The Beauty Manifesto",
            description: "Long-form essays. Mailed to anyone who asks.",
            icon: BookOpen,
          },
          {
            to: "/report",
            label: "The Anti-Kitsch Report",
            description: "What we will not commission, and why.",
            icon: AlertOctagon,
          },
        ],
      },
      {
        heading: "Patronage",
        links: [
          {
            to: "/prize",
            label: "Pulchritudo Prize",
            description: "$25,000 awarded each Pentecost.",
            icon: Award,
          },
          {
            to: "/apprenticeships",
            label: "Apprenticeships",
            description: "Funded by 1% of every commission.",
            icon: GraduationCap,
          },
        ],
      },
    ],
    feature: {
      eyebrow: "Fund the next master",
      title: "Hand taught by another hand.",
      body: "Patrons train the next master, every time they hire the current one.",
      to: "/apprenticeships",
      cta: "Learn about the program",
      paletteFrom: "#6e1b1b",
      paletteTo: "#250707",
    },
  },
];
