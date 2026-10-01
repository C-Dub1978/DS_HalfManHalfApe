import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaField } from '../field/field';
import { HmhaCheckbox } from './checkbox';

const meta: Meta<HmhaCheckbox> = {
  title: 'Components/Checkbox',
  component: HmhaCheckbox,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaCheckbox, HmhaField] })],
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
  // Wrapped in HmhaField for a real accessible label — a bare, unlabeled
  // checkbox fails the a11y "label" rule.
  render: (args) => ({
    props: args,
    template: `
      <hmha-field label="Subscribe to updates">
        <input type="checkbox" hmhaCheckbox [size]="size" [disabled]="disabled" [invalid]="invalid" />
      </hmha-field>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaCheckbox>;

/** Default — an attribute directive on native <input type="checkbox">; the check mark is browser-rendered via accent-color (fork 10). */
export const Playground: Story = {};

/** All three sizes side by side. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--hmha-space-stack);">
        <hmha-field label="Small"><input type="checkbox" hmhaCheckbox size="sm" /></hmha-field>
        <hmha-field label="Medium"><input type="checkbox" hmhaCheckbox size="md" /></hmha-field>
        <hmha-field label="Large"><input type="checkbox" hmhaCheckbox size="lg" /></hmha-field>
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
    const checkbox = canvas.getByRole('checkbox');
    await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    await expect(checkbox).toHaveAttribute('data-invalid', '');
  },
};

/** The HMHA_FIELD contract end to end — a required, currently-invalid checkbox with an error message. */
export const WithField: Story = {
  render: () => ({
    template: `
      <hmha-field label="I agree to the terms" required="true" error="You must agree to continue.">
        <input type="checkbox" hmhaCheckbox />
      </hmha-field>
    `,
  }),
  play: async ({ canvasElement, canvas }) => {
    const checkbox = canvas.getByRole('checkbox') as HTMLInputElement;
    const label = canvasElement.querySelector('label');
    const error = canvasElement.querySelector('.hmha-field-error');

    await expect(checkbox.id).toBeTruthy();
    await expect(label?.getAttribute('for')).toBe(checkbox.id);
    await expect(checkbox).toHaveAttribute('aria-required', 'true');
    await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    await expect(checkbox.getAttribute('aria-describedby')).toBe(error?.id);
  },
};

/** Clicking toggles the checked state — the same path a bound FormControl reads from. */
export const ToggleInteraction: Story = {
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox') as HTMLInputElement;
    await expect(checkbox.checked).toBe(false);
    await userEvent.click(checkbox);
    await expect(checkbox.checked).toBe(true);
    await userEvent.click(checkbox);
    await expect(checkbox.checked).toBe(false);
  },
};
