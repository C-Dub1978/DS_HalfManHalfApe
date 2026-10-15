import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaDivider } from './divider';

const meta: Meta<HmhaDivider> = {
  title: 'Components/Divider',
  component: HmhaDivider,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaDivider, HmhaIcon] })],
  argTypes: {
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
    length: { control: 'text' },
    color: { control: 'text' },
    inset: { control: 'boolean' },
  },
  args: {
    orientation: 'horizontal',
    length: null,
    color: null,
    inset: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px;">
        <p>Above the divider.</p>
        <hr hmhaDivider [orientation]="orientation" [length]="length" [color]="color" [inset]="inset" />
        <p>Below the divider.</p>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaDivider>;

/** Default — a real <hr>, horizontal, full width, no color/length override. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('[hmhaDivider]') as HTMLElement;
    await expect(divider.tagName).toBe('HR');
    await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
  },
};

/** orientation="vertical" — needs a sized ancestor (here, a fixed-height flex row) to actually show a line. */
export const Vertical: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: stretch; gap: 12px; height: 2.5rem;">
        <span>Left</span>
        <hr hmhaDivider orientation="vertical" />
        <span>Right</span>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('[hmhaDivider]') as HTMLElement;
    await expect(divider).toHaveAttribute('data-orientation', 'vertical');
    await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  },
};

/** The length input is a real runtime CSS length, not a token — it shortens the rule instead of filling the container. */
export const CustomLength: Story = {
  args: { length: '50%' },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('[hmhaDivider]') as HTMLElement;
    await expect(divider.style.width).toBe('50%');
  },
};

/** The color input forwards straight into --hmha-divider-color — any valid CSS color, including a reference to one of this library's own semantic tokens. */
export const CustomColor: Story = {
  args: { color: 'var(--hmha-color-danger)' },
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('[hmhaDivider]') as HTMLElement;
    await expect(divider.style.getPropertyValue('--hmha-divider-color')).toBe('var(--hmha-color-danger)');
  },
};

/** inset="true" — the real use case: a divider between list rows that shouldn't span under a leading icon/avatar. */
export const InsetInAList: Story = {
  render: () => ({
    template: `
      <div style="max-width: 320px; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
          <hmha-icon name="user" size="sm" />
          <span>Jordan Blake</span>
        </div>
        <hr hmhaDivider inset="true" />
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
          <hmha-icon name="user" size="sm" />
          <span>Sam Rivera</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const divider = canvasElement.querySelector('[hmhaDivider]') as HTMLElement;
    await expect(divider).toHaveAttribute('data-inset', '');
  },
};
