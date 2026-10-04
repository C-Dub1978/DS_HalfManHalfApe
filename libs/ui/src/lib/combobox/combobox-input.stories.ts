import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaComboboxInput } from './combobox-input';
import { HmhaComboboxListbox } from './combobox-listbox';
import { HmhaComboboxOption } from './combobox-option';

const meta: Meta<HmhaComboboxInput> = {
  title: 'Components/ComboboxInput',
  component: HmhaComboboxInput,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaComboboxInput, HmhaComboboxListbox, HmhaComboboxOption, CdkListbox, CdkOption, ReactiveFormsModule],
    }),
  ],
  // Built on hmhaOverlay() + @angular/cdk/listbox in active-descendant
  // mode (fork 20) — real DOM focus never leaves this input, so unlike
  // Menu/Select's stories, arrow-key navigation here needs no manual
  // keyCode workaround: HmhaComboboxInput reads event.key (not keyCode)
  // to decide what to forward, and constructs its own keyCode-correct
  // event for CdkListbox internally. The panel renders in the CDK overlay
  // container, a sibling of this story's root in the real DOM, not a
  // descendant of it — play functions below query `document` for it.
  render: (args) => ({
    props: { ...args, country: new FormControl('') },
    template: `
      <input [hmhaCombobox]="listboxTpl" [formControl]="country" placeholder="Choose a country" />
      <ng-template #listboxTpl>
        <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
          <div hmhaComboboxOption cdkOption="United States">United States</div>
          <div hmhaComboboxOption cdkOption="Canada">Canada</div>
          <div hmhaComboboxOption cdkOption="Mexico" cdkOptionDisabled>Mexico (unavailable)</div>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaComboboxInput>;

/** Default — closed on load. role="combobox" + aria-autocomplete="list" advertise the popup before it's ever opened. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Typing opens the popup and sets aria-controls to point at it. */
export const OpenOnTypeInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.type(input, 'Uni');

    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    await expect(listbox).toBeTruthy();
    await expect(input).toHaveAttribute('aria-controls', listbox.id);

    // Leaves the popup closed — an open CDK overlay outlives this story's
    // own component instance (it isn't a descendant of it in the real
    // DOM), so leaving it open here was bleeding a stale listbox into
    // whichever story ran next in the same batch.
    await userEvent.keyboard('{Escape}');
  },
};

/** ArrowDown opens the popup even with nothing typed yet. */
export const ArrowDownOpensInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    // See OpenOnTypeInteraction's note — leave every story closed.
    await userEvent.keyboard('{Escape}');
  },
};

/**
 * Arrow keys move aria-activedescendant without moving real DOM focus off
 * the input — that's the whole point of active-descendant mode, since
 * the user has to keep typing. A disabled option (Mexico) is skipped.
 */
export const KeyboardNavigationInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    input.focus();
    // The first ArrowDown only opens the popup — it doesn't also navigate
    // to an option (unlike typing, which opens it already-interactive;
    // see OpenOnTypeInteraction). Nothing is active yet here.
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).not.toHaveAttribute('aria-activedescendant');

    const options = Array.from(document.querySelectorAll('[hmhaComboboxOption]'));

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', options[0].id));
    await expect(document.activeElement).toBe(input);

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', options[1].id));

    // Mexico (options[2]) is disabled — the next ArrowDown wraps back to
    // the first option instead of landing on it.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', options[0].id));

    await userEvent.keyboard('{Escape}');
  },
};

/** Clicking an option sets the input's text to it, closes the popup, and keeps focus on the input. */
export const SelectionInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox') as HTMLInputElement;
    await userEvent.type(input, 'Can');

    const canada = document.querySelector('[cdkoption="Canada"]') as HTMLElement;
    await userEvent.click(canada);

    await expect(input).toHaveValue('Canada');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(document.activeElement).toBe(input);
  },
};

/** Enter commits the active option, the same as clicking it. */
export const EnterCommitsInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox') as HTMLInputElement;
    input.focus();
    // The first ArrowDown only opens the popup — it doesn't also navigate
    // to an option (see KeyboardNavigationInteraction's note).
    await userEvent.keyboard('{ArrowDown}');

    const [first] = Array.from(document.querySelectorAll('[hmhaComboboxOption]'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', first.id));

    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('United States');
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
  },
};

/** Escape closes the popup without moving focus off the input. */
export const EscapeDismissInteraction: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.type(input, 'Uni');
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveFocus();
  },
};
