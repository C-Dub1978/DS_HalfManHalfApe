import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';

// CDK's ListKeyManager.onKeydown switches on the legacy numeric
// event.keyCode, which @testing-library/user-event v14 (what storybook/
// test's userEvent wraps) deliberately never sets — same gap as Menu/
// Tabs/Select's own arrow-key stories (DECISIONS.md fork 15/18).
function dispatchArrowRight(target: Element): void {
  const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => 39 });
  target.dispatchEvent(event);
}
import { HmhaIconButton } from '../button/icon-button';
import { HmhaIcon } from '../icon/icon';
import { HmhaChip } from './chip';
import { HmhaChipSet } from './chip-set';

const meta: Meta<HmhaChip> = {
  title: 'Components/Chip',
  component: HmhaChip,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaChip, HmhaChipSet, HmhaButton, HmhaIconButton, HmhaIcon] })],
  render: () => ({
    template: `<span hmhaChip>Engineering</span>`,
  }),
};
export default meta;

type Story = StoryObj<HmhaChip>;

/** Default — a plain display chip on a native `<span>`, not interactive. */
export const Playground: Story = {};

/** Several display chips side by side. */
export const Display: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <span hmhaChip>Engineering</span>
        <span hmhaChip>Remote</span>
        <span hmhaChip>Full-time</span>
      </div>
    `,
  }),
};

/**
 * Removal has no dedicated input on `HmhaChip` — a nested
 * `HmhaIconButton` (projected by the consumer) is the entire mechanism.
 */
export const Removable: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <span hmhaChip>
          Engineering
          <button hmhaButton hmhaIconButton size="sm" label="Remove Engineering">
            <hmha-icon name="close" size="sm" />
          </button>
        </span>
        <span hmhaChip>
          Remote
          <button hmhaButton hmhaIconButton size="sm" label="Remove Remote">
            <hmha-icon name="close" size="sm" />
          </button>
        </span>
      </div>
    `,
  }),
};

/** `selectable="true"` on a native `<button>` — the whole chip is the control, with native `aria-pressed`. */
export const Selectable: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button hmhaChip selectable="true">Remote</button>
        <button hmhaChip selectable="true">Hybrid</button>
        <button hmhaChip selectable="true" disabled="true">On-site</button>
      </div>
    `,
  }),
};

/** Clicking a selectable chip toggles aria-pressed and data-selected; a disabled chip ignores the click entirely. */
export const SelectionInteraction: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button hmhaChip selectable="true">Remote</button>
        <button hmhaChip selectable="true" disabled="true">On-site</button>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    const remote = canvas.getByRole('button', { name: 'Remote' });
    await expect(remote).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(remote);
    await expect(remote).toHaveAttribute('aria-pressed', 'true');
    await expect(remote).toHaveAttribute('data-selected', '');

    const onSite = canvas.getByRole('button', { name: 'On-site' });
    await userEvent.click(onSite);
    await expect(onSite).toHaveAttribute('aria-pressed', 'false');
  },
};

/** HmhaChipSet's roving tabindex: ArrowRight moves focus forward, skipping the disabled chip, and wraps at the end. */
export const ChipSetKeyboardNavigationInteraction: Story = {
  render: () => ({
    template: `
      <div hmhaChipSet ariaLabel="Filters">
        <button hmhaChip selectable="true">Remote</button>
        <button hmhaChip selectable="true" disabled="true">On-site</button>
        <button hmhaChip selectable="true">Hybrid</button>
      </div>
    `,
  }),
  play: async ({ canvas, canvasElement }) => {
    const remote = canvas.getByRole('button', { name: 'Remote' });
    const hybrid = canvas.getByRole('button', { name: 'Hybrid' });
    const set = canvasElement.querySelector('[hmhaChipSet]') as HTMLElement;

    remote.focus();
    // The key manager's "activate the first item" effect updates a signal
    // via its own RxJS change subscription — .focus() is a synchronous DOM
    // side effect, but this needs a render flush to land (same lesson as
    // Tabs' own KeyboardNavigationInteraction story).
    await waitFor(() => expect(remote).toHaveAttribute('tabindex', '0'));

    // On-site (disabled) is skipped — ArrowRight lands on Hybrid directly.
    dispatchArrowRight(set);
    await waitFor(() => expect(hybrid).toHaveAttribute('tabindex', '0'));
    await expect(remote).toHaveAttribute('tabindex', '-1');

    // Wraps back to Remote from the last chip.
    dispatchArrowRight(set);
    await waitFor(() => expect(remote).toHaveAttribute('tabindex', '0'));
  },
};
