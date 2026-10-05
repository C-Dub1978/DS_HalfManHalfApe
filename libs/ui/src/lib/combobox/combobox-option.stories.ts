import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaComboboxInput } from './combobox-input';
import { HmhaComboboxListbox } from './combobox-listbox';
import { HmhaComboboxOption } from './combobox-option';

const meta: Meta<HmhaComboboxOption> = {
  title: 'Components/ComboboxOption',
  component: HmhaComboboxOption,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaComboboxInput, HmhaComboboxListbox, HmhaComboboxOption, CdkListbox, CdkOption, ReactiveFormsModule],
    }),
  ],
  // HmhaComboboxOption injects nothing directly — it relies entirely on
  // the co-located CdkOption directive — but still needs the full
  // input+listbox tree to exist at all (role="option" only means
  // something inside a role="listbox").
  render: (args) => ({
    props: { ...args, country: new FormControl('') },
    template: `
      <input [hmhaCombobox]="listboxTpl" [formControl]="country" placeholder="Choose a country" />
      <ng-template #listboxTpl>
        <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
          <div hmhaComboboxOption cdkOption="United States">United States</div>
          <div hmhaComboboxOption cdkOption="Mexico" cdkOptionDisabled>Mexico</div>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaComboboxOption>;

/** Default — role="option"; unlike HmhaSelectOption, nothing here ever renders as "selected" — a combobox's options are suggestions, not a persistent choice. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.type(input, 'Uni');

    const us = document.querySelector('[cdkoption="United States"]') as HTMLElement;
    await expect(us).toHaveAttribute('role', 'option');

    // Leaves the popup closed — an open CDK overlay outlives this story's
    // own component instance (it isn't a descendant of it in the real
    // DOM), so leaving it open here bleeds a stale listbox into whichever
    // story runs next in the same batch.
    await userEvent.keyboard('{Escape}');
  },
};

/** aria-disabled — a disabled option is inert to clicks, for free from CdkOption's own handling. */
export const Disabled: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox') as HTMLInputElement;
    await userEvent.type(input, 'Me');

    const mexico = document.querySelector('[cdkoption="Mexico"]') as HTMLElement;
    await expect(mexico).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(mexico);
    await expect(input).toHaveValue('Me');
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
  },
};
