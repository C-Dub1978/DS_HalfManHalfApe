import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

const meta: Meta<HmhaTab> = {
  title: 'Components/Tab',
  component: HmhaTab,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel] })],
  // HmhaTab injects HMHA_TABS (required, not optional) — same reasoning
  // as HmhaRadio needing HmhaRadioGroup (fork 11) — so every story wraps
  // it in the root + list it needs to exist at all.
  render: () => ({
    template: `
      <div hmhaTabs value="general">
        <div hmhaTabList>
          <button hmhaTab value="general">General</button>
          <button hmhaTab value="billing" disabled>Billing</button>
        </div>
        <div hmhaTabPanel value="general">General content</div>
        <div hmhaTabPanel value="billing">Billing content</div>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaTab>;

/** Default — a real type="button" with role="tab"; the selected tab is the only one in the Tab order. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const general = canvas.getByRole('tab', { name: 'General' });
    await expect(general.tagName).toBe('BUTTON');
    await expect(general).toHaveAttribute('role', 'tab');
    await expect(general).toHaveAttribute('aria-selected', 'true');
    await expect(general).toHaveAttribute('tabindex', '0');
  },
};

/** A real disabled attribute — out of the Tab order, skipped by keyboard navigation, inert to clicks, for free from native <button> semantics. */
export const Disabled: Story = {
  play: async ({ canvas }) => {
    const billing = canvas.getByRole('tab', { name: 'Billing' }) as HTMLButtonElement;
    await expect(billing.disabled).toBe(true);
    await expect(billing).toHaveAttribute('tabindex', '-1');
  },
};
