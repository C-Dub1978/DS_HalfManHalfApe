import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaButton } from './button';
import { HmhaIconButton } from './icon-button';

/**
 * A media player's controls, the two rules from the Button README side by
 * side. Mute, Shuffle, Repeat and Captions are settings: toggle buttons
 * with a label that never changes. Play/Pause is an action that changes:
 * no `pressed`, its label and icon swap instead. Story-local.
 */
@Component({
  selector: 'player-controls-demo',
  imports: [HmhaButton, HmhaIconButton, HmhaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="toolbar" aria-label="Player" style="display:flex; gap: var(--hmha-control-gap); flex-wrap: wrap;">
      <button hmhaButton hmhaIconButton label="Rewind 10 seconds"><hmha-icon name="rewind" /></button>
      <button
        hmhaButton
        hmhaIconButton
        tone="primary"
        [label]="playing() ? 'Pause' : 'Play'"
        (click)="playing.set(!playing())"
      >
        <hmha-icon [name]="playing() ? 'pause' : 'play'" />
      </button>
      <button hmhaButton hmhaIconButton label="Fast forward 10 seconds"><hmha-icon name="fast-forward" /></button>
      <button hmhaButton hmhaIconButton label="Mute" [pressed]="muted()" (click)="muted.set(!muted())">
        <hmha-icon [name]="muted() ? 'volume-x' : 'volume-2'" />
      </button>
      <button hmhaButton hmhaIconButton label="Shuffle" [pressed]="shuffle()" (click)="shuffle.set(!shuffle())">
        <hmha-icon name="shuffle" />
      </button>
      <button hmhaButton hmhaIconButton label="Repeat" [pressed]="repeat()" (click)="repeat.set(!repeat())">
        <hmha-icon name="repeat" />
      </button>
      <button hmhaButton hmhaIconButton label="Captions" [pressed]="captions()" (click)="captions.set(!captions())">
        <hmha-icon [name]="captions() ? 'captions' : 'captions-off'" />
      </button>
    </div>
  `,
})
class PlayerControlsDemo {
  protected readonly playing = signal(false);
  protected readonly muted = signal(false);
  protected readonly shuffle = signal(false);
  protected readonly repeat = signal(false);
  protected readonly captions = signal(true);
}

const meta: Meta<HmhaIconButton> = {
  title: 'Components/IconButton',
  component: HmhaIconButton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaButton, HmhaIconButton, HmhaIcon, PlayerControlsDemo] })],
  argTypes: {
    label: { control: 'text' },
  },
  args: {
    label: 'More options',
  },
  render: (args) => ({
    props: args,
    template: `
      <button hmhaButton hmhaIconButton [label]="label" tone="neutral">
        <hmha-icon name="more-vertical" />
      </button>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaIconButton>;

/**
 * Default — `iconPosition="only"`. `label` is required and becomes
 * aria-label — getByRole below only finds the button because that
 * wiring works. `data-icon-only` squares the control instead of letting
 * the icon's intrinsic width drive it.
 */
export const Playground: Story = {
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: args['label'] as string });
    await expect(button).toHaveAttribute('data-icon-only', '');
  },
};

/** hmhaIconButton stacks on hmhaButton, so tone/size still apply normally. */
export const TonesAndSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <button hmhaButton hmhaIconButton label="More options" tone="neutral">
          <hmha-icon name="more-vertical" />
        </button>
        <button hmhaButton hmhaIconButton label="Delete" tone="danger" size="sm">
          <hmha-icon name="trash-2" size="sm" />
        </button>
        <button hmhaButton hmhaIconButton label="Confirm" tone="primary" size="lg">
          <hmha-icon name="check" size="lg" />
        </button>
      </div>
    `,
  }),
};

/**
 * `iconPosition="leading"` — the icon comes first in the projected
 * content, then the text. No `data-icon-only`, no `label` needed: the
 * visible text already names the button.
 */
export const LeadingIcon: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <button hmhaButton hmhaIconButton iconPosition="leading" tone="primary">
          <hmha-icon name="check" size="sm" />
          Save
        </button>
        <button hmhaButton hmhaIconButton iconPosition="leading" tone="danger" size="sm">
          <hmha-icon name="trash-2" size="sm" />
          Delete
        </button>
        <button hmhaButton hmhaIconButton iconPosition="leading" tone="neutral" size="lg">
          <hmha-icon name="download" size="lg" />
          Export
        </button>
      </div>
    `,
  }),
};

/**
 * `iconPosition="trailing"` — text first, then the icon. Same
 * no-`data-icon-only`/no-`label`-needed shape as `leading`; only the
 * content order differs, and that's entirely the consumer's own markup.
 */
export const TrailingIcon: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <button hmhaButton hmhaIconButton iconPosition="trailing" tone="primary">
          Next
          <hmha-icon name="chevron-right" size="sm" />
        </button>
        <button hmhaButton hmhaIconButton iconPosition="trailing" tone="neutral" size="sm">
          Open
          <hmha-icon name="external-link" size="sm" />
        </button>
      </div>
    `,
  }),
};

/**
 * For `leading`/`trailing`, the accessible name comes from the visible
 * text by default — no `aria-label` at all. Giving a `label` anyway
 * overrides it, which is why doing so is a deliberate choice, not a
 * harmless default (DECISIONS.md fork 23, the WCAG Label in Name
 * concern).
 */
export const AccessibleNameInteraction: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <button hmhaButton hmhaIconButton iconPosition="leading" tone="primary">
          <hmha-icon name="check" size="sm" />
          Save
        </button>
        <button hmhaButton hmhaIconButton iconPosition="trailing" tone="neutral" label="Proceed to next step">
          Next
          <hmha-icon name="chevron-right" size="sm" />
        </button>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const saveButton = canvas.getByRole('button', { name: 'Save' });
    await expect(saveButton).not.toHaveAttribute('aria-label');

    const nextButton = canvas.getByRole('button', { name: 'Proceed to next step' });
    await expect(nextButton).toHaveAttribute('aria-label', 'Proceed to next step');
  },
};

/**
 * A player's controls (fork 45). Mute keeps its label and flips its
 * pressed state; Play becomes Pause by swapping its label, with no pressed
 * state at all.
 */
export const PlayerControlsInteraction: Story = {
  render: () => ({ template: `<player-controls-demo />` }),
  play: async ({ canvas }) => {
    const mute = canvas.getByRole('button', { name: 'Mute' });
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(mute);
    await waitFor(() => expect(mute).toHaveAttribute('aria-pressed', 'true'));
    await expect(canvas.getByRole('button', { name: 'Mute' })).toBe(mute);

    const play = canvas.getByRole('button', { name: 'Play' });
    await expect(play).not.toHaveAttribute('aria-pressed');
    await userEvent.click(play);
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Pause' })).toBe(play));
    await expect(play).not.toHaveAttribute('aria-pressed');

    await expect(canvas.getByRole('button', { name: 'Captions' })).toHaveAttribute('aria-pressed', 'true');
  },
};
