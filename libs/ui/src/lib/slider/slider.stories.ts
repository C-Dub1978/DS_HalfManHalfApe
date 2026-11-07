import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';
import { HmhaField } from '../field/field';
import { HmhaSlider } from './slider';

/*
 * What these play functions can and can't drive: arrow/Page/Home/End keys
 * and pointer drag moving a range input are the browser's own default
 * actions, and `userEvent` (testing-library, synthetic events) can't
 * perform them — the same gap as slider.spec.ts. The interactions below
 * drive what synthetic events *can* reach: the `input`/`change` events the
 * browser fires, and the pointer down/up the scrubbing state listens for.
 * Real keyboard and drag were verified against these stories with
 * Playwright's real input (DECISIONS.md, Wave 6 step 1c).
 */

const meta: Meta<HmhaSlider> = {
  title: 'Components/Slider',
  component: HmhaSlider,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaSlider, HmhaField, ReactiveFormsModule] })],
  argTypes: {
    value: { control: { type: 'number' } },
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' } },
    buffered: { control: { type: 'number' } },
    valueText: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    value: 40,
    min: 0,
    max: 100,
    step: 1,
    buffered: null,
    valueText: null,
    orientation: 'horizontal',
    size: 'md',
    disabled: false,
    invalid: false,
    valueChange: fn(),
    valueCommit: fn(),
    scrubbingChange: fn(),
  },
  // Wrapped in HmhaField for a real accessible label — a bare, unlabeled
  // slider fails the a11y "label" rule, same as every other control.
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 24rem;">
        <hmha-field label="Volume">
          <input
            hmhaSlider
            [value]="value"
            [min]="min"
            [max]="max"
            [step]="step"
            [buffered]="buffered"
            [valueText]="valueText"
            [orientation]="orientation"
            [size]="size"
            [disabled]="disabled"
            [invalid]="invalid"
            (valueChange)="valueChange($event)"
            (valueCommit)="valueCommit($event)"
            (scrubbingChange)="scrubbingChange($event)"
          />
        </hmha-field>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSlider>;

/** Default: a native `<input type="range">`, so role, keys, drag and form submission are the browser's own (fork 35). */
export const Playground: Story = {};

/** All three sizes. The thumb follows the icon scale; the host's height is the density-aware control height, so each lines up with a same-size button. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); max-width: 24rem;">
        <hmha-field label="Small"><input hmhaSlider size="sm" [value]="30" /></hmha-field>
        <hmha-field label="Medium"><input hmhaSlider size="md" [value]="50" /></hmha-field>
        <hmha-field label="Large"><input hmhaSlider size="lg" [value]="70" /></hmha-field>
      </div>
    `,
  }),
};

/**
 * A media seek bar: `step="any"`, a buffered band ahead of the fill, and
 * `valueText` so assistive tech hears a time, not a raw number. The values
 * are a still frame of playback: 83 s played, 140 s loaded, of 296 s.
 */
