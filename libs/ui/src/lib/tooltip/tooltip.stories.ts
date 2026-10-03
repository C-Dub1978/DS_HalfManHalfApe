import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaTooltip } from './tooltip';

const meta: Meta<HmhaTooltip> = {
  title: 'Components/Tooltip',
  component: HmhaTooltip,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaTooltip] })],
  // The real accessible description comes from CDK's AriaDescriber (fork
  // 16) — a hidden, always-present text node — not from aria-describedby
  // pointed at this visible bubble, which mounts and unmounts with hover
  // state and lives in the CDK overlay container, a sibling of this
  // story's root in the real DOM, not a descendant of it. Play functions
  // below query `document` for the bubble, not `canvas`.
  argTypes: {
    hmhaTooltip: { control: 'text' },
  },
  args: {
    hmhaTooltip: 'Saved to drafts',
  },
  render: (args) => ({
    props: args,
    template: `<button type="button" [hmhaTooltip]="hmhaTooltip">Hover or focus me</button>`,
  }),
};
export default meta;

type Story = StoryObj<HmhaTooltip>;

/** Default — hidden on load, but already describable via aria-describedby. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Hover or focus me' });
    const describedId = trigger.getAttribute('aria-describedby');
    await expect(describedId).toBeTruthy();
    await expect(document.getElementById(describedId as string)).toHaveTextContent('Saved to drafts');
    await expect(document.querySelector('[hmhaTooltipPanel]')).toBeNull();
  },
};

/** Hovering shows the bubble; moving the pointer away hides it again. */
export const HoverInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Hover or focus me' });

    await userEvent.hover(trigger);
    const panel = document.querySelector('[hmhaTooltipPanel]');
    await expect(panel).toHaveAttribute('role', 'tooltip');
    await expect(panel).toHaveTextContent('Saved to drafts');

    await userEvent.unhover(trigger);
    await expect(document.querySelector('[hmhaTooltipPanel]')).toBeNull();
  },
};

/** Keyboard focus shows the bubble the same way hover does — blurring hides it. */
export const FocusInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Hover or focus me' });

    trigger.focus();
    await expect(document.querySelector('[hmhaTooltipPanel]')).toBeTruthy();

    trigger.blur();
    await expect(document.querySelector('[hmhaTooltipPanel]')).toBeNull();
  },
};

/** Escape dismisses the bubble even though focus never actually leaves the trigger — the WAI-ARIA tooltip pattern's keyboard escape hatch. */
export const EscapeDismissInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Hover or focus me' });

    trigger.focus();
    await expect(document.querySelector('[hmhaTooltipPanel]')).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    await expect(document.querySelector('[hmhaTooltipPanel]')).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};
