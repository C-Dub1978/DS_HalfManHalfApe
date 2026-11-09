import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaAlert, HmhaAlertTitle } from './alert';

/**
 * An upload that fails, the README's dismissible-error pattern end to end:
 * an assertive alert appears, Dismiss removes it through the app's own
 * `@if`, and focus goes back to the button that caused it. Story-local.
 */
@Component({
  selector: 'upload-failed-demo',
  imports: [HmhaAlert, HmhaAlertTitle, HmhaButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:grid; gap: var(--hmha-space-stack); max-width: 32rem;">
      <button hmhaButton tone="primary" #upload (click)="fail()">Upload movie.mkv</button>
      @if (error()) {
        <div hmhaAlert tone="danger" announce="assertive" dismissible (dismissed)="dismiss()">
          <strong hmhaAlertTitle>Upload failed</strong>
          {{ error() }}
        </div>
      }
    </div>
  `,
})
class UploadFailedDemo {
  protected readonly error = signal<string | null>(null);
  // `read: ElementRef`: #upload sits on a component host (HmhaButton), where
  // a template reference resolves to the component instance, not the element.
  private readonly upload = viewChild.required('upload', { read: ElementRef<HTMLButtonElement> });

  protected fail(): void {
    this.error.set('movie.mkv is larger than your remaining storage.');
  }

  protected dismiss(): void {
    this.error.set(null);
    // The Dismiss button just disappeared; put focus back where it started.
    this.upload().nativeElement.focus();
  }
}

const meta: Meta<HmhaAlert> = {
  title: 'Components/Alert',
  component: HmhaAlert,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaAlert, HmhaAlertTitle, HmhaButton, UploadFailedDemo] })],
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    announce: { control: 'inline-radio', options: ['none', 'polite', 'assertive'] },
    dismissible: { control: 'boolean' },
  },
  args: {
    tone: 'warning',
    announce: 'none',
    dismissible: false,
    dismissed: fn(),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 32rem;">
        <div hmhaAlert [tone]="tone" [announce]="announce" [dismissible]="dismissible" (dismissed)="dismissed()">
          <strong hmhaAlertTitle>You've used 90% of your storage</strong>
          Uploads will stop at 100%.
          <button hmhaButton size="sm" hmhaAlertActions>Upgrade storage</button>
        </div>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaAlert>;

/** A persistent, inline message: tone icon, title, message, actions (fork 42). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Warning' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Upgrade storage' })).toBeInTheDocument();
  },
};

/** The four tones. Each icon is named, so the tone is heard, not only seen. */
export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-control-gap); max-width: 32rem;">
        <div hmhaAlert tone="info"><strong hmhaAlertTitle>New in Stackfi</strong> Playlists can now mix audio and video.</div>
        <div hmhaAlert tone="success"><strong hmhaAlertTitle>Saved</strong> Your changes to "Big Buck Bunny" are saved.</div>
        <div hmhaAlert tone="warning"><strong hmhaAlertTitle>Storage almost full</strong> You've used 90% of your storage.</div>
        <div hmhaAlert tone="danger"><strong hmhaAlertTitle>Upload failed</strong> The connection was lost.</div>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    for (const name of ['Info', 'Success', 'Warning', 'Error']) {
      await expect(canvas.getByRole('img', { name })).toBeInTheDocument();
    }
  },
};

/** No title, no actions: just a message. No empty rows are left behind. */
export const MessageOnly: Story = {
  render: () => ({
    template: `
      <div style="max-width: 32rem;">
        <div hmhaAlert tone="info">Transcoding usually takes a few minutes per hour of video.</div>
      </div>
    `,
  }),
};

/**
 * A form error summary: a real heading (the page's next level) as the
 * title, and links to the fields that need fixing. The alert is for the
 * form as a whole; each field still shows its own error.
 */
export const FormErrorSummary: Story = {
  render: () => ({
    template: `
      <div style="max-width: 32rem;">
        <div hmhaAlert tone="danger">
          <h3 hmhaAlertTitle>2 things need fixing before you can save</h3>
          <!-- color: inherit, so the links take the alert's own text colour
               (CI-checked on every tone); browser-default blue is unreadable
               on the dark tones. -->
          <ul style="margin: 0; padding-inline-start: var(--hmha-space-stack);">
            <li><a href="#title" style="color: inherit;">Title can't be empty</a></li>
            <li><a href="#year" style="color: inherit;">Release year must be a number</a></li>
          </ul>
        </div>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 3, name: '2 things need fixing before you can save' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: "Title can't be empty" })).toBeInTheDocument();
  },
};

/** Dismissible: the button is named "Dismiss", and the alert reports the press rather than hiding itself. */
export const DismissibleInteraction: Story = {
  args: { dismissible: true, tone: 'info' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(args.dismissed).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('img', { name: 'Info' })).toBeInTheDocument();
  },
};

/**
 * An upload fails: an assertive alert appears and is announced as
 * "Error: Upload failed …" through CDK's live region. Dismissing removes it
 * through the app's own `@if`, and focus returns to the Upload button.
 */
export const UploadFailedInteraction: Story = {
  render: () => ({ template: `<upload-failed-demo />` }),
  play: async ({ canvas }) => {
    const upload = canvas.getByRole('button', { name: 'Upload movie.mkv' });
    await userEvent.click(upload);

    await waitFor(() => expect(canvas.getByRole('img', { name: 'Error' })).toBeInTheDocument());
    // The real live region CDK's LiveAnnouncer maintains (outside the canvas).
    await waitFor(() =>
      expect(document.querySelector('.cdk-live-announcer-element')).toHaveTextContent(
        'Error: Upload failed movie.mkv is larger than your remaining storage.',
      ),
    );
    await expect(document.querySelector('.cdk-live-announcer-element')).toHaveAttribute('aria-live', 'assertive');

    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(canvas.queryByRole('img', { name: 'Error' })).toBeNull());
    await expect(upload).toHaveFocus();
  },
};
