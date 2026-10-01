import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaRadio } from './radio';
import { HmhaRadioGroup } from './radio-group';

const meta: Meta<HmhaRadio> = {
  title: 'Components/Radio',
  component: HmhaRadio,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaRadioGroup, HmhaRadio] })],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    size: 'md',
  },
  // A lone HmhaRadio has no meaning (see DECISIONS.md fork 11) — every
  // story wraps it in the minimal group it needs to function.
  render: (args) => ({
    props: args,
    template: `
      <fieldset hmhaRadioGroup>
        <legend>Plan size</legend>
        <label><input type="radio" hmhaRadio value="small" [size]="size" /> Small</label>
        <label><input type="radio" hmhaRadio value="medium" [size]="size" /> Medium</label>
      </fieldset>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaRadio>;

/** Default — an attribute directive on native <input type="radio">; the check mark is browser-rendered via accent-color (fork 10). */
export const Playground: Story = {};

/** All three sizes, each its own minimal group (size is per-radio, not group-wide). */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--hmha-space-stack);">
        <fieldset hmhaRadioGroup><legend>Small</legend>
          <label><input type="radio" hmhaRadio value="a" size="sm" /> Option</label>
        </fieldset>
        <fieldset hmhaRadioGroup><legend>Medium</legend>
          <label><input type="radio" hmhaRadio value="a" size="md" /> Option</label>
        </fieldset>
        <fieldset hmhaRadioGroup><legend>Large</legend>
          <label><input type="radio" hmhaRadio value="a" size="lg" /> Option</label>
        </fieldset>
      </div>
    `,
  }),
};

/** A single radio disabled via its own standalone input, independent of its siblings — the group itself stays enabled. */
export const IndividuallyDisabled: Story = {
  render: () => ({
    template: `
      <fieldset hmhaRadioGroup>
        <legend>Plan size</legend>
        <label><input type="radio" hmhaRadio value="small" /> Small</label>
        <label><input type="radio" hmhaRadio value="medium" disabled="true" /> Medium (unavailable)</label>
        <label><input type="radio" hmhaRadio value="large" /> Large</label>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement }) => {
    const small = canvasElement.querySelector('input[value="small"]') as HTMLInputElement;
    const medium = canvasElement.querySelector('input[value="medium"]') as HTMLInputElement;
    await expect(small.disabled).toBe(false);
    await expect(medium.disabled).toBe(true);
  },
};
