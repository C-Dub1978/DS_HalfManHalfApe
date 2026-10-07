import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaStep } from './step';
import { HmhaStepList } from './step-list';
import { HmhaStepPanel } from './step-panel';
import { HmhaStepper } from './stepper';

const meta: Meta<HmhaStepper> = {
  title: 'Components/Stepper',
  component: HmhaStepper,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaStepper, HmhaStepList, HmhaStep, HmhaStepPanel] })],
  // Four attribute-selector pieces on native elements, no custom tag names
  // (DECISIONS.md fork 24) — a step and its panel match by a shared string
  // `value`, the same shape as HmhaTabs/HmhaTab/HmhaTabPanel (fork 18).
  render: () => ({
    template: `
      <div hmhaStepper value="shipping">
        <div hmhaStepList>
          <button hmhaStep value="account">Account</button>
          <button hmhaStep value="shipping">Shipping</button>
          <button hmhaStep value="payment">Payment</button>
        </div>
        <div hmhaStepPanel value="account">Account details go here.</div>
        <div hmhaStepPanel value="shipping">Shipping details go here.</div>
        <div hmhaStepPanel value="payment">Payment details go here.</div>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaStepper>;

/** Default — the middle step is active: the first is completed (check icon), the last is upcoming (its number, natively disabled). */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const account = canvasElement.querySelector('[value="account"][hmhastep]') as HTMLButtonElement;
    const shipping = canvasElement.querySelector('[value="shipping"][hmhastep]') as HTMLButtonElement;
    const payment = canvasElement.querySelector('[value="payment"][hmhastep]') as HTMLButtonElement;

    await expect(account).toHaveAttribute('data-state', 'completed');
    await expect(account.querySelector('.hmha-step-indicator svg')).toBeTruthy();
    await expect(account.disabled).toBe(false);

    await expect(shipping).toHaveAttribute('data-state', 'active');
    await expect(shipping).toHaveAttribute('aria-current', 'step');

    await expect(payment).toHaveAttribute('data-state', 'upcoming');
    await expect(payment.disabled).toBe(true);
  },
};

/** The last step active — every earlier step is completed. */
export const AllPriorStepsCompleted: Story = {
  render: () => ({
    template: `
      <div hmhaStepper value="payment">
        <div hmhaStepList>
          <button hmhaStep value="account">Account</button>
          <button hmhaStep value="shipping">Shipping</button>
          <button hmhaStep value="payment">Payment</button>
        </div>
        <div hmhaStepPanel value="account">Account details go here.</div>
        <div hmhaStepPanel value="shipping">Shipping details go here.</div>
        <div hmhaStepPanel value="payment">Payment details go here.</div>
      </div>
    `,
  }),
};

/** hasError is independent of state — a completed step can still show its error badge instead of a check. */
export const ErrorOnACompletedStep: Story = {
  render: () => ({
    template: `
      <div hmhaStepper value="payment">
        <div hmhaStepList>
          <button hmhaStep value="account">Account</button>
          <button hmhaStep value="shipping" hasError="true">Shipping</button>
          <button hmhaStep value="payment">Payment</button>
        </div>
        <div hmhaStepPanel value="account">Account details go here.</div>
        <div hmhaStepPanel value="shipping">Shipping details go here.</div>
        <div hmhaStepPanel value="payment">Payment details go here.</div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const shipping = canvasElement.querySelector('[value="shipping"][hmhastep]') as HTMLButtonElement;
    await expect(shipping).toHaveAttribute('data-state', 'completed');
    await expect(shipping).toHaveAttribute('data-error', '');
    await expect(shipping.querySelector('.hmha-step-indicator svg')).toBeTruthy();
  },
};

/** An explicit disabled input wins even on an otherwise-reachable (active) step. */
export const DisabledStep: Story = {
  render: () => ({
    template: `
      <div hmhaStepper value="shipping">
        <div hmhaStepList>
          <button hmhaStep value="account">Account</button>
          <button hmhaStep value="shipping" disabled="true">Shipping</button>
          <button hmhaStep value="payment">Payment</button>
        </div>
        <div hmhaStepPanel value="account">Account details go here.</div>
        <div hmhaStepPanel value="shipping">Shipping details go here.</div>
        <div hmhaStepPanel value="payment">Payment details go here.</div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const shipping = canvasElement.querySelector('[value="shipping"][hmhastep]') as HTMLButtonElement;
    await expect(shipping.disabled).toBe(true);
  },
};

/** Clicking a completed step navigates back to it; clicking the (natively disabled) upcoming step does nothing. */
export const NavigationInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const account = canvas.getByRole('button', { name: 'Account' });
    const payment = canvas.getByRole('button', { name: 'Payment' });
    const accountPanel = canvasElement.querySelector('[value="account"][hmhasteppanel]') as HTMLElement;
    const shippingPanel = canvasElement.querySelector('[value="shipping"][hmhasteppanel]') as HTMLElement;

    await expect(accountPanel).toHaveAttribute('hidden');
    await expect(shippingPanel).not.toHaveAttribute('hidden');

    await userEvent.click(account);
    await expect(accountPanel).not.toHaveAttribute('hidden');
    await expect(shippingPanel).toHaveAttribute('hidden');

    // Payment is upcoming relative to the now-active "account" step, so
    // it's natively disabled — a real click fires nothing at all.
    await userEvent.click(payment);
    await expect(shippingPanel).toHaveAttribute('hidden');
  },
};
