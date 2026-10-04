import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaSelectListbox } from './select-listbox';
import { HmhaSelectOption } from './select-option';
import { HmhaSelectTrigger } from './select-trigger';

const meta: Meta<HmhaSelectListbox> = {
  title: 'Components/SelectListbox',
  component: HmhaSelectListbox,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaSelectTrigger, HmhaSelectListbox, HmhaSelectOption, CdkListbox, CdkOption, ReactiveFormsModule],
    }),
  ],
  // HmhaSelectListbox has no meaning without the trigger that opens it
  // and gives it its ARIA label — same reasoning as HmhaRadio needing
  // HmhaRadioGroup (fork 11). Trigger-level concerns (open/close, toggle,
  // selection, dismissal) have their own stories in
  // select-trigger.stories.ts — these focus on what's specific to the
  // listbox itself.
  render: (args) => ({
    props: { ...args, country: new FormControl('ca') },
    template: `
      <button [hmhaSelectTrigger]="listboxTpl" [formControl]="country">Choose a country</button>
      <ng-template #listboxTpl>
        <div hmhaSelectListbox cdkListbox>
          <div hmhaSelectOption cdkOption="us">United States</div>
          <div hmhaSelectOption cdkOption="ca">Canada</div>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSelectListbox>;

/** Default — role="listbox", labelled by the trigger that opened it (an ARIA input role needs an accessible name of its own). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);

    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    await expect(listbox).toHaveAttribute('aria-labelledby', trigger.id);
  },
};

/** Reopening focuses whichever option is currently selected, not always the first — CdkListbox.focus()'s own built-in behavior. */
export const ReopenHighlightsSelectedInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);

    const canada = document.querySelector('[cdkoption="ca"]') as HTMLElement;
    await expect(canada).toHaveFocus();
    await expect(canada).toHaveAttribute('aria-selected', 'true');
  },
};
