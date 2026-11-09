import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
} from '@angular/core';
import type { HmhaSize } from '../core/types';
import { HmhaIcon } from '../icon/icon';

/** The first letter or digit of a word, as a whole code point (not a UTF-16 half). */
function firstLetter(word: string): string {
  return Array.from(word).find((ch) => /[\p{L}\p{N}]/u.test(ch)) ?? '';
}

/**
 * Up to two initials: the first word's and the last word's. "Chris Wilson"
 * gives "CW", "Madonna" gives "M", "Jean-Luc van der Berg" gives "JB".
 */
export function hmhaInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter((w) => firstLetter(w));
  if (words.length === 0) return '';
  const first = firstLetter(words[0]);
  const last = words.length > 1 ? firstLetter(words[words.length - 1]) : '';
  return (first + last).toLocaleUpperCase();
}

@Component({
  // On a native <span>, which can hold an <img> and text alike, so the
  // avatar can fall back from photo to initials to icon. An <img> host
  // couldn't: it can't contain anything (fork 39).
  selector: 'span[hmhaAvatar]',
  imports: [HmhaIcon],
  template: `
    @if (showImage()) {
      <!-- alt="": the host carries the person's name, so photo, initials
           and icon all read the same. -->
      <img [src]="src()" alt="" (error)="imageFailed.set(true)" />
    } @else if (initials()) {
      <span class="hmha-avatar-initials">{{ initials() }}</span>
    } @else {
      <hmha-icon name="user" />
    }
  `,
  styleUrl: './avatar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Named by default: an unnamed picture of a person is worse than a
    // repeated name. Decorative for an avatar right beside the visible name.
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : (label() || name() || "User")',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-content]': 'showImage() ? "image" : initials() ? "initials" : "icon"',
  },
})
export class HmhaAvatar {
  /** The person's name: the accessible name, and where the initials come from. */
  readonly name = input<string | null>(null);
  /**
   * Overrides the accessible name, while initials still come from `name`.
   * For saying more than the name, such as a status: "Chris Wilson,
   * online". Putting that in `name` would turn "(online)" into an initial.
   */
  readonly label = input<string | null>(null);
  /** A photo URL. If it's missing or fails to load, the initials show instead. */
  readonly src = input<string | null>(null);
  readonly size = input<HmhaSize>('md');
  /** Hide it from assistive tech, for an avatar beside the person's visible name. */
  readonly decorative = input(false, { transform: booleanAttribute });

  /** Resets whenever `src` changes, so a new URL gets a fresh attempt. */
  protected readonly imageFailed = linkedSignal({ source: this.src, computation: () => false });
  protected readonly showImage = computed(() => !!this.src() && !this.imageFailed());
  protected readonly initials = computed(() => hmhaInitials(this.name()));
}
