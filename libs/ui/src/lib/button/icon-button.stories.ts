import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaButton } from './button';
import { HmhaIconButton } from './icon-button';

const meta: Meta<HmhaIconButton> = {
  title: 'Components/IconButton',
  component: HmhaIconButton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaButton, HmhaIconButton, HmhaIcon] })],
  argTypes: {
    label: { control: 'text' },
  },
  args: {
    label: 'More options',
  },
  render: (args) => ({
    props: args,
    template: `
      <button hmhaButton hmhaIconButton [label]="label" tone="neutral">
        <hmha-icon name="more-vertical" />
      </button>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaIconButton>;

/**
 * Default. `label` is required and becomes aria-label — getByRole below only
 * finds the button because that wiring works. `data-icon-only` squares the
 * control instead of letting the icon's intrinsic width drive it.
 */
export const Playground: Story = {
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: args['label'] as string });
    await expect(button).toHaveAttribute('data-icon-only', '');
  },
};

/** hmhaIconButton stacks on hmhaButton, so tone/size still apply normally. */
export const TonesAndSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <button hmhaButton hmhaIconButton label="More options" tone="neutral">
          <hmha-icon name="more-vertical" />
        </button>
        <button hmhaButton hmhaIconButton label="Delete" tone="danger" size="sm">
          <hmha-icon name="trash-2" size="sm" />
        </button>
        <button hmhaButton hmhaIconButton label="Confirm" tone="primary" size="lg">
          <hmha-icon name="check" size="lg" />
        </button>
      </div>
    `,
  }),
};
