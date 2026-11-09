import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaField } from '../field/field';
import { HmhaIcon } from '../icon/icon';
import { HmhaInput } from '../input/input';
import { HmhaSegment } from './segment';
import { HmhaSegmentedControl } from './segmented-control';

/*
 * What these play functions can and can't drive: arrow keys moving the
 * selection between radios are the browser's own default action. The
 * keyboard story below uses `userEvent`, which simulates that behaviour
 * itself rather than producing it, so it documents the flow; the real
 * keyboard was verified against these stories with Playwright's real
 * input (DECISIONS.md, Wave 6 step 12c).
 */

const meta: Meta<HmhaSegmentedControl> = {
  title: 'Components/Segmented Control',
  component: HmhaSegmentedControl,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaSegmentedControl, HmhaSegment, HmhaIcon, HmhaButton, HmhaField, HmhaInput, ReactiveFormsModule],
    }),
  ],
  argTypes: {
    value: { control: 'inline-radio', options: ['movies', 'shows', 'music'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: {
    value: 'movies',
    size: 'md',
    disabled: false,
    valueChange: fn(),
  },
  render: (args) => ({
    props: args,
    template: `
      <fieldset
        hmhaSegmentedControl
        aria-label="Library"
        [value]="value"
        [size]="size"
        [disabled]="disabled"
        (valueChange)="valueChange($event)"
      >
        <label hmhaSegment value="movies">Movies</label>
        <label hmhaSegment value="shows">Shows</label>
        <label hmhaSegment value="music">Music</label>
      </fieldset>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSegmentedControl>;

/** One of several, always one selected: real radios drawn as one joined control (fork 48). Click a segment anywhere on it. */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Library' });
    await expect(group.tagName).toBe('FIELDSET');
    await expect(canvas.getByRole('radio', { name: 'Movies' })).toBeChecked();

    await userEvent.click(canvas.getByText('Shows'));
    await expect(args.valueChange).toHaveBeenCalledWith('shows');
    await expect(canvas.getByRole('radio', { name: 'Shows' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Movies' })).not.toBeChecked();
  },
};

/** The three sizes, each exactly a control height tall, so it lines up beside a button and an input of the same size. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); justify-items: start;">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <div style="display:flex; gap: var(--hmha-control-gap); align-items: center;">
            <fieldset hmhaSegmentedControl [attr.aria-label]="'Library, ' + size" value="shows" [size]="size">
              <label hmhaSegment value="movies">Movies</label>
              <label hmhaSegment value="shows">Shows</label>
              <label hmhaSegment value="music">Music</label>
            </fieldset>
            <button hmhaButton [size]="size">Button</button>
            <input hmhaInput [size]="size" [attr.aria-label]="'Search, ' + size" placeholder="Search" />
          </div>
        }
      </div>
    `,
  }),
};

/**
 * Icons with text, and icons alone. An icon-only segment takes `label`,
 * which names its radio; without one it throws. Here `[(value)]` drives a
 * view with no form at all.
 */
export const IconsAndViewSwitcherInteraction: Story = {
  render: () => ({
    props: { view: 'grid' },
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); justify-items: start;">
        <fieldset hmhaSegmentedControl aria-label="Library" value="movies">
          <label hmhaSegment value="movies"><hmha-icon name="image" /> Movies</label>
          <label hmhaSegment value="music"><hmha-icon name="list-music" /> Music</label>
        </fieldset>
        <fieldset hmhaSegmentedControl aria-label="View" size="sm" [(value)]="view">
          <label hmhaSegment value="grid" label="Grid"><hmha-icon name="layout-grid" /></label>
          <label hmhaSegment value="list" label="List"><hmha-icon name="list" /></label>
        </fieldset>
        <p>Showing your library as a <strong>{{ view }}</strong>.</p>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Grid' })).toBeChecked();
    await expect(canvas.getByText('grid')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('radio', { name: 'List' }));
    await waitFor(() => expect(canvas.getByText('list')).toBeInTheDocument());
    await expect(canvas.getByRole('radio', { name: 'Grid' })).not.toBeChecked();
  },
};

/** Given a width, the segments share it equally; by default they're all as wide as the widest. */
export const FullWidth: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); max-width: 28rem;">
        <fieldset hmhaSegmentedControl aria-label="Speed, content width" value="1">
          <label hmhaSegment value="0.5">0.5×</label>
          <label hmhaSegment value="1">Normal</label>
          <label hmhaSegment value="1.5">1.5×</label>
          <label hmhaSegment value="2">2×</label>
        </fieldset>
        <fieldset hmhaSegmentedControl aria-label="Speed, full width" value="1" style="width: 100%;">
          <label hmhaSegment value="0.5">0.5×</label>
          <label hmhaSegment value="1">Normal</label>
          <label hmhaSegment value="1.5">1.5×</label>
          <label hmhaSegment value="2">2×</label>
        </fieldset>
      </div>
    `,
  }),
};

/** One segment disabled, and the whole control disabled through the native fieldset. */
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); justify-items: start;">
        <fieldset hmhaSegmentedControl aria-label="Quality, 4K unavailable" value="1080p">
          <label hmhaSegment value="720p">720p</label>
          <label hmhaSegment value="1080p">1080p</label>
          <label hmhaSegment value="4k" disabled>4K</label>
        </fieldset>
        <fieldset hmhaSegmentedControl aria-label="Quality, all disabled" value="1080p" disabled>
          <label hmhaSegment value="720p">720p</label>
          <label hmhaSegment value="1080p">1080p</label>
          <label hmhaSegment value="4k">4K</label>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const one = within(canvas.getByRole('radiogroup', { name: 'Quality, 4K unavailable' }));
    await expect(one.getByRole('radio', { name: '4K' })).toBeDisabled();
    await expect(one.getByRole('radio', { name: '720p' })).toBeEnabled();
    const all = canvas.getByRole('radiogroup', { name: 'Quality, all disabled' });
    for (const radio of Array.from(all.querySelectorAll('input'))) {
      await expect(radio).toBeDisabled();
    }
  },
};

/** A setting with Forms, inside a field: the field's label names the group and its hint describes it. */
export const WithFormControlInteraction: Story = {
  render: () => {
    const quality = new FormControl('1080p', { nonNullable: true });
    return {
      props: { quality },
      template: `
        <div style="display:grid; gap: var(--hmha-space-stack); max-width: 24rem;">
          <hmha-field label="Playback quality" hint="Higher uses more data.">
            <fieldset hmhaSegmentedControl [formControl]="quality">
              <label hmhaSegment value="720p">720p</label>
              <label hmhaSegment value="1080p">1080p</label>
              <label hmhaSegment value="4k">4K</label>
            </fieldset>
          </hmha-field>
          <p>Form value: <output>{{ quality.value }}</output>, touched: <output>{{ quality.touched }}</output></p>
        </div>
      `,
    };
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Playback quality' });
    await expect(group).toHaveAccessibleDescription('Higher uses more data.');
    await expect(canvas.getByRole('radio', { name: '1080p' })).toBeChecked();

    await userEvent.click(canvas.getByText('4K'));
    await waitFor(() => expect(canvas.getByText('4k', { selector: 'output' })).toBeInTheDocument());
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByText('true', { selector: 'output' })).toBeInTheDocument());
  },
};

/** One Tab stop for the whole control, landing on the selected segment; arrow keys move and select, wrapping at the ends. */
export const KeyboardInteraction: Story = {
  args: { value: 'shows' },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const shows = canvas.getByRole('radio', { name: 'Shows' });
    await expect(shows).toHaveFocus();
    await expect(shows.closest('label')).toHaveStyle({ outlineStyle: 'solid' });

    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Music' })).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Movies' })).toBeChecked();
  },
};
