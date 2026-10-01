import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaField } from '../field/field';
import { HmhaRadio } from './radio';
import { HmhaRadioGroup } from './radio-group';

const meta: Meta<HmhaRadioGroup> = {
  title: 'Components/RadioGroup',
  component: HmhaRadioGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaRadioGroup, HmhaRadio, HmhaField] })],
  argTypes: {
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    disabled: false,
    invalid: false,
  },
  // Native <legend> is the group's label here — HmhaField integration
  // (aria-labelledby instead, since <fieldset> isn't labelable) gets its
  // own story below.
  render: (args) => ({
    props: args,
    template: `
      <fieldset hmhaRadioGroup [disabled]="disabled" [invalid]="invalid">
        <legend>Plan size</legend>
        <label><input type="radio" hmhaRadio value="small" /> Small</label>
        <label><input type="radio" hmhaRadio value="medium" /> Medium</label>
        <label><input type="radio" hmhaRadio value="large" /> Large</label>
      </fieldset>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaRadioGroup>;

/** Default — the fieldset holds the selected value; HmhaRadio only ever talks to the group, never Forms directly. */
export const Playground: Story = {};

/** disabled on the group cascades to every radio natively — no per-radio wiring needed. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** The standalone invalid input — sets aria-invalid/data-invalid on the fieldset without needing an HmhaField error. */
export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvasElement }) => {
    const fieldset = canvasElement.querySelector('fieldset');
    await expect(fieldset).toHaveAttribute('aria-invalid', 'true');
    await expect(fieldset).toHaveAttribute('data-invalid', '');
  },
};

/**
 * The HMHA_FIELD contract end to end. <fieldset> can't be labelled via
 * `label[for]`, so this uses aria-labelledby (HmhaFieldContext.labelId)
 * instead — and required propagates past the fieldset's aria-required to
 * each radio's own native `required` attribute.
 */
export const WithField: Story = {
  render: () => ({
    template: `
      <hmha-field label="Choose a plan" required="true" error="Select a plan to continue.">
        <fieldset hmhaRadioGroup>
          <label><input type="radio" hmhaRadio value="small" /> Small</label>
          <label><input type="radio" hmhaRadio value="medium" /> Medium</label>
          <label><input type="radio" hmhaRadio value="large" /> Large</label>
        </fieldset>
      </hmha-field>
    `,
  }),
  play: async ({ canvasElement }) => {
    const fieldset = canvasElement.querySelector('fieldset') as HTMLFieldSetElement;
    const label = canvasElement.querySelector('label.hmha-field-label');
    const error = canvasElement.querySelector('.hmha-field-error');
    const radios = Array.from(canvasElement.querySelectorAll('input[type="radio"]'));

    await expect(fieldset.hasAttribute('for')).toBe(false);
    await expect(fieldset.getAttribute('aria-labelledby')).toBe(label?.id);
    await expect(fieldset).toHaveAttribute('aria-invalid', 'true');
    await expect(fieldset.getAttribute('aria-describedby')).toBe(error?.id);
    for (const radio of radios) {
      await expect(radio).toHaveAttribute('required');
    }
  },
};

/** Selecting a radio checks it and unchecks its siblings — the core behaviour a radio group exists for. */
export const SelectionInteraction: Story = {
  play: async ({ canvasElement }) => {
    const small = canvasElement.querySelector('input[value="small"]') as HTMLInputElement;
    const medium = canvasElement.querySelector('input[value="medium"]') as HTMLInputElement;

    await userEvent.click(small);
    await expect(small.checked).toBe(true);
    await expect(medium.checked).toBe(false);

    await userEvent.click(medium);
    await expect(small.checked).toBe(false);
    await expect(medium.checked).toBe(true);
  },
};
