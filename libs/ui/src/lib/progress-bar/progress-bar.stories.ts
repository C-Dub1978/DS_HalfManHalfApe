import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaProgressBar } from './progress-bar';

/**
 * A transcode job card, the way Stackfi will use the bar: indeterminate
 * while queued, determinate while running, red when it fails, and back to
 * indeterminate on retry. Local to this story file; nothing here is
 * library API.
 */
@Component({
  selector: 'transcode-job-demo',
  imports: [HmhaProgressBar, HmhaButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:grid; gap: var(--hmha-control-gap); max-width: 28rem;">
      <span id="job-label" data-testid="job-status">{{ status() }}</span>
      <progress
        hmhaProgressBar
        aria-labelledby="job-label"
        [value]="progress()"
        [tone]="failed() ? 'danger' : 'primary'"
        [valueText]="valueText()"
      ></progress>
      @if (failed()) {
        <button hmhaButton size="sm" (click)="retry()">Retry</button>
      }
    </div>
  `,
})
class TranscodeJobDemo {
  protected readonly progress = signal<number | null>(62);
  protected readonly failed = signal(true);

  protected readonly status = computed(() =>
    this.failed() ? 'Transcode failed at 62%' : this.progress() === null ? 'Queued for transcoding' : 'Transcoding',
  );
  protected readonly valueText = computed(() => (this.progress() === null ? null : `${this.progress()}%`));

  protected retry(): void {
    this.failed.set(false);
    this.progress.set(null);
  }
}

const meta: Meta<HmhaProgressBar> = {
  title: 'Components/Progress Bar',
  component: HmhaProgressBar,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaProgressBar, TranscodeJobDemo] })],
  argTypes: {
    value: { control: { type: 'number' }, description: 'Leave empty (null) for indeterminate.' },
    max: { control: { type: 'number' } },
    tone: { control: 'inline-radio', options: ['primary', 'success', 'danger'] },
    valueText: { control: 'text' },
  },
  args: {
    value: 40,
    max: 100,
    tone: 'primary',
    valueText: null,
  },
  // A visible <label for>: <progress> is labelable, so the native
  // association works with no ARIA at all.
  render: (args) => ({
    props: args,
    template: `
      <div style="display:grid; gap: var(--hmha-control-gap); max-width: 28rem;">
        <label for="playground-progress">Uploading movie.mp4</label>
        <progress
          hmhaProgressBar
          id="playground-progress"
          [value]="value"
          [max]="max"
          [tone]="tone"
          [valueText]="valueText"
        ></progress>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaProgressBar>;

/** Default: a native `<progress>`, so `role="progressbar"` and its value semantics are the browser's own (fork 36). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uploading movie.mp4' }) as HTMLProgressElement;
    await expect(bar.position).toBeCloseTo(0.4);
  },
};

/**
 * The three tones. Each fill is CI-checked at 3:1 against the track in both
 * modes. The label says the status too, since colour alone doesn't reach
 * everyone. No `warning`: amber can't reach 3:1 on a light track yet.
 */
export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); max-width: 28rem;">
        <div style="display:grid; gap: var(--hmha-control-gap);">
          <span id="tone-primary">Transcoding: 45%</span>
          <progress hmhaProgressBar aria-labelledby="tone-primary" [value]="45"></progress>
        </div>
        <div style="display:grid; gap: var(--hmha-control-gap);">
          <span id="tone-success">Upload complete</span>
          <progress hmhaProgressBar aria-labelledby="tone-success" tone="success" [value]="100"></progress>
        </div>
        <div style="display:grid; gap: var(--hmha-control-gap);">
          <span id="tone-danger">Transcode failed at 62%</span>
          <progress hmhaProgressBar aria-labelledby="tone-danger" tone="danger" [value]="62"></progress>
        </div>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Transcoding: 45%' })).toHaveAttribute('data-tone', 'primary');
    await expect(canvas.getByRole('progressbar', { name: 'Upload complete' })).toHaveAttribute('data-tone', 'success');
    await expect(canvas.getByRole('progressbar', { name: 'Transcode failed at 62%' })).toHaveAttribute('data-tone', 'danger');
  },
};

/**
 * No value: work is happening but its progress is unknown, such as a job
 * waiting in a queue. A segment sweeps the track; with reduced motion
 * requested, the track pulses in place instead.
 */
export const Indeterminate: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar') as HTMLProgressElement;
    await expect(bar).not.toHaveAttribute('value');
    await expect(bar.matches(':indeterminate')).toBe(true);
    await expect(getComputedStyle(bar).animationName).not.toBe('none');
  },
};

/** An upload in progress, with `valueText` so assistive tech hears sizes rather than a bare percentage. */
export const UploadWithValueText: Story = {
  args: { value: 42, max: 100, valueText: '42 MB of 100 MB' },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uploading movie.mp4' });
    await expect(bar).toHaveAttribute('aria-valuetext', '42 MB of 100 MB');
  },
};

/** Zero is a real, empty determinate bar, not the indeterminate state. */
export const EmptyNotIndeterminate: Story = {
  args: { value: 0 },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar') as HTMLProgressElement;
    await expect(bar).toHaveAttribute('value', '0');
    await expect(bar.matches(':indeterminate')).toBe(false);
    await expect(getComputedStyle(bar).animationName).toBe('none');
  },
};

/**
 * A failed transcode, retried: the bar goes from a red 62% straight back to
 * indeterminate ("queued"). Only removing the `value` attribute can do that
 * to a `<progress>` once it has had a value, which is why the component
 * binds it as an attribute.
 */
export const RetryReturnsToQueueInteraction: Story = {
  render: () => ({ template: `<transcode-job-demo />` }),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar') as HTMLProgressElement;
    await expect(bar).toHaveAttribute('data-tone', 'danger');
    await expect(bar.position).toBeCloseTo(0.62);

    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(bar.matches(':indeterminate')).toBe(true));
    await expect(bar).not.toHaveAttribute('value');
    await expect(bar).toHaveAttribute('data-tone', 'primary');
    await expect(canvas.getByTestId('job-status')).toHaveTextContent('Queued for transcoding');
    await expect(canvas.getByRole('progressbar', { name: 'Queued for transcoding' })).toBe(bar);
  },
};
