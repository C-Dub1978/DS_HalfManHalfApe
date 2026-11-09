import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { HmhaBadge } from '../badge/badge';
import { HmhaIcon } from '../icon/icon';
import { HmhaNavItem } from './nav-item';
import { HmhaNavList } from './nav-list';

type NavItemArgs = HmhaNavItem & { current: 'page' | 'true' | 'none'; withIcon: boolean; withBadge: boolean };

const meta: Meta<NavItemArgs> = {
  title: 'Components/Nav Item',
  component: HmhaNavItem,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaNavList, HmhaNavItem, HmhaIcon, HmhaBadge] })],
  argTypes: {
    current: { control: 'inline-radio', options: ['none', 'page', 'true'], description: 'The aria-current value.' },
    withIcon: { control: 'boolean' },
    withBadge: { control: 'boolean', description: 'Something in the hmhaNavItemEnd slot.' },
  },
  args: { current: 'page', withIcon: true, withBadge: false },
  // An item lives in a list in a nav, so every story gives it one.
  render: (args) => ({
    props: args,
    template: `
      <nav aria-label="Example" style="width: 16rem;">
        <ul hmhaNavList>
          <li>
            <a hmhaNavItem href="/uploads" [attr.aria-current]="current === 'none' ? null : current" (click)="$event.preventDefault()">
              @if (withIcon) { <hmha-icon name="upload" /> }
              Uploads
              @if (withBadge) { <span hmhaBadge hmhaNavItemEnd tone="primary">3 in progress</span> }
            </a>
          </li>
        </ul>
      </nav>
    `,
  }),
};
export default meta;

type Story = StoryObj<NavItemArgs>;

/** One link. Toggle the current-page marking, the icon and the end slot in the controls. */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Uploads' });
    await expect(link.tagName).toBe('A');
    await expect(link).toHaveAttribute('aria-current', 'page');
  },
};

/** Every shape an item takes: text only, an icon, an end badge, the current page, a current section, and long text that wraps. */
export const Variants: Story = {
  render: () => ({
    template: `
      <nav aria-label="Variants" style="width: 16rem;">
        <ul hmhaNavList (click)="$event.preventDefault()">
          <li><a hmhaNavItem href="/a">Text only</a></li>
          <li><a hmhaNavItem href="/b"><hmha-icon name="home" /> With an icon</a></li>
          <li><a hmhaNavItem href="/c"><hmha-icon name="upload" /> With an end slot <span hmhaBadge hmhaNavItemEnd tone="danger" appearance="solid" [count]="12"></span></a></li>
          <li><a hmhaNavItem href="/d" aria-current="page"><hmha-icon name="folder-open" /> Current page</a></li>
          <li><a hmhaNavItem href="/e" aria-current="true"><hmha-icon name="users" /> Current section</a></li>
          <li><a hmhaNavItem href="/f"><hmha-icon name="list-music" /> A very long playlist name that wraps onto a second line</a></li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /Current page/ })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: /Current section/ })).toHaveAttribute('aria-current', 'true');
  },
};
