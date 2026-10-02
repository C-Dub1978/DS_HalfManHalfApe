import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { HmhaMenu } from './menu';
import { HmhaMenuItem } from './menu-item';
import { HmhaMenuTrigger } from './menu-trigger';

const meta: Meta<HmhaMenuItem> = {
  title: 'Components/MenuItem',
  component: HmhaMenuItem,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaMenuTrigger, HmhaMenu, HmhaMenuItem] })],
  // HmhaMenuItem injects HMHA_MENU (required, not optional) — same
  // reasoning as HmhaRadio needing HmhaRadioGroup (fork 11) — so every
  // story wraps it in the trigger+panel it needs to exist at all, opened on
  // play so the item itself is what's on screen.
  render: (args) => ({
    props: args,
    template: `
      <button [hmhaMenuTrigger]="menu">Actions</button>
      <ng-template #menu>
        <div hmhaMenu>
          <button hmhaMenuItem (click)="onSelect()">Rename</button>
          <button hmhaMenuItem disabled>Archive</button>
        </div>
      </ng-template>
    `,
  }),
  args: {
    onSelect: fn(),
  },
};
export default meta;

type Story = StoryObj<HmhaMenuItem>;

/** Default — role="menuitem" on a real <button>; the active item (only, via roving tabindex) is the one in the Tab order. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));

    const items = Array.from(document.querySelectorAll('[hmhaMenuItem]')) as HTMLButtonElement[];
    await expect(items[0]).toHaveAttribute('role', 'menuitem');
    await expect(items[0]).toHaveAttribute('tabindex', '0');
    await expect(items[0]).toHaveAttribute('data-active', '');
    await expect(items[1]).toHaveAttribute('tabindex', '-1');
  },
};

/** A real disabled attribute — out of the Tab order, skipped by keyboard navigation, inert to clicks, for free from native <button> semantics. */
export const Disabled: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));

    const archive = document.querySelector('[hmhaMenuItem]:disabled') as HTMLButtonElement;
    await expect(archive).toBeTruthy();
    await expect(archive.tabIndex).toBe(-1);
  },
};

/** Clicking an enabled item invokes the consumer's own click handler and closes the menu. */
export const SelectionInteraction: Story = {
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);

    const rename = document.querySelector('[hmhaMenuItem]') as HTMLElement;
    await userEvent.click(rename);

    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    await expect(document.querySelector('[hmhaMenu]')).toBeNull();
  },
};