export const MediaTimeline: Story = {
  render: () => ({
    template: `
      <div style="max-width: 32rem;">
        <input
          hmhaSlider
          aria-label="Seek"
          step="any"
          [max]="296"
          [value]="83"
          [buffered]="140"
          valueText="1:23 of 4:56"
        />
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const slider = canvas.getByRole('slider', { name: 'Seek' }) as HTMLInputElement;
    await expect(slider).toHaveAttribute('aria-valuetext', '1:23 of 4:56');
    await expect(slider.step).toBe('any');
    await expect(slider.value).toBe('83');
    // 83 / 296 and 140 / 296 of the track, as the gradient's end points.
    await expect(parseFloat(slider.style.getPropertyValue('--_hmha-slider-fill'))).toBeCloseTo(28.04, 1);
    await expect(parseFloat(slider.style.getPropertyValue('--_hmha-slider-buffered'))).toBeCloseTo(47.3, 1);
  },
};

/**
 * A vertical volume control, scaled 0–1 to match `HTMLMediaElement.volume`.
 * Vertical runs bottom (min) to top (max); `--hmha-slider-length` sets its
 * height.
 */
export const VerticalVolume: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:flex-end; gap: var(--hmha-control-gap);">
        <input
          hmhaSlider
          aria-label="Volume"
          orientation="vertical"
          [max]="1"
          [step]="0.01"
          [value]="0.6"
          valueText="Volume 60%"
          style="--hmha-slider-length: calc(var(--hmha-control-height-lg) * 3);"
        />
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const slider = canvas.getByRole('slider', { name: 'Volume' }) as HTMLInputElement;
    await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    await expect(slider.value).toBe('0.6');
    // Drawn vertical for real, not just labelled so: taller than it is wide.
    const box = slider.getBoundingClientRect();
    await expect(box.height).toBeGreaterThan(box.width);
  },
};

/** The standalone disabled input. Works with or without Angular Forms. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('slider')).toBeDisabled();
  },
};

/** The standalone invalid input. Fill and thumb switch to the danger colour. */
export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvas }) => {
    const slider = canvas.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-invalid', 'true');
    await expect(slider).toHaveAttribute('data-invalid', '');
  },
};

/** Through Angular Forms and `HmhaField`: one value shared with `[(value)]` (fork 35), plus label, hint and required wiring. */
export const WithFormControl: Story = {
  render: () => ({
    props: { volume: new FormControl(25) },
    template: `
      <div style="max-width: 24rem;">
        <hmha-field label="Default volume" hint="Applies to every video." required="true">
          <input hmhaSlider [formControl]="volume" />
        </hmha-field>
        <p data-testid="form-value">Form value: {{ volume.value }}</p>
      </div>
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    const slider = canvas.getByRole('slider', { name: 'Default volume' }) as HTMLInputElement;
    const label = canvasElement.querySelector('label');
    const hint = canvasElement.querySelector('.hmha-field-hint');

    await expect(slider.value).toBe('25');
    await expect(label?.getAttribute('for')).toBe(slider.id);
    await expect(slider.getAttribute('aria-describedby')).toBe(hint?.id);
    await expect(slider).toHaveAttribute('aria-required', 'true');

    // What the browser fires when the user moves the thumb.
    slider.value = '70';
    await fireEvent.input(slider);
    await waitFor(() => expect(canvas.getByTestId('form-value')).toHaveTextContent('Form value: 70'));
  },
};

/** A user change emits `valueChange` continuously, then `valueCommit` once on release (seek on commit, not on every change). */
export const ChangeAndCommitInteraction: Story = {
  play: async ({ args, canvas }) => {
    const slider = canvas.getByRole('slider') as HTMLInputElement;

    slider.value = '55';
    await fireEvent.input(slider);
    slider.value = '60';
    await fireEvent.input(slider);
    await expect(args.valueChange).toHaveBeenLastCalledWith(60);
    await expect(args.valueCommit).not.toHaveBeenCalled();

    await fireEvent.change(slider);
    await expect(args.valueCommit).toHaveBeenCalledOnce();
    await expect(args.valueCommit).toHaveBeenCalledWith(60);
  },
};

/** Pointer down starts a scrub, release anywhere ends it, so a player can stop writing the playhead mid-drag. */
export const ScrubbingInteraction: Story = {
  play: async ({ args, canvas }) => {
    const slider = canvas.getByRole('slider');
    // One instance for both calls: each direct userEvent.pointer() call
    // starts from fresh pointer state, so a separate release call would be
    // releasing a button it never saw pressed — and fire no pointerup.
    const user = userEvent.setup();

    await user.pointer({ keys: '[MouseLeft>]', target: slider });
    await expect(args.scrubbingChange).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(slider).toHaveAttribute('data-scrubbing', ''));

    // Released somewhere else on the page, as a real drag often is.
    await user.pointer({ keys: '[/MouseLeft]', target: document.body });
    await expect(args.scrubbingChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(slider).not.toHaveAttribute('data-scrubbing'));
  },
};
