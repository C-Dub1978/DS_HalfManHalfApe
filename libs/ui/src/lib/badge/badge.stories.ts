import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaAvatar } from '../avatar/avatar';
import { HmhaButton } from '../button/button';
import { HmhaBadge } from './badge';

/**
 * A notifications button with an unread count: "Mark all read" zeroes it,
 * the badge hides itself, and the button's name drops the number. Local to
 * this story file; nothing here is library API.
 */
@Component({
  selector: 'notifications-demo',
  imports: [HmhaBadge, HmhaButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
      <button hmhaButton>
        Notifications
        <span hmhaBadge tone="danger" appearance="solid" [count]="unread()"></span>
      </button>
      <button hmhaButton tone="primary" (click)="unread.set(0)">Mark all read</button>
    </div>
  `,
})
class NotificationsDemo {
  protected readonly unread = signal(12);
}

const meta: Meta<HmhaBadge> = {
  title: 'Components/Badge',
  component: HmhaBadge,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaBadge, HmhaAvatar, NotificationsDemo] })],
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'primary', 'success', 'warning', 'danger'] },
    appearance: { control: 'inline-radio', options: ['subtle', 'solid'] },
    count: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    showZero: { control: 'boolean' },
    dot: { control: 'boolean' },
  },
  args: {
    tone: 'warning',
    appearance: 'subtle',
    count: null,
    max: 99,
    showZero: false,
    dot: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <span
        hmhaBadge
        [tone]="tone"
        [appearance]="appearance"
        [count]="count"
        [max]="max"
        [showZero]="showZero"
        [dot]="dot"
      >Processing</span>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaBadge>;

/** A status the app reports: plain text, never interactive (fork 40). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Processing')).toHaveAttribute('data-tone', 'warning');
  },
};

/** Every tone in both appearances. All ten pairings are CI-checked 4.5:1 text pairs in both modes. */
export const TonesAndAppearances: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-control-gap);">
        @for (appearance of ['subtle', 'solid']; track appearance) {
          <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
            <span hmhaBadge [appearance]="appearance" tone="neutral">Draft</span>
            <span hmhaBadge [appearance]="appearance" tone="primary">New</span>
            <span hmhaBadge [appearance]="appearance" tone="success">Ready</span>
            <span hmhaBadge [appearance]="appearance" tone="warning">Processing</span>
            <span hmhaBadge [appearance]="appearance" tone="danger">Failed</span>
          </div>
        }
      </div>
    `,
  }),
};

/** Counts: a number, capped at `max` with a plus; zero hides unless `showZero`. */
export const Counts: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);" data-testid="counts">
        <span hmhaBadge appearance="solid" tone="danger" [count]="3"></span>
        <span hmhaBadge appearance="solid" tone="danger" [count]="42"></span>
        <span hmhaBadge appearance="solid" tone="danger" [count]="150"></span>
        <span hmhaBadge appearance="solid" tone="primary" [count]="12" [max]="9"></span>
        <span hmhaBadge tone="neutral" [count]="0" data-testid="hidden-zero"></span>
        <span hmhaBadge tone="neutral" [count]="0" showZero></span>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const row = canvas.getByTestId('counts');
    await expect(row).toHaveTextContent('3');
    await expect(row).toHaveTextContent('99+');
    await expect(row).toHaveTextContent('9+');
    await expect(canvas.getByTestId('hidden-zero')).not.toBeVisible();
  },
};

/** Dots: always the tone's strong colour, and hidden from assistive tech. */
export const Dots: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
        <span hmhaBadge dot tone="neutral"></span>
        <span hmhaBadge dot tone="primary"></span>
        <span hmhaBadge dot tone="success"></span>
        <span hmhaBadge dot tone="warning"></span>
        <span hmhaBadge dot tone="danger"></span>
      </div>
    `,
  }),
};

/**
 * A status dot pinned to an avatar's corner, the README's plain-CSS
 * pattern. The dot is hidden, so the avatar's `label` carries the status.
 */
export const AvatarStatusDot: Story = {
  render: () => ({
    template: `
      <span style="position: relative; display: inline-flex;">
        <span hmhaAvatar size="lg" name="Chris Wilson" label="Chris Wilson, online"></span>
        <span
          hmhaBadge
          dot
          tone="success"
          style="position: absolute; inset-block-end: 0; inset-inline-end: 0; outline: calc(var(--hmha-border-width) * 2) solid var(--hmha-color-surface);"
        ></span>
      </span>
    `,
  }),
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Chris Wilson, online' });
    // Initials from `name`, not the label: "CW", never "CO".
    await expect(avatar).toHaveTextContent('CW');
  },
};

/**
 * A count inside a button reads as part of the button's name; marking all
 * read zeroes it, the badge hides itself, and the name drops the number.
 */
export const MarkAllReadInteraction: Story = {
  render: () => ({ template: `<notifications-demo />` }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Notifications 12' })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Mark all read' }));

    await waitFor(() => expect(canvas.getByRole('button', { name: 'Notifications' })).toBeInTheDocument());
  },
};
