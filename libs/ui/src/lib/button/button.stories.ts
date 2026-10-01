import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaButton } from './button';

const meta: Meta<HmhaButton> = {
  title: 'Components/Button',
  component: HmhaButton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaButton, HmhaIcon] })],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'primary', 'danger', 'warning', 'success'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    tone: 'neutral',
    size: 'md',
    loading: false,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `<button hmhaButton [tone]="tone" [size]="size" [loading]="loading" [disabled]="disabled">Button</button>`,
  }),
};
export default meta;

type Story = StoryObj<HmhaButton>;

/** Default — attribute directive on a native <button>, all inputs controllable. */
export const Playground: Story = {};

/** All five tones side by side. */
export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button hmhaButton tone="neutral">Neutral</button>
        <button hmhaButton tone="primary">Primary</button>
        <button hmhaButton tone="danger">Danger</button>
        <button hmhaButton tone="warning">Warning</button>
        <button hmhaButton tone="success">Success</button>
      </div>
    `,
  }),
};

/** All three sizes side by side. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:12px;">
        <button hmhaButton tone="primary" size="sm">Small</button>
        <button hmhaButton tone="primary" size="md">Medium</button>
        <button hmhaButton tone="primary" size="lg">Large</button>
      </div>
    `,
  }),
};

export const Densities: Story = {
    render: () => ({
        template: `
            <strong style="">Compact Density</strong>
            <div style="display:flex; align-items:center; gap:12px;" data-hmha-density="compact">
                <button hmhaButton tone="primary" size="sm">Small</button>
                <button hmhaButton tone="primary" size="md">Medium</button>
                <button hmhaButton tone="primary" size="lg">Large</button>
            </div>

            <strong>Comfortable Density</strong>
            <div style="display:flex; align-items:center; gap:12px;" data-hmha-density="comfortable">
                <button hmhaButton tone="primary" size="sm">Small</button>
                <button hmhaButton tone="primary" size="md">Medium</button>
                <button hmhaButton tone="primary" size="lg">Large</button>
            </div>
        `
    })
};

/** loading sets aria-busy and disables the control. */
export const Loading: Story = {
  args: { loading: true, tone: 'primary' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeDisabled();
  },
};

/** disabled sets the native disabled attribute. */
export const Disabled: Story = {
  args: { disabled: true, tone: 'primary' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button');
    await expect(button).toBeDisabled();
  },
};

/** Composing an HmhaIcon into the default content slot — no extra markup needed. */
export const WithIcon: Story = {
  render: () => ({
    template: `
      <button hmhaButton tone="primary" size="sm">
        <hmha-icon name="check" size="sm" />
        Save
      </button>
    `,
  }),
};

/** Clicking fires the native click event consumers bind to. */
export const ClickInteraction: Story = {
  args: {
    tone: 'primary',
    onClick: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<button hmhaButton [tone]="tone" [size]="size" (click)="onClick()">Click me</button>`,
  }),
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: 'Click me' });
    await userEvent.click(button);
    await expect(args['onClick']).toHaveBeenCalled();
  },
};
