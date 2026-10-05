import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaMenu } from './menu';
import { HmhaMenuItem } from './menu-item';
import { HmhaMenuTrigger } from './menu-trigger';

const meta: Meta<HmhaMenu> = {
  title: 'Components/Menu',
  component: HmhaMenu,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaMenuTrigger, HmhaMenu, HmhaMenuItem] })],
  // HmhaMenu requires HMHA_MENU_TRIGGER (not optional) — same reasoning as
  // HmhaRadio needing HmhaRadioGroup (fork 11) — so every story wraps it in
  // the trigger that gives it meaning, and opens it in each play function so
  // the panel (this component's own subject) is what's actually on screen.
  // Trigger-level concerns (open/close, toggle, dismissal) have their own
  // stories in menu-trigger.stories.ts — these focus on what's specific to
  // the panel itself.
  render: () => ({
    template: `
      <button [hmhaMenuTrigger]="menu">Actions</button>
      <ng-template #menu>
        <div hmhaMenu>
          <button hmhaMenuItem>Rename</button>
          <button hmhaMenuItem>Duplicate</button>
          <button hmhaMenuItem disabled>Archive</button>
          <button hmhaMenuItem>Delete</button>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaMenu>;

/** Default — role="menu", and the first item is activated automatically on open. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));

    const panel = document.querySelector('[hmhaMenu]');
    await expect(panel).toHaveAttribute('role', 'menu');
    await expect(document.querySelector('[hmhaMenuItem]')).toHaveFocus();
  },
};

/** Typing a letter jumps straight to the next item whose label starts with it (FocusKeyManager's typeahead, powered by HmhaMenuItem.getLabel()). */
export const TypeaheadInteraction: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));

    const items = Array.from(document.querySelectorAll('[hmhaMenuItem]'));
    await expect(items[0]).toHaveFocus(); // "Rename"

    // Search starts just past the active item, so "d" matches "Duplicate"
    // (index 1) before it ever reaches "Delete" (index 3). CDK's Typeahead
    // debounces keystrokes (200ms default) before acting on them, so the
    // match doesn't land synchronously.
    await userEvent.keyboard('d');
    await waitFor(() => expect(items[1]).toHaveFocus());
  },
};
