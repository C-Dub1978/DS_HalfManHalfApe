import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaField } from '../field/field';
import { HmhaSwitch } from './switch';

const meta: Meta<HmhaSwitch> = {
  title: 'Components/Switch',
  component: HmhaSwitch,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaSwitch, HmhaField] })],
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
  // switch fails the a11y "label" rule, same as every other control.
  render: (args) => ({
    props: args,
    template: `
      <hmha-field label="Enable notifications">
        <button hmhaSwitch [size]="size" [disabled]="disabled" [invalid]="invalid"></button>
      </hmha-field>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSwitch>;

/** Default — role="switch" + aria-checked on a native &lt;button&gt;, per WAI-ARIA's own switch pattern (fork 12). */
export const Playground: Story = {};

/** All three sizes side by side. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
        <hmha-field label="Small"><button hmhaSwitch size="sm"></button></hmha-field>
        <hmha-field label="Medium"><button hmhaSwitch size="md"></button></hmha-field>
        <hmha-field label="Large"><button hmhaSwitch size="lg"></button></hmha-field>
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
    const sw = canvas.getByRole('switch');
    await expect(sw).toHaveAttribute('aria-invalid', 'true');
    await expect(sw).toHaveAttribute('data-invalid', '');
  },
};

/** The HMHA_FIELD contract end to end — button is labelable, so this is the normal for/id association, not fork 11's aria-labelledby workaround. */
export const WithField: Story = {
  render: () => ({
    template: `
      <hmha-field label="Enable notifications" required="true" error="This setting is required.">
        <button hmhaSwitch></button>
      </hmha-field>
    `,
  }),
  play: async ({ canvasElement, canvas }) => {
    const sw = canvas.getByRole('switch') as HTMLButtonElement;
    const label = canvasElement.querySelector('label');
    const error = canvasElement.querySelector('.hmha-field-error');

    await expect(sw.id).toBeTruthy();
    await expect(label?.getAttribute('for')).toBe(sw.id);
    await expect(sw).toHaveAttribute('aria-required', 'true');
    await expect(sw).toHaveAttribute('aria-invalid', 'true');
    await expect(sw.getAttribute('aria-describedby')).toBe(error?.id);
  },
};

/** Clicking toggles aria-checked/data-checked — the same path a bound FormControl reads from. */
export const ToggleInteraction: Story = {
  play: async ({ canvas }) => {
    const sw = canvas.getByRole('switch');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await expect(sw).toHaveAttribute('data-checked', '');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
  },
};
