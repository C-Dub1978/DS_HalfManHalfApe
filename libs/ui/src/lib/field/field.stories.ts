import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaField } from './field';

const INPUT_STYLE =
  'width:100%; box-sizing:border-box; padding: var(--hmha-control-padding-y) var(--hmha-control-padding-x); ' +
  'border-radius: var(--hmha-radius-control); border: var(--hmha-border-width) solid var(--hmha-color-border); font: inherit;';

const meta: Meta<HmhaField> = {
  title: 'Components/Field',
  component: HmhaField,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaField] })],
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
  },
  args: {
    label: 'Email',
    hint: '',
    error: '',
    required: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <hmha-field [label]="label" [hint]="hint" [error]="error" [required]="required" style="max-width: 320px;">
        <input type="email" placeholder="you@example.com" style="${INPUT_STYLE}" />
      </hmha-field>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaField>;

/**
 * Default. A plain native <input> stands in here — HmhaInput ships in a
 * later Wave 2 step and will consume the HMHA_FIELD context automatically.
 * This story exercises HmhaField's own rendering; the DI wiring is covered
 * by field.spec.ts's HMHA_FIELD tests.
 */
export const Playground: Story = {};

/** hint text shown, no error. */
export const WithHint: Story = {
  args: { hint: "We'll never share your email." },
  play: async ({ canvasElement }) => {
    const hint = canvasElement.querySelector('.hmha-field-hint');
    await expect(hint?.textContent).toContain("We'll never share your email.");
    await expect(canvasElement.querySelector('.hmha-field-error')).toBeNull();
  },
};

/** error replaces hint entirely, announced via role="alert". */
export const WithError: Story = {
  args: { hint: "We'll never share your email.", error: 'Enter a valid email address.' },
  play: async ({ canvasElement }) => {
    const error = canvasElement.querySelector('.hmha-field-error');
    await expect(error?.textContent).toContain('Enter a valid email address.');
    await expect(error?.getAttribute('role')).toBe('alert');
    await expect(canvasElement.querySelector('.hmha-field-hint')).toBeNull();
  },
};

/** required shows an aria-hidden asterisk next to the label. */
export const Required: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const marker = canvasElement.querySelector('.hmha-field-required');
    await expect(marker).toBeTruthy();
    await expect(marker?.getAttribute('aria-hidden')).toBe('true');
  },
};

/**
 * A small realistic form: several fields stacked, showing the vertical
 * rhythm and an error in context. Each input's id/aria-invalid/
 * aria-describedby is wired from a template reference to its field (via
 * `exportAs: 'hmhaField'`) — the same values a real control would read from
 * HMHA_FIELD via DI instead.
 */
export const FormExample: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--hmha-space-stack); max-width: 320px;">
        <hmha-field label="Full name" required="true" #nameField="hmhaField">
          <input
            style="${INPUT_STYLE}"
            placeholder="Jane Doe"
            [attr.id]="nameField.controlId()"
            [attr.aria-required]="nameField.required()"
          />
        </hmha-field>
        <hmha-field label="Email" required="true" error="Enter a valid email address." #emailField="hmhaField">
          <input
            type="email"
            style="${INPUT_STYLE}"
            value="not-an-email"
            [attr.id]="emailField.controlId()"
            [attr.aria-required]="emailField.required()"
            [attr.aria-invalid]="emailField.invalid()"
            [attr.aria-describedby]="emailField.describedBy()"
          />
        </hmha-field>
        <hmha-field label="Company" hint="Optional." #companyField="hmhaField">
          <input
            style="${INPUT_STYLE}"
            placeholder="Acme Inc."
            [attr.id]="companyField.controlId()"
            [attr.aria-describedby]="companyField.describedBy()"
          />
        </hmha-field>
      </div>
    `,
  }),
};
