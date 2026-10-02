import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaDialog } from './dialog';

const meta: Meta<HmhaDialog> = {
  title: 'Components/Dialog',
  component: HmhaDialog,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaDialog] })],
  argTypes: {
    dismissible: { control: 'boolean' },
  },
  args: {
    dismissible: true,
  },
  // Native <dialog> + showModal() (fork 14), not hmhaOverlay — the
  // accessible name is the consumer's job (a heading + aria-labelledby),
  // same as the README documents.
  render: (args) => ({
    props: { ...args, open: false },
    template: `
      <button type="button" (click)="open = true">Open dialog</button>
      <dialog hmhaDialog [open]="open" (openChange)="open = $event" [dismissible]="dismissible" aria-labelledby="dlg-title">
        <h2 id="dlg-title">Delete item?</h2>
        <p>This action cannot be undone.</p>
        <button type="button" (click)="open = false">Cancel</button>
      </dialog>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaDialog>;

/** Default — click to open; Escape, a backdrop click, or the Cancel button all close it. */
export const Playground: Story = {};

/** Clicking the trigger opens a real modal — showModal() called, a true :modal, not just a visible block. */
export const OpenInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;
    await expect(dialog.open).toBe(true);
    await expect(dialog.matches(':modal')).toBe(true);
  },
};

/** The dialog's own Cancel button closes it — the content-driven close path. */
export const CloseViaContentInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;
    await expect(dialog.open).toBe(true);

    const cancel = canvas.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancel);
    await expect(dialog.open).toBe(false);
  },
};

/** A click on the backdrop (outside the dialog's own content box) closes a dismissible dialog. */
export const BackdropDismissInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;

    // A real backdrop click lands with event.target === the dialog element
    // itself — simulated directly, since clicking real screen coordinates
    // outside the content box isn't reliable across viewport sizes.
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect(dialog.open).toBe(false);
  },
};

/** dismissible=false blocks backdrop-click dismissal — only the dialog's own content can close it. */
export const NonDismissible: Story = {
  args: { dismissible: false },
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    const dialog = canvasElement.querySelector('dialog') as HTMLDialogElement;

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect(dialog.open).toBe(true);

    const cancel = canvas.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancel);
    await expect(dialog.open).toBe(false);
  },
};
