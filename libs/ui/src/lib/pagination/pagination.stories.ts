import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { HmhaPagination } from './pagination';

const meta: Meta<HmhaPagination> = {
  title: 'Components/Pagination',
  component: HmhaPagination,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaPagination] })],
  argTypes: {
    page: { control: 'number' },
    pageCount: { control: 'number' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: {
    page: 5,
    pageCount: 10,
    size: 'md',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `<nav hmhaPagination [page]="page" [pageCount]="pageCount" [size]="size" [disabled]="disabled"></nav>`,
  }),
};
export default meta;

type Story = StoryObj<HmhaPagination>;

/** Default — page and pageCount drive the rendered window; every input controllable. */
export const Playground: Story = {};

/** All three sizes side by side, same page/pageCount. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:16px; align-items:flex-start;">
        <nav hmhaPagination [page]="5" [pageCount]="10" size="sm" ariaLabel="Pagination (small)"></nav>
        <nav hmhaPagination [page]="5" [pageCount]="10" size="md" ariaLabel="Pagination (medium)"></nav>
        <nav hmhaPagination [page]="5" [pageCount]="10" size="lg" ariaLabel="Pagination (large)"></nav>
      </div>
    `,
  }),
};

/** A large page count collapses both sides of the window to an ellipsis. */
export const ManyPages: Story = {
  render: () => ({
    template: `<nav hmhaPagination [page]="25" [pageCount]="50"></nav>`,
  }),
};

/** Previous disables on the first page, Next on the last, and a single-page control renders no page buttons at all. */
export const EdgeStates: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:16px; align-items:flex-start;">
        <div>
          <p>First page — Previous disabled</p>
          <nav hmhaPagination [page]="1" [pageCount]="10" ariaLabel="Pagination (first page example)"></nav>
        </div>
        <div>
          <p>Last page — Next disabled</p>
          <nav hmhaPagination [page]="10" [pageCount]="10" ariaLabel="Pagination (last page example)"></nav>
        </div>
        <div>
          <p>Single page — no page buttons, both arrows disabled</p>
          <nav hmhaPagination [page]="1" [pageCount]="1" ariaLabel="Pagination (single page example)"></nav>
        </div>
      </div>
    `,
  }),
};

/** disabled disables every button, including the current page's. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    for (const button of Array.from(canvasElement.querySelectorAll('button'))) {
      await expect(button).toBeDisabled();
    }
  },
};

/** Clicking a page button selects it, moves aria-current, and fires pageChange with that page. */
export const PageClickInteraction: Story = {
  args: {
    page: 1,
    pageCount: 10,
    pageChange: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<nav hmhaPagination [page]="page" [pageCount]="pageCount" (pageChange)="pageChange($event)"></nav>`,
  }),
  play: async ({ canvas, args }) => {
    const pageTwo = canvas.getByRole('button', { name: 'Page 2' });
    await userEvent.click(pageTwo);
    await expect(args['pageChange']).toHaveBeenCalledWith(2);
    await expect(pageTwo).toHaveAttribute('aria-current', 'page');
  },
};

/** Previous/Next step the page by one and fire pageChange, without needing a specific page button. */
export const PreviousNextInteraction: Story = {
  args: {
    page: 5,
    pageCount: 10,
    pageChange: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<nav hmhaPagination [page]="page" [pageCount]="pageCount" (pageChange)="pageChange($event)"></nav>`,
  }),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args['pageChange']).toHaveBeenCalledWith(6);

    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }));
    await expect(args['pageChange']).toHaveBeenCalledWith(5);
  },
};
