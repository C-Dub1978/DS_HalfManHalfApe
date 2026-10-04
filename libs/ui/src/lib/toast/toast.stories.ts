import { Component, inject, input } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaToast } from './toast';

/**
 * HmhaToast (fork 17) is a root-provided service with no selector of its
 * own — triggered via `inject(HmhaToast).show(text, durationMs)`, not a
 * directive attached to an element. This demo component exists only so
 * Storybook has something to render; the panel itself lives in the CDK
 * overlay container, a sibling of this story's root in the real DOM, not
 * a descendant of it — play functions below query `document` for it, not
 * `canvas`.
 */
@Component({
  selector: 'toast-demo',
  template: `
    <button type="button" (click)="showA()">Show A</button>
    <button type="button" (click)="showB()">Show B</button>
  `,
})
class ToastDemo {
  private readonly toast = inject(HmhaToast);
  readonly duration = input(1500);

  showA(): void {
    this.toast.show('Message A', this.duration());
  }

  showB(): void {
    this.toast.show('Message B', this.duration());
  }
}

const meta: Meta<ToastDemo> = {
  title: 'Components/Toast',
  component: ToastDemo,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [ToastDemo] })],
  argTypes: {
    duration: { control: 'number' },
  },
  args: {
    duration: 1500,
  },
};
export default meta;

type Story = StoryObj<ToastDemo>;

/** Default — a real live region (role="status", aria-live="polite") with the message text. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show A' }));

    // The panel is a ComponentPortal attached with no ViewContainerRef
    // (fork 17) — rendered via ApplicationRef.attachView() rather than a
    // view this test's own render pass owns, so its first paint isn't
    // guaranteed synchronous with the click that triggered it.
    await waitFor(() => expect(document.querySelector('[hmhaToastPanel]')).toBeTruthy());
    const panel = document.querySelector('[hmhaToastPanel]');
    await expect(panel).toHaveAttribute('role', 'status');
    await expect(panel).toHaveAttribute('aria-live', 'polite');
    await expect(panel).toHaveTextContent('Message A');
  },
};

/** The toast dismisses itself once its duration elapses — no manual close needed. */
export const AutoDismissInteraction: Story = {
  args: { duration: 50 },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show A' }));
    await waitFor(() => expect(document.querySelector('[hmhaToastPanel]')).toBeTruthy());

    await waitFor(() => expect(document.querySelector('[hmhaToastPanel]')).toBeNull());
  },
};

/** A second show() call while one is visible queues rather than replaces or stacks it — it appears once the first dismisses. */
export const QueuedMessagesInteraction: Story = {
  args: { duration: 50 },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show A' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Show B' }));
    await waitFor(() => expect(document.querySelector('[hmhaToastPanel]')).toHaveTextContent('Message A'));

    await waitFor(() => expect(document.querySelector('[hmhaToastPanel]')).toHaveTextContent('Message B'));
  },
};
