import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { KitchenSink } from './kitchen-sink';

const meta: Meta<KitchenSink> = {
  // Its own top-level sidebar section, separate from per-component
  // stories — a visual inventory/onboarding demo, not a reusable
  // libs/ui component (DECISIONS.md fork 27, kitchen-sink.md).
  title: 'Overview/Kitchen Sink',
  component: KitchenSink,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<KitchenSink>;

/** Default — light mode, the onboarding stepper's Theme step, tabs not shown yet. */
export const Playground: Story = {};

/** Toggling the header switch flips the whole page to dark mode, live. */
export const DarkModeInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const host = canvasElement.querySelector('kitchen-sink') as HTMLElement;
    await expect(host).toHaveAttribute('data-hmha-mode', 'light');

    await userEvent.click(canvas.getByRole('switch'));
    await expect(host).toHaveAttribute('data-hmha-mode', 'dark');
  },
};

/** Picking a color theme card re-points the live --hmha-color-* custom properties on the host — the whole point of fork 27's demo. */
export const ThemeSelectionInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const host = canvasElement.querySelector('kitchen-sink') as HTMLElement;
    expect(host.style.getPropertyValue('--hmha-color-action')).toBe('var(--hmha-color-blue-600)');

    const forestCard = canvas.getByRole('button', { name: /Forest/ });
    await userEvent.click(forestCard);

    await expect(host.style.getPropertyValue('--hmha-color-action')).toBe('var(--hmha-color-green-500)');
    await expect(forestCard).toHaveAttribute('aria-pressed', 'true');
  },
};

/** The Typography step: picking a preset re-points heading size/weight; the density toggle sets the real data-hmha-density attribute. */
export const TypographyAndDensityInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const host = canvasElement.querySelector('kitchen-sink') as HTMLElement;

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(canvas.getByRole('button', { name: /Bold/ }));
    await expect(host.style.getPropertyValue('--hmha-type-heading-lg-size')).toBe('36px');

    await userEvent.click(canvas.getByRole('button', { name: 'Compact' }));
    await expect(host).toHaveAttribute('data-hmha-density', 'compact');
  },
};

/** Walking through all 3 onboarding steps and clicking "Enter the Kitchen Sink!" hides the stepper and reveals the 6 tabs, starting on the first tab (now "Typography"). */
export const CompletesOnboardingInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next' })); // theme -> typography
    await userEvent.click(canvas.getByRole('button', { name: 'Next' })); // typography -> confirm

    const confirmPanel = canvasElement.querySelector('[hmhaStepPanel][value="confirm"]') as HTMLElement;
    await expect(confirmPanel.hidden).toBe(false);
    await expect(confirmPanel.textContent).toContain('Ocean');

    await userEvent.click(canvas.getByRole('button', { name: /Enter the Kitchen Sink/ }));

    await expect(canvasElement.querySelector('[hmhaStepper]')).toBeNull();
    const tabs = canvasElement.querySelectorAll('[hmhaTab]');
    await expect(tabs.length).toBe(6);
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  },
};
