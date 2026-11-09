import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { HmhaSkeleton } from '../skeleton/skeleton';
import { HmhaAvatar } from './avatar';

/**
 * A stand-in profile photo, inlined so stories never touch the network.
 * It's image data (a drawn head and shoulders), not styling, so its fills
 * aren't design tokens.
 */
const PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
      `<rect width="64" height="64" fill="#7aa6c2"/>` +
      `<circle cx="32" cy="26" r="12" fill="#f1c7a3"/>` +
      `<path d="M10 64c2-14 11-20 22-20s20 6 22 20z" fill="#2f4a5c"/>` +
      `</svg>`,
  );

/** Not an image at all, so the browser fires a real `error` event on load. */
const BROKEN = 'data:image/png;base64,bm90LWFuLWltYWdl';

const meta: Meta<HmhaAvatar> = {
  title: 'Components/Avatar',
  component: HmhaAvatar,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HmhaAvatar, HmhaSkeleton] })],
  argTypes: {
    name: { control: 'text' },
    src: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    decorative: { control: 'boolean' },
  },
  args: {
    name: 'Chris Wilson',
    src: null,
    size: 'md',
    decorative: false,
  },
  render: (args) => ({
    props: args,
    template: `<span hmhaAvatar [name]="name" [src]="src" [size]="size" [decorative]="decorative"></span>`,
  }),
};
export default meta;

type Story = StoryObj<HmhaAvatar>;

/** Default: initials from the name, announced as an image named after the person (fork 39). */
export const Playground: Story = {
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Chris Wilson' });
    await expect(avatar).toHaveTextContent('CW');
  },
};

/** The three things it can show, in fallback order: a photo, initials, the user icon. */
export const FallbackOrder: Story = {
  render: () => ({
    props: { photo: PHOTO },
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
        <span hmhaAvatar name="Ada Lovelace" [src]="photo"></span>
        <span hmhaAvatar name="Grace Hopper"></span>
        <span hmhaAvatar></span>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute('data-content', 'image'));
    await expect(canvas.getByRole('img', { name: 'Grace Hopper' })).toHaveAttribute('data-content', 'initials');
    await expect(canvas.getByRole('img', { name: 'User' })).toHaveAttribute('data-content', 'icon');
  },
};

/** The control heights, 32, 40 and 48px, so an avatar lines up with a button beside it. */
export const Sizes: Story = {
  render: () => ({
    props: { photo: PHOTO },
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
        <span hmhaAvatar size="sm" name="Small Avatar"></span>
        <span hmhaAvatar size="md" name="Medium Avatar"></span>
        <span hmhaAvatar size="lg" name="Large Avatar"></span>
        <span hmhaAvatar size="lg" name="Large Photo" [src]="photo"></span>
        <span hmhaAvatar name="Profile Header" style="--hmha-avatar-size: calc(var(--hmha-control-height-lg) * 2);"></span>
      </div>
    `,
  }),
};

/**
 * A photo URL that fails to load (an expired signed URL, a 404): a real
 * load error in a real browser, and the avatar falls back to initials.
 */
export const BrokenPhotoFallsBack: Story = {
  args: { name: 'Margaret Hamilton', src: BROKEN },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('img', { name: 'Margaret Hamilton' });
    await waitFor(() => expect(avatar).toHaveAttribute('data-content', 'initials'));
    await expect(avatar).toHaveTextContent('MH');
  },
};

/**
 * Beside the person's visible name: decorative, so a screen reader reads
 * "Linus Torvalds" once, not twice.
 */
export const DecorativeBesideName: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);" data-testid="row">
        <span hmhaAvatar decorative size="sm" name="Linus Torvalds"></span>
        <span>Linus Torvalds</span>
      </div>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvas.getByTestId('row')).toHaveTextContent('Linus Torvalds');
  },
};

/** Clickable: inside a native button, which takes its accessible name from the avatar. */
export const InAButton: Story = {
  render: () => ({
    props: { photo: PHOTO },
    template: `
      <button type="button" style="padding: 0; border: 0; background: none; border-radius: var(--hmha-radius-pill);">
        <span hmhaAvatar name="Chris Wilson" [src]="photo"></span>
      </button>
    `,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Chris Wilson' })).toBeInTheDocument();
  },
};

/**
 * A circle skeleton beside the initials avatar that replaces it: the same
 * tint and size, so the loaded state doesn't jump.
 */
export const MatchesSkeleton: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap: var(--hmha-control-gap);">
        <span aria-busy="true"><span hmhaSkeleton shape="circle"></span></span>
        <span hmhaAvatar name="Chris Wilson"></span>
      </div>
    `,
  }),
};
