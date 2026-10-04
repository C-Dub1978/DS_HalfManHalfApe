import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

// CDK's ListKeyManager.onKeydown switches on the legacy numeric
// event.keyCode, which @testing-library/user-event v14 (what storybook/
// test's userEvent wraps) deliberately never sets — same gap as Menu's
// arrow-key stories (DECISIONS.md fork 15/18). A real hardware key press
// in a real browser populates it correctly either way.
function dispatchArrowRight(target: Element): void {
  const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => 39 });
  target.dispatchEvent(event);
}

const meta: Meta<HmhaTabs> = {
  title: 'Components/Tabs',
  component: HmhaTabs,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel] })],
  // Four attribute-selector pieces on native elements, no custom tag names
  // (fork 18) — a tab and its panel match by a shared string `value`, not
  // DOM position, so the panels don't need to be interleaved with the
  // tabs that control them.
  render: (args) => ({
    props: args,
    template: `
      <div hmhaTabs value="general">
        <div hmhaTabList>
          <button hmhaTab value="general">General</button>
          <button hmhaTab value="billing">Billing</button>
          <button hmhaTab value="danger" disabled>Danger zone</button>
        </div>
        <div hmhaTabPanel value="general">General settings go here.</div>
        <div hmhaTabPanel value="billing">Billing settings go here.</div>
        <div hmhaTabPanel value="danger">Danger zone settings go here.</div>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaTabs>;

/** Default — the tab matching the initial value is selected; its panel is the only one not hidden. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const general = canvasElement.querySelector('[value="general"][hmhatab]') as HTMLElement;
    const billing = canvasElement.querySelector('[value="billing"][hmhatabpanel]') as HTMLElement;
    await expect(general).toHaveAttribute('aria-selected', 'true');
    await expect(billing).toHaveAttribute('hidden');
  },
};

/** Clicking a tab selects it and swaps which panel is visible. */
export const SelectionInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Billing' }));

    const general = canvasElement.querySelector('[value="general"][hmhatabpanel]') as HTMLElement;
    const billing = canvasElement.querySelector('[value="billing"][hmhatabpanel]') as HTMLElement;
    await expect(general).toHaveAttribute('hidden');
    await expect(billing).not.toHaveAttribute('hidden');
  },
};

/** ArrowRight moves focus AND selection to the next tab (automatic activation) — a disabled tab (Danger zone) is skipped entirely. */
export const KeyboardNavigationInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const general = canvas.getByRole('tab', { name: 'General' });
    general.focus();

    const tablist = canvasElement.querySelector('[role="tablist"]') as HTMLElement;
    dispatchArrowRight(tablist);
    const billing = canvas.getByRole('tab', { name: 'Billing' });
    await expect(billing).toHaveFocus();
    // aria-selected reflects a signal updated via the key manager's RxJS
    // change subscription — .focus() is a synchronous DOM side effect,
    // but this needs a render flush to land.
    await waitFor(() => expect(billing).toHaveAttribute('aria-selected', 'true'));

    // Danger zone is disabled — the next ArrowRight wraps back to General.
    dispatchArrowRight(tablist);
    const generalAgain = canvas.getByRole('tab', { name: 'General' });
    await expect(generalAgain).toHaveFocus();
  },
};
