import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

const meta: Meta<HmhaTabPanel> = {
  title: 'Components/TabPanel',
  component: HmhaTabPanel,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel] })],
  // HmhaTabPanel injects HMHA_TABS (required, not optional) — same
  // reasoning as HmhaRadio needing HmhaRadioGroup (fork 11) — so every
  // story wraps it in the root that gives it meaning.
  render: () => ({
    template: `
      <div hmhaTabs value="general">
        <div hmhaTabList>
          <button hmhaTab value="general">General</button>
          <button hmhaTab value="billing">Billing</button>
        </div>
        <div hmhaTabPanel value="general">General content</div>
        <div hmhaTabPanel value="billing">Billing content</div>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaTabPanel>;

/** Default — role="tabpanel", labelled by its matching tab; only the panel matching the selected tab is unhidden. */
export const Playground: Story = {
  play: async ({ canvas, canvasElement }) => {
    const generalTab = canvas.getByRole('tab', { name: 'General' });
    const generalPanel = canvasElement.querySelector('[value="general"][hmhatabpanel]') as HTMLElement;
    const billingPanel = canvasElement.querySelector('[value="billing"][hmhatabpanel]') as HTMLElement;

    await expect(generalPanel).toHaveAttribute('role', 'tabpanel');
    await expect(generalPanel).toHaveAttribute('aria-labelledby', generalTab.id);
    await expect(generalPanel).not.toHaveAttribute('hidden');
    await expect(billingPanel).toHaveAttribute('hidden');
  },
};

/** Selecting a different tab hides the previous panel and reveals its own. */
export const VisibilitySwitchInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Billing' }));

    const generalPanel = canvasElement.querySelector('[value="general"][hmhatabpanel]') as HTMLElement;
    const billingPanel = canvasElement.querySelector('[value="billing"][hmhatabpanel]') as HTMLElement;
    await expect(generalPanel).toHaveAttribute('hidden');
    await expect(billingPanel).not.toHaveAttribute('hidden');
  },
};
