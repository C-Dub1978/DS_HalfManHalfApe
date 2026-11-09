import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HmhaBadge } from '../badge/badge';
import { HmhaIcon } from '../icon/icon';
import { HmhaTooltip } from '../tooltip/tooltip';
import { HmhaNavGroup } from './nav-group';
import { HmhaNavItem } from './nav-item';
import { HmhaNavList } from './nav-list';

/** The pages in the demo sidebar, and which group each lives in. */
const SECTION: Record<string, string | null> = {
  home: null,
  movies: 'library',
  shows: 'library',
  music: 'library',
  sintel: 'artists',
  'sintel-ost': 'artists',
  elephants: 'artists',
  uploads: null,
  settings: null,
};

/**
 * A media app's side nav, standing in for a router: clicking a link makes
 * it the current page (aria-current="page"), its section gets
 * aria-current="true", and the group holding it opens. In a real app,
 * routerLinkActive with ariaCurrentWhenActive="page" does the first part.
 * Story-local.
 */
@Component({
  selector: 'media-sidebar',
  imports: [HmhaNavList, HmhaNavItem, HmhaNavGroup, HmhaIcon, HmhaBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Main" [attr.dir]="dir()" style="width: 16rem;">
      <ul hmhaNavList>
        <li>
          <a hmhaNavItem href="/home" [attr.aria-current]="currentOf('home')" (click)="go($event, 'home')">
            <hmha-icon name="home" /> Home
          </a>
        </li>
        <li hmhaNavGroup [(expanded)]="libraryOpen">
          <a hmhaNavItem href="/library" [attr.aria-current]="sectionOf('library')" (click)="go($event, 'movies')">
            <hmha-icon name="folder-open" /> Library
          </a>
          <ul hmhaNavList>
            <li><a hmhaNavItem href="/library/movies" [attr.aria-current]="currentOf('movies')" (click)="go($event, 'movies')">Movies</a></li>
            <li><a hmhaNavItem href="/library/shows" [attr.aria-current]="currentOf('shows')" (click)="go($event, 'shows')">Shows</a></li>
            <li><a hmhaNavItem href="/library/music" [attr.aria-current]="currentOf('music')" (click)="go($event, 'music')">Music</a></li>
          </ul>
        </li>
        <li hmhaNavGroup [(expanded)]="artistsOpen">
          <a hmhaNavItem href="/artists" [attr.aria-current]="sectionOf('artists')" (click)="go($event, 'sintel')">
            <hmha-icon name="users" /> Artists
          </a>
          <ul hmhaNavList>
            <li hmhaNavGroup [(expanded)]="sintelOpen">
              <a hmhaNavItem href="/artists/sintel" [attr.aria-current]="currentOf('sintel')" (click)="go($event, 'sintel')">Sintel Orchestra</a>
              <ul hmhaNavList>
                <li><a hmhaNavItem href="/albums/sintel-ost" [attr.aria-current]="currentOf('sintel-ost')" (click)="go($event, 'sintel-ost')">Original score</a></li>
              </ul>
            </li>
            <li><a hmhaNavItem href="/artists/elephants" [attr.aria-current]="currentOf('elephants')" (click)="go($event, 'elephants')">Elephants Dream</a></li>
          </ul>
        </li>
        <li>
          <a hmhaNavItem href="/uploads" [attr.aria-current]="currentOf('uploads')" (click)="go($event, 'uploads')">
            <hmha-icon name="upload" /> Uploads
            <span hmhaBadge hmhaNavItemEnd tone="primary">3 in progress</span>
          </a>
        </li>
        <li>
          <a hmhaNavItem href="/settings" [attr.aria-current]="currentOf('settings')" (click)="go($event, 'settings')">
            <hmha-icon name="settings" /> Settings
          </a>
        </li>
      </ul>
    </nav>
  `,
})
class MediaSidebar {
  readonly start = input('home');
  readonly dir = input<'ltr' | 'rtl'>('ltr');

  protected readonly current = linkedSignal(() => this.start());
  private readonly section = computed(() => SECTION[this.current()] ?? null);
  // The group holding the current page opens; the user can still open and
  // close any group by its button.
  protected readonly libraryOpen = linkedSignal(() => this.section() === 'library');
  protected readonly artistsOpen = linkedSignal(() => this.section() === 'artists');
  protected readonly sintelOpen = linkedSignal(() => this.current().startsWith('sintel'));

  protected currentOf(page: string) {
    return this.current() === page ? 'page' : null;
  }
  protected sectionOf(section: string) {
    return this.section() === section ? 'true' : null;
  }
  protected go(event: Event, page: string) {
    event.preventDefault();
    this.current.set(page);
  }
}

const meta: Meta<MediaSidebar> = {
  title: 'Components/Nav List',
  component: MediaSidebar,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [MediaSidebar, HmhaNavList, HmhaNavItem, HmhaIcon, HmhaTooltip] })],
  argTypes: {
    start: { control: 'select', options: Object.keys(SECTION) },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
  },
  args: { start: 'home', dir: 'ltr' },
  render: (args) => ({
    props: args,
    template: `<media-sidebar [start]="start" [dir]="dir" />`,
  }),
};
export default meta;

type Story = StoryObj<MediaSidebar>;

/**
 * A side nav: real links in a real list, the current page marked with a
 * fill and a bar, and two expandable groups (fork 49). Pick the starting
 * page in the controls.
 */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Library' })).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Clicking a link moves the current-page marking to it. */
export const NavigateInteraction: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('link', { name: 'Uploads 3 in progress' }));
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: 'Uploads 3 in progress' })).toHaveAttribute('aria-current', 'page'),
    );
    await expect(canvas.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  },
};

/**
 * Artist → album: opening groups by their buttons, then picking an album.
 * The album becomes the current page, its artist section is marked
 * aria-current="true", and the link itself never toggled anything.
 */
export const GroupsInteraction: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link', { name: 'Sintel Orchestra' })).toBeNull(); // hidden while collapsed

    await userEvent.click(canvas.getByRole('button', { name: 'Artists' }));
    await expect(canvas.getByRole('button', { name: 'Artists' })).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Sintel Orchestra' }));

    await userEvent.click(canvas.getByRole('link', { name: 'Original score' }));
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: 'Original score' })).toHaveAttribute('aria-current', 'page'),
    );
    await expect(canvas.getByRole('link', { name: 'Artists' })).toHaveAttribute('aria-current', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Artists' }));
    await expect(canvas.queryByRole('link', { name: 'Original score' })).toBeNull();
  },
};

/** One Tab stop per link and per group button, in reading order; Enter on a group's button opens it. */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Library' })).toHaveFocus();
    await userEvent.tab();
    const toggle = canvas.getByRole('button', { name: 'Library' });
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Movies' })).toHaveFocus();
  },
};

/** Starting on a page inside a group: the consumer opens that group, one-way, from what it knows about the route. */
export const CurrentPageInAGroup: Story = {
  args: { start: 'sintel-ost' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Original score' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Sintel Orchestra' })).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Right-to-left: the bar moves to the right edge and nesting indents from the right. */
export const RightToLeft: Story = {
  args: { start: 'movies', dir: 'rtl' },
};

/**
 * The collapsed icon-only rail isn't built in (fork 49). This is the
 * pattern for it: icon-only links named by aria-label, with a tooltip for
 * sighted users, still marked with aria-current.
 */
export const CollapsedRailPattern: Story = {
  render: () => ({
    template: `
      <nav aria-label="Main" style="width: max-content;">
        <ul hmhaNavList>
          <li><a hmhaNavItem href="/home" aria-current="page" aria-label="Home" hmhaTooltip="Home" (click)="$event.preventDefault()"><hmha-icon name="home" /></a></li>
          <li><a hmhaNavItem href="/library" aria-label="Library" hmhaTooltip="Library" (click)="$event.preventDefault()"><hmha-icon name="folder-open" /></a></li>
          <li><a hmhaNavItem href="/uploads" aria-label="Uploads" hmhaTooltip="Uploads" (click)="$event.preventDefault()"><hmha-icon name="upload" /></a></li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: 'Uploads' })).toBeInTheDocument();
  },
};
