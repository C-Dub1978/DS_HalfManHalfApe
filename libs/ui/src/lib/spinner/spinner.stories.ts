import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaSpinner } from './spinner';

/**
 * A save button that goes busy on click, the way the Spinner README says to
 * compose it: `HmhaButton`'s own `loading` sets `aria-busy`, and the spinner
 * inside is decorative so it isn't announced twice. Local to this story
 * file; nothing here is library API.
 */
@Component({
  selector: 'saving-button-demo',
  imports: [HmhaButton, HmhaSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button hmhaButton tone="primary" [loading]="saving()" (click)="saving.set(true)">
      @if (saving()) {
        <hmha-spinner decorative size="sm" />
      }
      Save
    </button>
  `,
})
class SavingButtonDemo {
  protected readonly saving = signal(false);
}

const meta: Meta<HmhaSpinner> = {
  title: 'Components/Spinner',
  component: HmhaSpinner,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaSpinner, SavingButtonDemo] })],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
    decorative: { control: 'boolean' },
  },
  args: {
    size: 'md',
    label: 'Loading',
    decorative: false,
  },
  render: (args) => ({
    props: args,
    template: `<hmha-spinner [size]="size" [label]="label" [decorative]="decorative" />`,
  }),
};
export default meta;

type Story = StoryObj<HmhaSpinner>;

/** Default: an indeterminate progress bar to assistive tech, named "Loading" (fork 37). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading' })).not.toHaveAttribute('aria-valuenow');
  },
};

/** The icon scale: 16, 20 and 24px, matching the icons beside it. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
        <hmha-spinner size="sm" label="Loading small" />
        <hmha-spinner size="md" label="Loading medium" />
        <hmha-spinner size="lg" label="Loading large" />
      </div>
    `,
  }),
};

/** Name what's loading where you can, so the announcement means something. */
export const SpecificLabel: Story = {
  args: { label: 'Loading catalog' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading catalog' })).toBeInTheDocument();
  },
};

/** Decorative: no role and no name, hidden from assistive tech. Only for inside something that already says it's busy. */
export const Decorative: Story = {
  args: { decorative: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByRole('progressbar')).toBeNull();
    await expect(canvasElement.querySelector('hmha-spinner')).toHaveAttribute('aria-hidden', 'true');
  },
};

/**
 * A page-level loader: any length through `--hmha-spinner-size`, and a
 * colour through `--hmha-spinner-color` (here the action role, which
 * passes 3:1 against the page in both modes).
 */
export const PageLoader: Story = {
  render: () => ({
    template: `
      <hmha-spinner
        label="Loading your library"
        style="--hmha-spinner-size: var(--hmha-control-height-lg); --hmha-spinner-color: var(--hmha-color-action);"
      />
    `,
  }),
  play: async ({ canvas }) => {
    const spinner = canvas.getByRole('progressbar', { name: 'Loading your library' });
    const probe = document.createElement('div');
    probe.style.width = 'var(--hmha-control-height-lg)';
    document.body.appendChild(probe);
    const expected = probe.getBoundingClientRect().width;
    probe.remove();
    await expect(spinner.getBoundingClientRect().width).toBeCloseTo(expected, 0);
  },
};

/**
 * Inside a loading button: click Save and the button goes busy with a
 * decorative spinner, while its accessible name stays "Save", not
 * "Save Loading".
 */
export const InLoadingButtonInteraction: Story = {
  render: () => ({ template: `<saving-button-demo />` }),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Save' });
    await expect(button).not.toHaveAttribute('aria-busy');

    await userEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));
    await expect(button).toBeDisabled();
    await expect(button.querySelector('hmha-spinner')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryByRole('progressbar')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Save' })).toBe(button);
  },
};
