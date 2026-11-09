import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaSegment } from './segment';
import { HmhaSegmentedControl } from './segmented-control';

const meta: Meta<HmhaSegment> = {
  title: 'Components/Segment',
  component: HmhaSegment,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaSegmentedControl, HmhaSegment, HmhaIcon] })],
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    value: 'captions',
    label: undefined,
    disabled: false,
  },
  // A lone segment has nothing to belong to and throws (fork 48), so every
  // story puts it in the minimal control it needs, with one sibling.
  render: (args) => ({
    props: args,
    template: `
      <fieldset hmhaSegmentedControl aria-label="Subtitles" value="off">
        <label hmhaSegment value="off">Off</label>
        <label hmhaSegment [value]="value" [label]="label" [disabled]="disabled">Captions</label>
      </fieldset>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSegment>;

/** One segment: a label holding its own native radio, named by its text. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const radio = canvas.getByRole('radio', { name: 'Captions' });
    await expect(radio.closest('label')).toHaveAttribute('hmhaSegment');
    await expect(radio).not.toBeChecked();
  },
};

/** An icon-only segment, named by `label`, since an icon alone has no accessible name. */
export const IconOnly: Story = {
  render: () => ({
    template: `
      <fieldset hmhaSegmentedControl aria-label="Subtitles" value="on">
        <label hmhaSegment value="off" label="Captions off"><hmha-icon name="captions-off" /></label>
        <label hmhaSegment value="on" label="Captions on"><hmha-icon name="captions" /></label>
      </fieldset>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Captions on' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Captions off' })).not.toBeChecked();
  },
};

/** This segment disabled; its sibling still works. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Captions' })).toBeDisabled();
    await expect(canvas.getByRole('radio', { name: 'Off' })).toBeEnabled();
  },
};
