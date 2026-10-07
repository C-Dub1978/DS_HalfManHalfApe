import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaDialog } from './dialog';
import { HmhaDrawer } from './drawer';

const meta: Meta<HmhaDrawer> = {
  title: 'Components/Drawer',
  component: HmhaDrawer,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaDialog, HmhaDrawer] })],
  argTypes: {
    placement: { control: 'radio', options: ['start', 'end'] },
  },
  args: {
    placement: 'start',
  },
  // A second directive stacking on hmhaDialog on the same native
  // <dialog> — every bit of open/dismiss/focus-trap/backdrop behavior
  // is HmhaDialog's own, completely unchanged (DECISIONS.md fork 26).
  render: (args) => ({
    props: { ...args, open: false },
    template: `
      <button type="button" (click)="open = true">Open navigation</button>
      <dialog hmhaDialog hmhaDrawer [placement]="placement" [open]="open" (openChange)="open = $event" aria-labelledby="nav-title">
        <h2 id="nav-title">Navigation</h2>
        <nav>
          <p>Dashboard</p>
          <p>Settings</p>
        </nav>
        <button type="button" (click)="open = false">Close</button>
      </dialog>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaDrawer>;

/** Default — anchored to the start (left in LTR) edge, full height. */
export const Playground: Story = {};

/** placement="end" anchors to the trailing edge instead. */
export const PlacementEnd: Story = {
  render: () => ({
    props: { open: false },
    template: `
      <button type="button" (click)="open = true">Open navigation</button>
      <dialog hmhaDialog hmhaDrawer placement="end" [open]="open" (openChange)="open = $event" aria-labelledby="nav-title">
        <h2 id="nav-title">Navigation</h2>
        <nav>
          <p>Dashboard</p>
          <p>Settings</p>
        </nav>
        <button type="button" (click)="open = false">Close</button>
      </dialog>
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;
    await expect(dialog).toHaveAttribute('data-placement', 'end');
  },
};

/** Clicking the trigger opens a real modal — showModal() called, a true :modal, exactly like a plain HmhaDialog. */
export const OpenInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;
    await expect(dialog.open).toBe(true);
    await expect(dialog.matches(':modal')).toBe(true);
  },
};

/** A backdrop click still closes it — dismissal is HmhaDialog's own untouched logic. */
export const BackdropDismissInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;

    // Simulated directly, same as HmhaDialog's own BackdropDismissInteraction
    // story — a real click lands with event.target === the dialog itself
    // only when it hits the backdrop, which isn't reliable to hit at real
    // screen coordinates across viewport sizes.
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect(dialog.open).toBe(false);
  },
};
