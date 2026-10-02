import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { HmhaMenu } from './menu';
import { HmhaMenuItem } from './menu-item';
import { HmhaMenuTrigger } from './menu-trigger';

// CDK's ListKeyManager.onKeydown switches on the legacy numeric
// event.keyCode, which @testing-library/user-event v14 deliberately never
// sets (it dispatches on `.key`/`.code` only) — a real hardware key press
// in a real browser still populates it correctly, so this is purely a test
// simulation gap, not a product bug. See menu.spec.ts for the same note.
function dispatchArrowDown(target: Element): void {
  const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => 40 });
  target.dispatchEvent(event);
}

const meta: Meta<HmhaMenuTrigger> = {
  title: 'Components/MenuTrigger',
  component: HmhaMenuTrigger,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaMenuTrigger, HmhaMenu, HmhaMenuItem] })],
  // Connected-position popup built on hmhaOverlay() — see DECISIONS.md fork
  // 15 for the two overlay-foundation fixes Menu's toggle/DI behaviour
  // needed. The panel renders in the CDK overlay container, a sibling of
  // this story's root in the real DOM, not a descendant of it — play
  // functions below query `document` for it, not `canvas`.
  render: (args) => ({
    props: args,
    template: `
      <button [hmhaMenuTrigger]="menu">Actions</button>
      <ng-template #menu>
        <div hmhaMenu>
          <button hmhaMenuItem (click)="onRename()">Rename</button>
          <button hmhaMenuItem (click)="onDuplicate()">Duplicate</button>
          <button hmhaMenuItem disabled>Archive</button>
          <button hmhaMenuItem (click)="onDelete()">Delete</button>
        </div>
      </ng-template>
    `,
  }),
  args: {
    onRename: fn(),
    onDuplicate: fn(),
    onDelete: fn(),
  },
};
export default meta;

type Story = StoryObj<HmhaMenuTrigger>;

/** Default — closed on load. aria-haspopup="menu" advertises the popup before it's ever opened. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Clicking the trigger opens the panel, sets aria-expanded, and activates the first item. */
export const OpenInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = document.querySelector('[hmhaMenu]');
    await expect(panel).toHaveAttribute('role', 'menu');
    const first = document.querySelector('[hmhaMenuItem]');
    await expect(first).toHaveFocus();
  },
};

/**
 * Regression coverage for fork 15: clicking an already-open trigger used to
 * reopen instead of closing, because CDK's outside-click dismissal (capture
 * phase on document.body) closed the overlay before this button's own
 * (click) handler ever saw the event, which then read isOpen() as already
 * false and reopened it. hmhaOverlay now excludes clicks on the origin
 * element from that auto-dismissal.
 */
export const ToggleCloseInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(document.querySelector('[hmhaMenu]')).toBeNull();
  },
};

/** ArrowDown moves the active item; a disabled item (Archive) is skipped entirely. */
export const KeyboardNavigationInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);

    const items = Array.from(document.querySelectorAll('[hmhaMenuItem]'));
    await expect(items[0]).toHaveFocus();

    const panel = document.querySelector('[hmhaMenu]') as HTMLElement;
    dispatchArrowDown(panel);
    await expect(items[1]).toHaveFocus();

    // Archive (items[2]) is disabled — the next ArrowDown should land on
    // Delete (items[3]), not the disabled item in between.
    dispatchArrowDown(panel);
    await expect(items[3]).toHaveFocus();
  },
};

/** Selecting an enabled item invokes its own click handler and closes the menu. */
export const SelectionInteraction: Story = {
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);

    const rename = document.querySelector('[hmhaMenuItem]') as HTMLElement;
    await userEvent.click(rename);

    await expect(args.onRename).toHaveBeenCalledTimes(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Escape closes the menu and returns focus to the trigger. */
export const EscapeDismissInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await expect(document.querySelector('[hmhaMenu]')).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    await expect(document.querySelector('[hmhaMenu]')).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};

/** A click outside both the trigger and the panel dismisses it — the origin exclusion from fork 15 only exempts the trigger itself. */
export const OutsideClickDismissInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Actions' });
    await userEvent.click(trigger);
    await expect(document.querySelector('[hmhaMenu]')).toBeTruthy();

    await userEvent.click(document.body);
    await expect(document.querySelector('[hmhaMenu]')).toBeNull();
  },
};
