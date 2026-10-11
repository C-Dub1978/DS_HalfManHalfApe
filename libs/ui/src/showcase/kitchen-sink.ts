import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HmhaButton,
  HmhaCard,
  HmhaIcon,
  HmhaStep,
  HmhaStepList,
  HmhaStepPanel,
  HmhaStepper,
  HmhaSwitch,
  HmhaTab,
  HmhaTabList,
  HmhaTabPanel,
  HmhaTabs,
} from '@halfmanhalfape/hmha-ui';

/**
 * Demo-local only (DECISIONS.md fork 27) — these override *values* are
 * never added to `tokens/`. They exist to prove that any consumer can
 * already re-theme this library at runtime, by redeclaring the same
 * `var(--hmha-*)` custom properties every component already consumes.
 * `danger`/`warning`/`success` are deliberately left untouched by every
 * preset — those are status colors, not brand colors.
 */
interface KitchenSinkColorTheme {
  readonly id: string;
  readonly label: string;
  /** Exactly 4, rendered as a 2x2 swatch grid on the theme's own card. */
  readonly swatches: readonly string[];
  readonly vars: Readonly<Record<string, string>>;
}

const COLOR_THEMES: readonly KitchenSinkColorTheme[] = [
  {
    id: 'ocean',
    label: 'Ocean',
    swatches: [
      'var(--hmha-color-blue-600)',
      'var(--hmha-color-blue-700)',
      'var(--hmha-color-blue-800)',
      'var(--hmha-color-blue-50)',
    ],
    // Today's real, shipped default — included as the implicit "reset" card.
    vars: {
      '--hmha-color-action': 'var(--hmha-color-blue-600)',
      '--hmha-color-action-hover': 'var(--hmha-color-blue-700)',
      '--hmha-color-action-active': 'var(--hmha-color-blue-800)',
      '--hmha-color-action-subtle': 'var(--hmha-color-blue-50)',
      '--hmha-color-focus': 'var(--hmha-color-blue-600)',
      '--hmha-color-text-on-action': 'var(--hmha-color-neutral-0)',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    swatches: [
      'var(--hmha-color-green-500)',
      'var(--hmha-color-green-700)',
      'var(--hmha-color-green-900)',
      'var(--hmha-color-green-100)',
    ],
    // action/text-on-action reuse the already-contrast-verified success pair.
    vars: {
      '--hmha-color-action': 'var(--hmha-color-green-500)',
      '--hmha-color-action-hover': 'var(--hmha-color-green-700)',
      '--hmha-color-action-active': 'var(--hmha-color-green-900)',
      '--hmha-color-action-subtle': 'var(--hmha-color-green-100)',
      '--hmha-color-focus': 'var(--hmha-color-green-500)',
      '--hmha-color-text-on-action': 'var(--hmha-color-neutral-0)',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    swatches: [
      'var(--hmha-color-amber-500)',
      'var(--hmha-color-amber-700)',
      'var(--hmha-color-amber-900)',
      'var(--hmha-color-amber-100)',
    ],
    // action/text-on-action reuse the already-contrast-verified warning pair
    // (amber needs dark text, same asymmetry DECISIONS.md's Open Items
    // already flags). Hover/active darken further without a matching
    // lighten-the-text step — a known, demo-only imperfection, not
    // something any real token pair here is actually tested against.
    vars: {
      '--hmha-color-action': 'var(--hmha-color-amber-500)',
      '--hmha-color-action-hover': 'var(--hmha-color-amber-700)',
      '--hmha-color-action-active': 'var(--hmha-color-amber-900)',
      '--hmha-color-action-subtle': 'var(--hmha-color-amber-100)',
      '--hmha-color-focus': 'var(--hmha-color-amber-500)',
      '--hmha-color-text-on-action': 'var(--hmha-color-neutral-950)',
    },
  },
  {
    id: 'crimson',
    label: 'Crimson',
    swatches: [
      'var(--hmha-color-red-500)',
      'var(--hmha-color-red-700)',
      'var(--hmha-color-red-900)',
      'var(--hmha-color-red-100)',
    ],
    // action/text-on-action reuse the already-contrast-verified danger pair.
    vars: {
      '--hmha-color-action': 'var(--hmha-color-red-500)',
      '--hmha-color-action-hover': 'var(--hmha-color-red-700)',
      '--hmha-color-action-active': 'var(--hmha-color-red-900)',
      '--hmha-color-action-subtle': 'var(--hmha-color-red-100)',
      '--hmha-color-focus': 'var(--hmha-color-red-500)',
      '--hmha-color-text-on-action': 'var(--hmha-color-neutral-0)',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    // No existing primitive ramp has this hue — picked at the same
    // lightness/chroma as action's own default (blue.600: L .550 C .192)
    // so it carries the same contrast margin against white text.
    swatches: ['oklch(0.550 0.192 300)', 'oklch(0.480 0.172 300)', 'oklch(0.400 0.138 300)', 'oklch(0.940 0.035 300)'],
    vars: {
      '--hmha-color-action': 'oklch(0.550 0.192 300)',
      '--hmha-color-action-hover': 'oklch(0.480 0.172 300)',
      '--hmha-color-action-active': 'oklch(0.400 0.138 300)',
      '--hmha-color-action-subtle': 'oklch(0.940 0.035 300)',
      '--hmha-color-focus': 'oklch(0.550 0.192 300)',
      '--hmha-color-text-on-action': 'var(--hmha-color-neutral-0)',
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    swatches: [
      'var(--hmha-color-neutral-800)',
      'var(--hmha-color-neutral-900)',
      'var(--hmha-color-neutral-950)',
      'var(--hmha-color-neutral-200)',
    ],
    vars: {
      '--hmha-color-action': 'var(--hmha-color-neutral-800)',
      '--hmha-color-action-hover': 'var(--hmha-color-neutral-900)',
      '--hmha-color-action-active': 'var(--hmha-color-neutral-950)',
      '--hmha-color-action-subtle': 'var(--hmha-color-neutral-200)',
      '--hmha-color-focus': 'var(--hmha-color-neutral-800)',
      '--hmha-color-text-on-action': 'var(--hmha-color-neutral-0)',
    },
  },
];

interface KitchenSinkTypeTheme {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Heading size/weight only — never font-family (a new font is a new external dependency nobody asked for here; see fork 27). */
  readonly vars: Readonly<Record<string, string>>;
}

const TYPE_THEMES: readonly KitchenSinkTypeTheme[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: "Today's shipped type scale, unchanged.",
    vars: {},
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Smaller headings, tighter rhythm.',
    vars: {
      '--hmha-type-heading-lg-size': 'var(--hmha-font-size-2xl)',
      '--hmha-type-heading-md-size': 'var(--hmha-font-size-lg)',
    },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'Larger, heavier headings.',
    vars: {
      '--hmha-type-heading-lg-size': '36px',
      '--hmha-type-heading-md-size': 'var(--hmha-font-size-2xl)',
      '--hmha-type-heading-md-weight': 'var(--hmha-font-weight-bold)',
    },
  },
];

type KitchenSinkOnboardingStep = 'theme' | 'typography' | 'confirm';
type KitchenSinkDensity = 'comfortable' | 'compact';

@Component({
  selector: 'kitchen-sink',
  imports: [
    HmhaButton,
    HmhaCard,
    HmhaIcon,
    HmhaStep,
    HmhaStepList,
    HmhaStepPanel,
    HmhaStepper,
    HmhaSwitch,
    HmhaTab,
    HmhaTabList,
    HmhaTabPanel,
    HmhaTabs,
    FormsModule,
  ],
  templateUrl: './kitchen-sink.html',
  styleUrl: './kitchen-sink.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-hmha-mode]': 'mode()',
    '[attr.data-hmha-density]': 'density()',
    '[style]': 'activeStyleOverrides()',
  },
})
export class KitchenSink {
  protected readonly colorThemes = COLOR_THEMES;
  protected readonly typeThemes = TYPE_THEMES;

  protected readonly mode = signal<'light' | 'dark'>('light');
  protected readonly density = signal<KitchenSinkDensity>('comfortable');
  protected readonly selectedThemeId = signal(COLOR_THEMES[0].id);
  protected readonly selectedTypeId = signal(TYPE_THEMES[0].id);

  protected readonly onboardingStep = signal<KitchenSinkOnboardingStep>('theme');
  protected readonly onboardingComplete = signal(false);
  protected readonly activeTab = signal('tab1');

  protected readonly activeColorTheme = computed(
    () => this.colorThemes.find((theme) => theme.id === this.selectedThemeId()) ?? this.colorThemes[0],
  );
  protected readonly activeTypeTheme = computed(
    () => this.typeThemes.find((theme) => theme.id === this.selectedTypeId()) ?? this.typeThemes[0],
  );

  protected readonly activeStyleOverrides = computed(() => ({
    ...this.activeColorTheme().vars,
    ...this.activeTypeTheme().vars,
  }));

  protected setDarkMode(isDark: boolean): void {
    this.mode.set(isDark ? 'dark' : 'light');
  }

  protected selectTheme(id: string): void {
    this.selectedThemeId.set(id);
  }

  protected selectTypography(id: string): void {
    this.selectedTypeId.set(id);
  }

  protected setDensity(density: KitchenSinkDensity): void {
    this.density.set(density);
  }

  protected goToOnboardingStep(step: KitchenSinkOnboardingStep): void {
    this.onboardingStep.set(step);
  }

  protected completeOnboarding(): void {
    this.onboardingComplete.set(true);
  }
}
