import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaField } from '../field/field';
import { HmhaInput } from './input';

const meta: Meta<HmhaInput> = {
  title: 'Components/Input',
  component: HmhaInput,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaInput, HmhaField] })],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    size: 'md',
    disabled: false,
    invalid: false,
  },
  // Every demo input is wrapped in HmhaField — a bare, unlabeled <input>
  // fails the a11y "label" rule, and this is the real intended usage anyway.
  render: (args) => ({
    props: args,
    template: `
      <hmha-field label="Email" style="max-width: 320px;">
        <input hmhaInput type="email" placeholder="you@example.com" [size]="size" [disabled]="disabled" [invalid]="invalid" />
      </hmha-field>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaInput>;

/** Default — an attribute directive on the native <input>, so type/placeholder/autofill all stay native. */
export const Playground: Story = {};

/** All three sizes side by side. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--hmha-space-stack); max-width: 320px;">
        <hmha-field label="Small"><input hmhaInput size="sm" placeholder="sm" /></hmha-field>
        <hmha-field label="Medium"><input hmhaInput size="md" placeholder="md" /></hmha-field>
        <hmha-field label="Large"><input hmhaInput size="lg" placeholder="lg" /></hmha-field>
      </div>
    `,
  }),
};

/** The standalone disabled input — works with or without Angular Forms. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** The standalone invalid input — sets aria-invalid/data-invalid without needing an HmhaField error. */
export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('data-invalid', '');
  },
};

/**
 * The HMHA_FIELD contract end to end, with the real HmhaInput (not the
 * plain-native-input stand-in field.stories.ts uses, since HmhaInput didn't
 * exist yet when that was written) — id/aria-describedby/aria-required and
 * the error-driven invalid state all wire themselves up automatically.
 */
export const WithField: Story = {
  render: () => ({
    template: `
      <hmha-field label="Email" required="true" error="Enter a valid email address." style="max-width: 320px;">
        <input hmhaInput type="email" value="not-an-email" />
      </hmha-field>
    `,
  }),
  play: async ({ canvasElement, canvas }) => {
    const input = canvas.getByRole('textbox') as HTMLInputElement;
    const label = canvasElement.querySelector('label');
    const error = canvasElement.querySelector('.hmha-field-error');

    await expect(input.id).toBeTruthy();
    await expect(label?.getAttribute('for')).toBe(input.id);
    await expect(input).toHaveAttribute('aria-required', 'true');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input.getAttribute('aria-describedby')).toBe(error?.id);
  },
};

/** Typing updates the value — the same path a bound FormControl reads from. */
export const TypingInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'jane@example.com');
    await expect(input).toHaveValue('jane@example.com');
  },
};

/** Multi-line text: the same HmhaInput on a native <textarea>. `rows` sets its height; it resizes vertically only (fork 46). */
export const Textarea: Story = {
  render: () => ({
    template: `
      <hmha-field label="Description" hint="Shown on the title's detail page." style="max-width: 420px;">
        <textarea hmhaInput rows="4"></textarea>
      </hmha-field>
    `,
  }),
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Description' });
    await expect(textarea.tagName).toBe('TEXTAREA');
    await expect(getComputedStyle(textarea).resize).toBe('vertical');
  },
};

/**
 * `autoGrow`: it grows with the text as you type (CSS `field-sizing`, no
 * script), from three lines, up to a cap set here with
 * `--hmha-input-max-block-size`, then scrolls.
 */
export const TextareaAutoGrowInteraction: Story = {
  render: () => ({
    template: `
      <hmha-field label="Notes" style="max-width: 420px;">
        <textarea hmhaInput autoGrow style="--hmha-input-max-block-size: 12rem;"></textarea>
      </hmha-field>
    `,
  }),
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement;
    const start = textarea.getBoundingClientRect().height;
    await userEvent.type(textarea, 'One{Enter}Two{Enter}Three{Enter}Four{Enter}Five{Enter}Six');
    await waitFor(() => expect(textarea.getBoundingClientRect().height).toBeGreaterThan(start));
  },
};

/**
 * A soft character limit (fork 47): the field counts down, says how many
 * too many once over, in the error colour, and the control goes invalid.
 * Nothing is cut off. Near and over the limit it's announced politely once
 * typing pauses.
 */
export const CharacterCounterInteraction: Story = {
  render: () => ({
    template: `
      <hmha-field label="Title" hint="The name shown in your library." style="max-width: 420px;">
        <input hmhaInput [maxCharacters]="20" />
      </hmha-field>
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    const title = canvas.getByRole('textbox', { name: 'Title' });
    const counter = canvasElement.querySelector('.hmha-field-counter')!;
    await expect(counter).toHaveTextContent('You have 20 characters remaining');
    await expect(title).toHaveAccessibleDescription(
      'The name shown in your library. You have 20 characters remaining',
    );

    await userEvent.type(title, 'Big Buck Bunny 2008');
    await waitFor(() => expect(counter).toHaveTextContent('You have 1 character remaining'));
    await waitFor(() =>
      expect(document.querySelector('.cdk-live-announcer-element')).toHaveTextContent('You have 1 character remaining'),
    );

    await userEvent.type(title, ' (remastered)');
    await waitFor(() => expect(counter).toHaveTextContent('You have 12 characters too many'));
    await expect(title).toHaveValue('Big Buck Bunny 2008 (remastered)');
    await expect(title).toHaveAttribute('aria-invalid', 'true');
  },
};

