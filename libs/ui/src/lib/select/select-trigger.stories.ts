import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaSelectListbox } from './select-listbox';
import { HmhaSelectOption } from './select-option';
import { HmhaSelectTrigger } from './select-trigger';

// CDK's ActiveDescendantKeyManager (used internally by CdkListbox) reads
// the same legacy event.keyCode ListKeyManager does — a synthetic
// KeyboardEvent never populates it in Chrome, same gap as Menu's and
// Tabs' arrow-key stories (DECISIONS.md fork 15/18).
function dispatchArrowDown(target: Element): void {
  const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => 40 });
  target.dispatchEvent(event);
}

const meta: Meta<HmhaSelectTrigger> = {
  title: 'Components/SelectTrigger',
  component: HmhaSelectTrigger,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaSelectTrigger, HmhaSelectListbox, HmhaSelectOption, CdkListbox, CdkOption, ReactiveFormsModule],
    }),
  ],
  // Built on hmhaOverlay() + @angular/cdk/listbox (fork 19) — the panel
  // renders in the CDK overlay container, a sibling of this story's root
  // in the real DOM, not a descendant of it. Play functions below query
  // `document` for it, not `canvas`. The trigger's own closed-state label
  // is the consumer's job (not auto-derived from the options — see the
  // README) — this demo looks it up from a plain map.
  render: (args) => ({
    props: { ...args, country: new FormControl(''), labels: { us: 'United States', ca: 'Canada' } },
    template: `
      <button [hmhaSelectTrigger]="listboxTpl" [formControl]="country">
        {{ labels[country.value] || 'Choose a country' }}
      </button>
      <ng-template #listboxTpl>
        <div hmhaSelectListbox cdkListbox>
          <div hmhaSelectOption cdkOption="us">United States</div>
          <div hmhaSelectOption cdkOption="ca">Canada</div>
          <div hmhaSelectOption cdkOption="mx" cdkOptionDisabled>Mexico (unavailable)</div>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSelectTrigger>;

/** Default — closed on load. aria-haspopup="listbox" advertises the popup before it's ever opened. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Clicking the trigger opens the listbox and sets aria-expanded. */
export const OpenInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(document.querySelector('[role="listbox"]')).toBeTruthy();
  },
};

/**
 * Regression coverage for the fork-15 toggle-close fix this trigger
 * inherits from hmhaOverlay: clicking an already-open trigger used to
 * reopen instead of closing, because CDK's outside-click dismissal
 * (capture phase on document.body) closed the overlay before this
 * button's own (click) handler ever saw the event.
 */
export const ToggleCloseInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
  },
};

/** Selecting an option updates the bound FormControl, closes the listbox, and the trigger's own label reflects it (the consumer's own binding). */
export const SelectionInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);

    const canada = document.querySelector('[cdkoption="ca"]') as HTMLElement;
    await userEvent.click(canada);

    await expect(canvas.getByRole('button', { name: 'Canada' })).toHaveAttribute('aria-expanded', 'false');
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
  },
};

/** ArrowDown moves focus between options — a disabled option (Mexico) is skipped entirely. */
export const KeyboardNavigationInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);

    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    const options = Array.from(document.querySelectorAll('[hmhaSelectOption]'));
    await waitFor(() => expect(options[0]).toHaveFocus());

    dispatchArrowDown(listbox);
    await expect(options[1]).toHaveFocus();

    // Mexico (options[2]) is disabled — the next ArrowDown wraps back to
    // the first option instead of landing on it.
    dispatchArrowDown(listbox);
    await expect(options[0]).toHaveFocus();
  },
};

/** Escape closes the listbox and returns focus to the trigger. */
export const EscapeDismissInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);
    await expect(document.querySelector('[role="listbox"]')).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};
