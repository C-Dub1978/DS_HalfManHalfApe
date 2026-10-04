import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { HmhaSelectListbox } from './select-listbox';
import { HmhaSelectOption } from './select-option';
import { HmhaSelectTrigger } from './select-trigger';

const meta: Meta<HmhaSelectOption> = {
  title: 'Components/SelectOption',
  component: HmhaSelectOption,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaSelectTrigger, HmhaSelectListbox, HmhaSelectOption, CdkListbox, CdkOption, ReactiveFormsModule],
    }),
  ],
  // HmhaSelectOption injects nothing of HMHA_SELECT_TRIGGER directly — it
  // relies entirely on the co-located CdkOption directive — but still
  // needs the full trigger+listbox tree to exist at all (role="option"
  // only means something inside a role="listbox").
  render: (args) => ({
    props: { ...args, country: new FormControl('ca') },
    template: `
      <button [hmhaSelectTrigger]="listboxTpl" [formControl]="country">Choose a country</button>
      <ng-template #listboxTpl>
        <div hmhaSelectListbox cdkListbox>
          <div hmhaSelectOption cdkOption="us">United States</div>
          <div hmhaSelectOption cdkOption="ca">Canada</div>
          <div hmhaSelectOption cdkOption="mx" cdkOptionDisabled>Mexico</div>
        </div>
      </ng-template>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSelectOption>;

/** Default — role="option"; the currently selected option (Canada) is visually distinct via aria-selected. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);

    const canada = document.querySelector('[cdkoption="ca"]') as HTMLElement;
    await expect(canada).toHaveAttribute('role', 'option');
    await expect(canada).toHaveAttribute('aria-selected', 'true');
  },
};

/** aria-disabled — a disabled option is inert to clicks, for free from CdkOption's own handling. */
export const Disabled: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose a country' });
    await userEvent.click(trigger);

    const mexico = document.querySelector('[cdkoption="mx"]') as HTMLElement;
    await expect(mexico).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(mexico);
    await expect(canvas.getByRole('button', { name: 'Choose a country' })).toHaveAttribute('aria-expanded', 'true');
  },
};
