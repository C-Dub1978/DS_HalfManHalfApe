import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HmhaAccordion } from './accordion';
import { HmhaExpansionPanel } from './expansion-panel';
import { HmhaExpansionPanelContent } from './expansion-panel-content';
import { HmhaExpansionPanelTrigger } from './expansion-panel-trigger';

const meta: Meta<HmhaExpansionPanel> = {
  title: 'Components/ExpansionPanel',
  component: HmhaExpansionPanel,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HmhaAccordion, HmhaExpansionPanel, HmhaExpansionPanelTrigger, HmhaExpansionPanelContent],
    }),
  ],
  render: () => ({
    template: `
      <details hmhaExpansionPanel>
        <summary hmhaExpansionPanelTrigger>What's included?</summary>
        <div hmhaExpansionPanelContent>Everything in the Starter plan, plus priority support.</div>
      </details>
    `,
  }),
};
export default meta;

type Story = StoryObj<HmhaExpansionPanel>;

/** Default — a single panel, native <details>/<summary>, no ARIA needed. */
export const Playground: Story = {};

/** A shared `name` on sibling panels makes opening one natively close the others — no JS, no input on HmhaExpansionPanel for this. */
export const AccordionSingleOpen: Story = {
  render: () => ({
    template: `
      <div hmhaAccordion>
        <details hmhaExpansionPanel name="faq">
          <summary hmhaExpansionPanelTrigger>What's included?</summary>
          <div hmhaExpansionPanelContent>Everything in the Starter plan, plus priority support.</div>
        </details>
        <details hmhaExpansionPanel name="faq">
          <summary hmhaExpansionPanelTrigger>Can I cancel anytime?</summary>
          <div hmhaExpansionPanelContent>Yes — cancel from your billing settings, no questions asked.</div>
        </details>
        <details hmhaExpansionPanel name="faq">
          <summary hmhaExpansionPanelTrigger>Do you offer refunds?</summary>
          <div hmhaExpansionPanelContent>Full refunds within 30 days of purchase.</div>
        </details>
      </div>
    `,
  }),
};

/** Without a shared `name`, panels in the same group open independently. */
export const AccordionMultiOpen: Story = {
  render: () => ({
    template: `
      <div hmhaAccordion>
        <details hmhaExpansionPanel>
          <summary hmhaExpansionPanelTrigger>What's included?</summary>
          <div hmhaExpansionPanelContent>Everything in the Starter plan, plus priority support.</div>
        </details>
        <details hmhaExpansionPanel>
          <summary hmhaExpansionPanelTrigger>Can I cancel anytime?</summary>
          <div hmhaExpansionPanelContent>Yes — cancel from your billing settings, no questions asked.</div>
        </details>
      </div>
    `,
  }),
};

/** Clicking the trigger expands the panel, shows its content, and rotates the chevron — a real click, in a real browser, not Karma's own launcher (DECISIONS.md fork 25). */
export const ToggleInteraction: Story = {
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByText("What's included?");
    const details = canvasElement.querySelector('details') as HTMLDetailsElement;
    const content = canvas.getByText('Everything in the Starter plan, plus priority support.');

    await expect(details.open).toBe(false);
    await expect(content).not.toBeVisible();

    await userEvent.click(trigger);
    await expect(details.open).toBe(true);
    await expect(content).toBeVisible();
    // The trigger's data-expanded comes from the injected parent panel's
    // signal, a cross-component propagation that needs a render flush
    // beyond what userEvent.click()'s own await waits for (confirmed
    // working synchronously in Karma — this is the same async-settling
    // gap as HmhaChipSet's own key-manager story, not a component bug).
    await waitFor(() => expect(trigger).toHaveAttribute('data-expanded', ''));

    await userEvent.click(trigger);
    await expect(details.open).toBe(false);
    await expect(content).not.toBeVisible();
  },
};

/** Opening one accordion panel closes its sibling — a real click, in a real browser, proving the native `name` grouping actually works end to end. */
export const AccordionSingleOpenInteraction: Story = {
  render: () => ({
    template: `
      <div hmhaAccordion>
        <details hmhaExpansionPanel name="faq-interaction">
          <summary hmhaExpansionPanelTrigger>What's included?</summary>
          <div hmhaExpansionPanelContent>Everything in the Starter plan, plus priority support.</div>
        </details>
        <details hmhaExpansionPanel name="faq-interaction">
          <summary hmhaExpansionPanelTrigger>Can I cancel anytime?</summary>
          <div hmhaExpansionPanelContent>Yes — cancel from your billing settings, no questions asked.</div>
        </details>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const panels = Array.from(canvasElement.querySelectorAll('details')) as HTMLDetailsElement[];
    const triggers = Array.from(canvasElement.querySelectorAll('summary')) as HTMLElement[];

    await userEvent.click(triggers[0]);
    await expect(panels[0].open).toBe(true);

    await userEvent.click(triggers[1]);
    await expect(panels[1].open).toBe(true);
    await expect(panels[0].open).toBe(false);
  },
};
