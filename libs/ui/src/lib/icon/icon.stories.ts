import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { HmhaIcon } from './icon';
import { HMHA_ICONS, type HmhaIconName } from './icon-registry';

const iconNames = Object.keys(HMHA_ICONS) as HmhaIconName[];

const meta: Meta<HmhaIcon> = {
  title: 'Components/Icon',
  component: HmhaIcon,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaIcon] })],
  argTypes: {
    name: {
      control: 'select',
      options: iconNames,
      description: `One of ${iconNames.length} icon names generated from Lucide.`,
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    name: 'check',
    size: 'md',
  },
};
export default meta;

type Story = StoryObj<HmhaIcon>;

/** Default — use the controls to try any of the 118 registered names and all three sizes. */
export const Playground: Story = {};

/** All three sizes side by side, same icon. */
export const Sizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex; align-items:center; gap:16px;">
        <hmha-icon [name]="name" size="sm" />
        <hmha-icon [name]="name" size="md" />
        <hmha-icon [name]="name" size="lg" />
      </div>
    `,
  }),
};

/** A sample of the curated set, to browse breadth rather than a single name. */
export const Gallery: Story = {
  render: () => ({
    props: { names: iconNames },
    template: `
      <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap: 16px;">
        @for (n of names; track n) {
          <hmha-icon [name]="n" />
        }
      </div>
    `,
  }),
};
