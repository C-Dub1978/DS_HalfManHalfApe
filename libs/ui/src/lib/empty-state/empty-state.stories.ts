import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaCard } from '../card/card';
import { HmhaField } from '../field/field';
import { HmhaInput } from '../input/input';
import { HmhaTable } from '../table/table';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaTableHeaderCell } from '../table/table-header-cell';
import { HmhaTableRow } from '../table/table-row';
import { HmhaEmptyState, HmhaEmptyStateTitle } from './empty-state';

const TITLES = ['Big Buck Bunny', 'Sintel', 'Tears of Steel', 'Elephants Dream', 'Cosmos Laundromat'];

/**
 * A search over a small catalogue: results in a table, and an empty state
 * in place of the rows when nothing matches, announced politely because
 * it appears in response to typing. Story-local.
 */
@Component({
  selector: 'search-demo',
  imports: [
    HmhaEmptyState,
    HmhaEmptyStateTitle,
    HmhaField,
    HmhaInput,
    HmhaTable,
    HmhaTableRow,
    HmhaTableCell,
    HmhaTableHeaderCell,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:grid; gap: var(--hmha-space-stack); max-width: 32rem;">
      <hmha-field label="Search the catalogue">
        <input hmhaInput type="search" [value]="query()" (input)="query.set($any($event.target).value)" />
      </hmha-field>
      <table hmhaTable aria-label="Search results">
        <thead><tr><th hmhaTableHeaderCell>Title</th></tr></thead>
        <tbody>
          @for (title of results(); track title) {
            <tr hmhaTableRow><td hmhaTableCell>{{ title }}</td></tr>
          } @empty {
            <tr>
              <td hmhaTableCell>
                <div hmhaEmptyState size="sm" icon="search" announce="polite">
                  <p hmhaEmptyStateTitle>No results for “{{ query() }}”</p>
                  Try a different spelling, or search your library instead.
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
class SearchDemo {
  protected readonly query = signal('');
  protected readonly results = computed(() =>
    TITLES.filter((t) => t.toLowerCase().includes(this.query().trim().toLowerCase())),
  );
}

const meta: Meta<HmhaEmptyState> = {
  title: 'Components/Empty State',
  component: HmhaEmptyState,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaEmptyState, HmhaEmptyStateTitle, HmhaButton, HmhaCard, SearchDemo] })],
  argTypes: {
    icon: { control: 'select', options: [null, 'upload', 'search', 'folder-open', 'heart', 'filter'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    announce: { control: 'inline-radio', options: ['none', 'polite'] },
  },
  args: {
    icon: 'upload',
    size: 'md',
    announce: 'none',
  },
  render: (args) => ({
    props: args,
    template: `
      <div hmhaEmptyState [icon]="icon" [size]="size" [announce]="announce">
        <h2 hmhaEmptyStateTitle>Your library is empty</h2>
        Upload a movie, show or album to start building it.
        <button hmhaButton tone="primary" hmhaEmptyStateActions>Upload something</button>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaEmptyState>;

/** A whole section with nothing in it yet: icon, a real heading, an explanation, one action (fork 43). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Your library is empty' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Upload something' })).toBeInTheDocument();
  },
};

/** Two actions, and a different reason to be empty. */
export const TwoActions: Story = {
  render: () => ({
    template: `
      <div hmhaEmptyState icon="heart">
        <h2 hmhaEmptyStateTitle>No favourites yet</h2>
        Tap the heart on anything you love and it'll show up here.
        <button hmhaButton tone="primary" hmhaEmptyStateActions>Browse movies</button>
        <button hmhaButton hmhaEmptyStateActions>Browse music</button>
      </div>
    `,
  }),
};

/** The small size, inside a card: a smaller icon, heading, text and spacing. */
export const SmallInACard: Story = {
  render: () => ({
    template: `
      <div style="max-width: 20rem;">
        <hmha-card>
          <span hmhaCardHeader>Continue watching</span>
          <div hmhaEmptyState size="sm" icon="folder-open">
            <h3 hmhaEmptyStateTitle>Nothing in progress</h3>
            Start something and it'll wait for you here.
          </div>
        </hmha-card>
      </div>
    `,
  }),
};

/** Just a heading and a sentence: no icon, no action, no empty rows left behind. */
export const TextOnly: Story = {
  args: { icon: null },
  render: (args) => ({
    props: args,
    template: `
      <div hmhaEmptyState [icon]="icon">
        <h2 hmhaEmptyStateTitle>No playlists</h2>
        Playlists you make will appear here.
      </div>
    `,
  }),
};

/**
 * A search with no matches: the empty state replaces the table's rows and,
 * since it appears in response to typing, is announced politely through
 * CDK's live region. Clearing the search brings the rows back.
 */
export const SearchNoResultsInteraction: Story = {
  render: () => ({ template: `<search-demo />` }),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('row')).toHaveLength(TITLES.length + 1);

    const search = canvas.getByRole('searchbox', { name: 'Search the catalogue' });
    await userEvent.type(search, 'zzz');

    await waitFor(() => expect(canvas.getByText('No results for “zzz”')).toBeInTheDocument());
    await waitFor(() =>
      expect(document.querySelector('.cdk-live-announcer-element')).toHaveTextContent(
        'No results for “zzz” Try a different spelling, or search your library instead.',
      ),
    );
    await expect(document.querySelector('.cdk-live-announcer-element')).toHaveAttribute('aria-live', 'polite');

    await userEvent.clear(search);
    await waitFor(() => expect(canvas.queryByText(/No results/)).toBeNull());
    await expect(canvas.getAllByRole('row')).toHaveLength(TITLES.length + 1);
  },
};
