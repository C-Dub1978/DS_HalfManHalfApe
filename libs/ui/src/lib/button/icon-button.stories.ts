import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaButton } from './button';
import { HmhaIconButton } from './icon-button';

const meta: Meta<HmhaIconButton> = {
  title: 'Components/IconButton',
  component: HmhaIconButton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaButton, HmhaIconButton, HmhaIcon] })],
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
