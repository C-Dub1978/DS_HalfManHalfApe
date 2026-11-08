import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaButton } from '../button/button';
import { HmhaCard } from '../card/card';
import { HmhaTable } from '../table/table';
import { HmhaTableCell } from '../table/table-cell';
import { HmhaTableHeaderCell } from '../table/table-header-cell';
import { HmhaTableRow } from '../table/table-row';
import { HmhaSkeleton } from './skeleton';

/**
 * A "Your library" table that starts loading: skeleton rows in the real
 * table, the body marked aria-busy. "Finish loading" swaps in real rows and
 * clears the busy state, which is the whole README pattern end to end.
 * Local to this story file; nothing here is library API.
 */
@Component({
  selector: 'library-table-demo',
  imports: [HmhaSkeleton, HmhaTable, HmhaTableRow, HmhaTableCell, HmhaTableHeaderCell, HmhaButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:grid; gap: var(--hmha-space-stack); max-width: 36rem;">
      <table hmhaTable aria-label="Your library">
        <thead>
          <tr>
            <th hmhaTableHeaderCell style="width: 6rem;">Type</th>
            <th hmhaTableHeaderCell>Title</th>
            <th hmhaTableHeaderCell style="width: 8rem;">Added</th>
          </tr>
        </thead>
        <tbody [attr.aria-busy]="loading() || null" data-testid="library-body">
          @if (loading()) {
            @for (row of placeholders; track row) {
              <tr hmhaTableRow>
                <td hmhaTableCell><span hmhaSkeleton shape="circle"></span></td>
                <td hmhaTableCell><span hmhaSkeleton width="70%"></span></td>
                <td hmhaTableCell><span hmhaSkeleton width="60%"></span></td>
              </tr>
            }
          } @else {
            @for (item of items; track item.title) {
              <tr hmhaTableRow>
                <td hmhaTableCell>{{ item.kind }}</td>
                <td hmhaTableCell>{{ item.title }}</td>
                <td hmhaTableCell>{{ item.added }}</td>
              </tr>
            }
          }
        </tbody>
      </table>
      @if (loading()) {
        <button hmhaButton size="sm" (click)="loading.set(false)">Finish loading</button>
      }
    </div>
  `,
})
class LibraryTableDemo {
  protected readonly loading = signal(true);
  protected readonly placeholders = [1, 2, 3, 4];
  protected readonly items = [
    { kind: 'Film', title: 'Big Buck Bunny', added: 'Today' },
    { kind: 'Film', title: 'Sintel', added: 'Yesterday' },
    { kind: 'Album', title: 'Goldberg Variations', added: 'Last week' },
  ];
}

const meta: Meta<HmhaSkeleton> = {
  title: 'Components/Skeleton',
  component: HmhaSkeleton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaSkeleton, HmhaCard, LibraryTableDemo] })],
  argTypes: {
    shape: { control: 'inline-radio', options: ['text', 'circle', 'rect'] },
    width: { control: 'text' },
    height: { control: 'text' },
  },
  args: {
    shape: 'text',
    width: null,
    height: null,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 24rem;" aria-busy="true">
        <span hmhaSkeleton [shape]="shape" [width]="width" [height]="height"></span>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaSkeleton>;

/** One block. Always hidden from assistive tech; the container carries `aria-busy` (fork 38). */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[hmhaSkeleton]')).toHaveAttribute('aria-hidden', 'true');
  },
};

/** The three shapes: a text line, an avatar circle, a 16:9 thumbnail. */
export const Shapes: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap: var(--hmha-space-stack); max-width: 24rem;" aria-busy="true">
        <span hmhaSkeleton shape="text"></span>
        <span hmhaSkeleton shape="circle"></span>
        <div hmhaSkeleton shape="rect"></div>
      </div>
    `,
  }),
};

/**
 * A paragraph: repeated text blocks, the last one shorter. Each sits in its
 * own line box, so the stack keeps the rhythm of real text.
 */
export const Paragraph: Story = {
  render: () => ({
    template: `
      <div style="max-width: 28rem;" aria-busy="true" data-testid="paragraph">
        <span hmhaSkeleton></span>
        <span hmhaSkeleton></span>
        <span hmhaSkeleton></span>
        <span hmhaSkeleton width="55%"></span>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const lines = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-testid="paragraph"] [hmhaSkeleton]'));
    const tops = lines.map((line) => line.getBoundingClientRect().top);
    const lineHeight = parseFloat(getComputedStyle(lines[0].parentElement!).lineHeight);
    await expect(tops[1] - tops[0]).toBeCloseTo(lineHeight, 0);
    await expect(tops[3] - tops[2]).toBeCloseTo(lineHeight, 0);
  },
};

/** A media card while it loads: a 16:9 thumbnail and two lines, on a card's surface rather than the page. */
export const MediaCard: Story = {
  render: () => ({
    template: `
      <div style="max-width: 18rem;">
        <hmha-card aria-busy="true">
          <div style="display:grid; gap: var(--hmha-control-gap);">
            <div hmhaSkeleton shape="rect"></div>
            <span hmhaSkeleton width="80%"></span>
            <span hmhaSkeleton width="45%"></span>
          </div>
        </hmha-card>
      </div>
    `,
  }),
};

/**
 * A catalog row of posters while it loads. Posters are 2:3, so the row
 * sets its own `aspect-ratio`, overriding a rect's 16:9 default.
 */
export const PosterRow: Story = {
  render: () => ({
    template: `
      <div
        aria-busy="true"
        data-testid="poster-row"
        style="display:grid; grid-template-columns: repeat(5, 1fr); gap: var(--hmha-control-gap); max-width: 40rem;"
      >
        @for (poster of [1, 2, 3, 4, 5]; track poster) {
          <div hmhaSkeleton shape="rect" style="aspect-ratio: 2 / 3;"></div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const poster = canvasElement.querySelector<HTMLElement>('[data-testid="poster-row"] [hmhaSkeleton]')!;
    const box = poster.getBoundingClientRect();
    await expect(box.height).toBeCloseTo((box.width * 3) / 2, 0);
  },
};

/**
 * Loading table rows, then the real ones. While loading, the table body is
 * `aria-busy` and its skeleton rows are hidden; "Finish loading" swaps in
 * real rows and clears the busy state.
 */
export const LoadingTableRowsInteraction: Story = {
  render: () => ({ template: `<library-table-demo />` }),
  play: async ({ canvas, canvasElement }) => {
    const body = canvas.getByTestId('library-body');
    await expect(body).toHaveAttribute('aria-busy', 'true');
    await expect(body.querySelectorAll('[hmhaSkeleton][aria-hidden="true"]').length).toBe(12);
    // Nothing in the loading body reaches assistive tech as a cell value.
    await expect(canvas.queryByRole('cell', { name: /\S/ })).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Finish loading' }));

    await waitFor(() => expect(body).not.toHaveAttribute('aria-busy'));
    await expect(canvasElement.querySelector('[hmhaSkeleton]')).toBeNull();
    await expect(canvas.getByRole('cell', { name: 'Big Buck Bunny' })).toBeInTheDocument();
  },
};
