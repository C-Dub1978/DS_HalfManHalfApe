import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { HmhaIcon } from '../icon/icon';
import { HmhaNavGroup } from './nav-group';
import { HmhaNavItem } from './nav-item';
import { HmhaNavList } from './nav-list';

const meta: Meta<HmhaNavGroup> = {
  title: 'Components/Nav Group',
  component: HmhaNavGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaNavList, HmhaNavItem, HmhaNavGroup, HmhaIcon] })],
  argTypes: {
    expanded: { control: 'boolean' },
  },
  args: { expanded: false, expandedChange: fn() },
  render: (args) => ({
    props: args,
    template: `
      <nav aria-label="Library" style="width: 16rem;">
        <ul hmhaNavList (click)="$event.preventDefault()">
          <li hmhaNavGroup [expanded]="expanded" (expandedChange)="expanded = $event; expandedChange($event)">
            <a hmhaNavItem href="/artists/sintel"><hmha-icon name="users" /> Sintel Orchestra</a>
            <ul hmhaNavList>
              <li><a hmhaNavItem href="/albums/ost">Original score</a></li>
              <li><a hmhaNavItem href="/albums/live">Live in Amsterdam</a></li>
            </ul>
          </li>
        </ul>
      </nav>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaNavGroup>;

/**
 * A link with an expand button after it (WAI-ARIA disclosure navigation):
 * the link navigates, only the button opens and closes. The button is
 * named by its link.
 */
export const Playground: Story = {
  play: async ({ args, canvas }) => {
    const toggle = canvas.getByRole('button', { name: 'Sintel Orchestra' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('link', { name: 'Original score' })).toBeNull();

    await userEvent.click(toggle);
    await expect(args.expandedChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(canvas.getByRole('link', { name: 'Original score' })).toBeVisible());
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(canvas.getByRole('link', { name: 'Sintel Orchestra' }));
    await expect(args.expandedChange).toHaveBeenCalledTimes(1); // the link didn't toggle
  },
};

/** Open from the consumer: a one-way [expanded], as when the group holds the current page. */
export const Expanded: Story = {
  args: { expanded: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Live in Amsterdam' })).toBeVisible();
  },
};
