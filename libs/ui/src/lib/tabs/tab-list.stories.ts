import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { HmhaTab } from './tab';
import { HmhaTabList } from './tab-list';
import { HmhaTabPanel } from './tab-panel';
import { HmhaTabs } from './tabs';

// Same gap as tabs.stories.ts — CDK's ListKeyManager reads the legacy
// event.keyCode, which @testing-library/user-event v14 never sets.
function dispatchKeydown(target: Element, key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
}
function end(target: Element): void {
  dispatchKeydown(target, 'End', 35);
}
function home(target: Element): void {
  dispatchKeydown(target, 'Home', 36);
}

const meta: Meta<HmhaTabList> = {
  title: 'Components/TabList',
  component: HmhaTabList,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaTabs, HmhaTabList, HmhaTab, HmhaTabPanel] })],
  // HmhaTabList injects HMHA_TABS (required, not optional) — same
  // reasoning as HmhaRadio needing HmhaRadioGroup (fork 11) — so every
  // story wraps it in the root that gives it meaning. Trigger-level
  // concerns (click selection, the overall composed widget) have their
  // own stories in tabs.stories.ts — these focus on what's specific to
  // the tablist's own keyboard navigation.
  render: () => ({
    template: `
      <div hmhaTabs value="a">
        <div hmhaTabList>
          <button hmhaTab value="a">A</button>
          <button hmhaTab value="b">B</button>
          <button hmhaTab value="c">C</button>
        </div>
        <div hmhaTabPanel value="a">A content</div>
        <div hmhaTabPanel value="b">B content</div>
        <div hmhaTabPanel value="c">C content</div>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaTabList>;

/** Default — a real role="tablist", with the matching tab's panel the only one visible. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const tablist = canvasElement.querySelector('[role="tablist"]');
    await expect(tablist).toBeTruthy();
  },
};

/** End selects the last tab, Home returns to the first. */
export const HomeEndInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const tablist = canvasElement.querySelector('[role="tablist"]') as HTMLElement;
    canvas.getByRole('tab', { name: 'A' }).focus();

    end(tablist);
    const c = canvas.getByRole('tab', { name: 'C' });
    await expect(c).toHaveFocus();
    // aria-selected reflects a signal updated via the key manager's RxJS
    // change subscription — .focus() is a synchronous DOM side effect,
    // but this needs a render flush to land.
    await waitFor(() => expect(c).toHaveAttribute('aria-selected', 'true'));

    home(tablist);
    const a = canvas.getByRole('tab', { name: 'A' });
    await expect(a).toHaveFocus();
    await waitFor(() => expect(a).toHaveAttribute('aria-selected', 'true'));
  },
};
