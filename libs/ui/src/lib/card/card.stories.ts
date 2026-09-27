import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaCard } from './card';

const meta: Meta<HmhaCard> = {
  title: 'Components/Card',
  component: HmhaCard,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaCard] })],
  argTypes: {
    elevated: { control: 'boolean' },
  },
  args: {
    elevated: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <hmha-card [elevated]="elevated" style="max-width: 320px;">
        <span hmhaCardHeader>Plan usage</span>
        <p>3 of 5 seats filled.</p>
        <span hmhaCardFooter>Updated 2 minutes ago</span>
      </hmha-card>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaCard>;

/** Default — bordered, no shadow. */
export const Playground: Story = {};

/** data-elevated swaps the border for a shadow. */
export const Elevated: Story = {
  args: { elevated: true },
};

/** Empty state: an unused header/footer collapses to nothing rather than leaving empty padded space. */
export const BodyOnly: Story = {
  render: () => ({
    template: `
      <hmha-card style="max-width: 320px;">
        <p>Just body copy — no header or footer projected.</p>
      </hmha-card>
    `,
  }),
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('.hmha-card-header');
    const footer = canvasElement.querySelector('.hmha-card-footer');
    await expect(header).toBeEmptyDOMElement();
    await expect(footer).toBeEmptyDOMElement();
  },
};

/** Flat and elevated side by side, plus a nested opposite-mode panel proving the theming axes still compose. */
export const FlatAndElevated: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        <hmha-card style="max-width: 280px;">
          <span hmhaCardHeader>Flat card</span>
          <p>Bordered, no shadow — the default surface.</p>
        </hmha-card>
        <hmha-card elevated="true" style="max-width: 280px;">
          <span hmhaCardHeader>Elevated card</span>
          <p>Shadow instead of a border, via data-elevated.</p>
          <span hmhaCardFooter>Updated just now</span>
        </hmha-card>
        <div data-hmha-mode="dark">
          <hmha-card elevated="true" style="max-width: 280px;">
            <span hmhaCardHeader>Nested dark panel</span>
            <p>No extra CSS needed to re-theme.</p>
          </hmha-card>
        </div>
      </div>
    `,
  }),
};
