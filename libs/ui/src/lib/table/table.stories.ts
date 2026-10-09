import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { HmhaTableCell } from './table-cell';
import { HmhaTableHeaderCell } from './table-header-cell';
import { HmhaTableRow } from './table-row';
import { HmhaTable } from './table';

const meta: Meta<HmhaTable> = {
  title: 'Components/Table',
  component: HmhaTable,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaTable, HmhaTableRow, HmhaTableHeaderCell, HmhaTableCell] })],
  // Four attribute-selector pieces on native table elements, no custom tag
  // names — same reasoning as Tabs (fork 18). Purely visual, no row model:
  // the consumer writes the <thead>/<tbody> structure themselves.
  render: () => ({
    template: `
      <table hmhaTable>
        <thead>
          <tr>
            <th hmhaTableHeaderCell>Name</th>
            <th hmhaTableHeaderCell>Role</th>
            <th hmhaTableHeaderCell>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr hmhaTableRow>
            <td hmhaTableCell>Ada Lovelace</td>
            <td hmhaTableCell>Engineer</td>
            <td hmhaTableCell>Active</td>
          </tr>
          <tr hmhaTableRow>
            <td hmhaTableCell>Alan Turing</td>
            <td hmhaTableCell>Engineer</td>
            <td hmhaTableCell>Active</td>
          </tr>
          <tr hmhaTableRow>
            <td hmhaTableCell>Grace Hopper</td>
            <td hmhaTableCell>Admiral</td>
            <td hmhaTableCell>Retired</td>
          </tr>
          <tr hmhaTableRow>
            <td hmhaTableCell>Katherine Johnson</td>
            <td hmhaTableCell>Mathematician</td>
            <td hmhaTableCell>Retired</td>
          </tr>
        </tbody>
      </table>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaTable>;

/** Default — header styling, alternating row stripes, borders. */
export const Playground: Story = {};

/** A leftmost `<th scope="row">` cell inside each body row, labelling that row the same way the header row labels columns. */
export const RowHeaderScope: Story = {
  render: () => ({
    template: `
      <table hmhaTable>
        <thead>
          <tr>
            <th hmhaTableHeaderCell>Name</th>
            <th hmhaTableHeaderCell>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr hmhaTableRow>
            <th hmhaTableHeaderCell scope="row">Ada Lovelace</th>
            <td hmhaTableCell>Engineer</td>
          </tr>
          <tr hmhaTableRow>
            <th hmhaTableHeaderCell scope="row">Grace Hopper</th>
            <td hmhaTableCell>Admiral</td>
          </tr>
        </tbody>
      </table>
    `,
  }),
};

/** Row/cell padding comes from the density-aware --hmha-control-padding-y/x tokens — no input of Table's own needed. */
export const Densities: Story = {
  render: () => ({
    template: `
      <strong>Compact density</strong>
      <div data-hmha-density="compact">
        <table hmhaTable>
          <thead>
            <tr><th hmhaTableHeaderCell>Name</th><th hmhaTableHeaderCell>Role</th></tr>
          </thead>
          <tbody>
            <tr hmhaTableRow><td hmhaTableCell>Ada Lovelace</td><td hmhaTableCell>Engineer</td></tr>
            <tr hmhaTableRow><td hmhaTableCell>Grace Hopper</td><td hmhaTableCell>Admiral</td></tr>
          </tbody>
        </table>
      </div>

      <strong>Comfortable density</strong>
      <div data-hmha-density="comfortable">
        <table hmhaTable>
          <thead>
            <tr><th hmhaTableHeaderCell>Name</th><th hmhaTableHeaderCell>Role</th></tr>
          </thead>
          <tbody>
            <tr hmhaTableRow><td hmhaTableCell>Ada Lovelace</td><td hmhaTableCell>Engineer</td></tr>
            <tr hmhaTableRow><td hmhaTableCell>Grace Hopper</td><td hmhaTableCell>Admiral</td></tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};
