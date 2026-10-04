import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaComboboxInput } from './combobox-input';
import { HmhaComboboxListbox } from './combobox-listbox';
import { HmhaComboboxOption } from './combobox-option';

const meta: Meta<HmhaComboboxListbox> = {
  title: 'Components/ComboboxListbox',
  component: HmhaComboboxListbox,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaComboboxInput, HmhaComboboxListbox, HmhaComboboxOption, CdkListbox, CdkOption, ReactiveFormsModule],
    }),
  ],
  // HmhaComboboxListbox has no meaning without the input that opens it
  // and gives it its ARIA label — same reasoning as HmhaRadio needing
  // HmhaRadioGroup (fork 11). Input-level concerns (open/close, typing,
  // selection, dismissal) have their own stories in
  // combobox-input.stories.ts — these focus on what's specific to the
  // listbox itself.
  render: (args) => ({
    props: { ...args, country: new FormControl('') },
    template: `
      <input [hmhaCombobox]="listboxTpl" [formControl]="country" placeholder="Choose a country" />
      <ng-template #listboxTpl>
        <div hmhaComboboxListbox cdkListbox cdkListboxUseActiveDescendant="true">
          <div hmhaComboboxOption cdkOption="United States">United States</div>
          <div hmhaComboboxOption cdkOption="Canada">Canada</div>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaComboboxListbox>;

/** Default — role="listbox", labelled by the input that opened it (an ARIA input role needs an accessible name of its own). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox');
    await userEvent.type(input, 'Uni');

    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    await expect(listbox).toHaveAttribute('aria-labelledby', input.id);

    // Leaves the popup closed — an open CDK overlay outlives this story's
    // own component instance (it isn't a descendant of it in the real
    // DOM), so leaving it open here bleeds a stale listbox into whichever
    // story runs next in the same batch.
    await userEvent.keyboard('{Escape}');
  },
};
