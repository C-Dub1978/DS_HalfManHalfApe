import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterLink, RouterLinkActive, provideRouter } from '@angular/router';
import * as axe from 'axe-core';
import { HmhaBadge } from '../badge/badge';
import { contrast, paint } from '../core/testing/paint';
import { HmhaIcon } from '../icon/icon';
import { HmhaNavGroup } from './nav-group';
import { HmhaNavItem } from './nav-item';
import { HmhaNavList } from './nav-list';

@Component({
  selector: 'nav-host',
  imports: [HmhaNavList, HmhaNavItem, HmhaNavGroup, HmhaIcon, HmhaBadge],
  // (click) prevents navigation: Karma would otherwise leave the page.
  template: `
    <nav aria-label="Main" [attr.dir]="dir()" style="width: 280px" (click)="$event.preventDefault()">
      <ul hmhaNavList>
        <li><a hmhaNavItem href="/home" [attr.aria-current]="current() === 'home' ? 'page' : 'false'">
          <hmha-icon name="home" /> Home</a></li>
        <li hmhaNavGroup [(expanded)]="artistsOpen">
          <a hmhaNavItem href="/artists" id="artists-link" [attr.aria-current]="current() === 'album' ? 'true' : null"><hmha-icon name="users" /> Artists</a>
          <ul hmhaNavList>
            <li hmhaNavGroup [(expanded)]="albumsOpen">
              <a hmhaNavItem href="/artists/sintel">Sintel</a>
              <ul hmhaNavList>
                <li><a hmhaNavItem href="/albums/ost" [attr.aria-current]="current() === 'album' ? 'page' : null">Original score</a></li>
              </ul>
            </li>
            <li>
              <a hmhaNavItem href="/artists/elephants">Elephants Dream</a>
              <ul hmhaNavList class="plain-nested">
                <li><a hmhaNavItem href="/albums/live">Live</a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a hmhaNavItem href="/uploads">
          <hmha-icon name="upload" /> Uploads <span hmhaBadge hmhaNavItemEnd>3</span></a></li>
      </ul>
    </nav>
  `,
})
class NavHost {
  readonly current = signal<'home' | 'album' | null>('home');
  readonly artistsOpen = signal(false);
  readonly albumsOpen = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

@Component({ template: '' })
class Page {}

@Component({
  selector: 'router-nav-host',
  imports: [HmhaNavList, HmhaNavItem, RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Main">
      <ul hmhaNavList>
        <li><a hmhaNavItem routerLink="/home" routerLinkActive ariaCurrentWhenActive="page">Home</a></li>
        <li><a hmhaNavItem routerLink="/library" routerLinkActive ariaCurrentWhenActive="page">Library</a></li>
      </ul>
    </nav>
  `,
})
class RouterNavHost {}

describe('HmhaNavList', () => {
  let fixture: ComponentFixture<NavHost>;
  let host: NavHost;
  let el: HTMLElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  // Backgrounds transition on a mode switch: wait before sampling colours.
  const transitions = () => new Promise((resolve) => setTimeout(resolve, 150));
  const link = (text: string) =>
    Array.from(el.querySelectorAll<HTMLAnchorElement>('a[hmhaNavItem]')).find(
      (a) => a.querySelector('.hmha-nav-item-text')?.textContent?.trim() === text,
    )!;
  const toggleOf = (text: string) =>
    link(text).closest('li[hmhaNavGroup]')!.querySelector<HTMLButtonElement>('.hmha-nav-group-toggle')!;
  const listOf = (text: string) => link(text).closest('li')!.querySelector<HTMLUListElement>(':scope > ul')!;

  beforeEach(async () => {
    document.documentElement.setAttribute('data-hmha-mode', 'light');
    document.body.style.background = 'var(--hmha-color-bg)';
    await TestBed.configureTestingModule({
      imports: [NavHost, RouterNavHost],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'home', component: Page },
          { path: 'library', component: Page },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NavHost);
    host = fixture.componentInstance;
    await settle();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-hmha-mode');
    document.body.style.background = '';
  });

  describe('list and items', () => {
    it('is a real list of real links, with no bullets', () => {
      const list = el.querySelector('ul[hmhaNavList]')!;
      expect(list.tagName).toBe('UL');
      expect(link('Home').tagName).toBe('A');
      expect(link('Home').getAttribute('href')).toBe('/home');
      expect(getComputedStyle(list.querySelector('li')!).listStyleType).toBe('none');
    });

    it('indents a nested list one step per level, and not the top level', async () => {
      host.artistsOpen.set(true);
      host.albumsOpen.set(true);
      await settle();
      const left = (text: string) => link(text).getBoundingClientRect().left;
      expect(left('Sintel')).toBeGreaterThan(left('Artists'));
      expect(left('Original score')).toBeGreaterThan(left('Sintel'));
      expect(left('Original score') - left('Sintel')).toBeCloseTo(left('Sintel') - left('Artists'), 0);
      expect(parseFloat(getComputedStyle(el.querySelector('ul[hmhaNavList]')!).paddingInlineStart)).toBe(0);
    });

    it("lines a child's text up under the text of a parent with an icon", async () => {
      host.artistsOpen.set(true);
      await settle();
      const textLeft = (text: string) => link(text).querySelector('.hmha-nav-item-text')!.getBoundingClientRect().left;
      expect(link('Artists').querySelector('hmha-icon')).withContext('an iconned parent').not.toBeNull();
      expect(textLeft('Sintel')).toBeCloseTo(textLeft('Artists'), 0);
      expect(textLeft('Elephants Dream')).toBeCloseTo(textLeft('Artists'), 0);
    });

    it('lays out the icon, then the text filling the row, then the end slot', () => {
      const uploads = link('Uploads');
      const icon = uploads.querySelector('hmha-icon')!.getBoundingClientRect();
      const text = uploads.querySelector('.hmha-nav-item-text')!.getBoundingClientRect();
      const badge = uploads.querySelector('[hmhaBadge]')!.getBoundingClientRect();
      expect(icon.right).toBeLessThanOrEqual(text.left);
      expect(text.right).toBeLessThanOrEqual(badge.left);
      const item = uploads.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(uploads).paddingInlineEnd);
      expect(badge.right).toBeCloseTo(item.right - padding, 0);
    });

    it('marks aria-current="page" with a fill and a bar, readable in both modes', async () => {
      for (const mode of ['light', 'dark'] as const) {
        document.documentElement.setAttribute('data-hmha-mode', mode);
        await settle();
        await transitions();
        const on = getComputedStyle(link('Home'));
        const off = getComputedStyle(link('Uploads'));
        const bar = getComputedStyle(link('Home'), '::before');
        const offBar = getComputedStyle(link('Uploads'), '::before');
        expect(on.backgroundColor).withContext(mode).not.toBe(off.backgroundColor);
        expect(contrast(paint(on.color), paint(on.backgroundColor))).withContext(`${mode} text`).toBeGreaterThanOrEqual(4.5);
        expect(bar.backgroundColor).withContext(`${mode} bar`).toBe(on.color);
        expect(parseFloat(bar.width)).withContext(`${mode} bar width`).toBeGreaterThan(0);
        expect(offBar.backgroundColor).withContext(`${mode} no bar`).toBe('rgba(0, 0, 0, 0)');
      }
    });

    it('treats aria-current="true" as current too, and "false" as not', async () => {
      host.current.set('album');
      await settle();
      await transitions();
      expect(link('Artists').getAttribute('aria-current')).toBe('true');
      expect(getComputedStyle(link('Artists'), '::before').backgroundColor).toBe(getComputedStyle(link('Artists')).color);
      expect(link('Home').getAttribute('aria-current')).toBe('false');
      expect(getComputedStyle(link('Home')).backgroundColor).toBe(getComputedStyle(link('Uploads')).backgroundColor);
    });

    it('puts the bar on the leading edge, the right in right-to-left layout', async () => {
      const bar = () => getComputedStyle(link('Home'), '::before');
      expect(bar().left).toBe('0px');
      host.dir.set('rtl');
      await settle();
      expect(bar().right).toBe('0px');
    });

    it('draws the focus ring on a focused link', async () => {
      link('Home').focus();
      await settle();
      if (link('Home').matches(':focus-visible')) {
        expect(getComputedStyle(link('Home')).outlineStyle).toBe('solid');
      } else {
        pending('This launcher did not treat a programmatic focus as :focus-visible.');
      }
    });

    it('marks the page routerLinkActive points at, with no router code in the library', async () => {
      const routed = TestBed.createComponent(RouterNavHost);
      routed.detectChanges();
      await TestBed.inject(Router).navigateByUrl('/library');
      routed.detectChanges();
      await routed.whenStable();
      const [home, library] = Array.from(routed.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
      expect(library.getAttribute('aria-current')).toBe('page');
      expect(home.hasAttribute('aria-current')).toBeFalse();
      await transitions();
      expect(getComputedStyle(library).backgroundColor).not.toBe(getComputedStyle(home).backgroundColor);
    });
  });

  describe('groups', () => {
    it('render a real button that controls the nested list, named by its link', () => {
      const toggle = toggleOf('Artists');
      expect(toggle.tagName).toBe('BUTTON');
      expect(toggle.type).toBe('button');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.getAttribute('aria-controls')).toBe(listOf('Artists').id);
      expect(toggle.getAttribute('aria-labelledby')).toBe('artists-link'); // the consumer's own id, kept
      expect(link('Sintel').id).toMatch(/^hmha-nav-item-/);
      expect(toggleOf('Sintel').getAttribute('aria-labelledby')).toBe(link('Sintel').id);
    });

    it('hide a collapsed list from view, Tab order and the accessibility tree, and show it when expanded', async () => {
      const list = listOf('Artists');
      expect(list.hidden).toBeTrue();
      expect(getComputedStyle(list).display).toBe('none');

      toggleOf('Artists').click();
      await settle();
      expect(host.artistsOpen()).withContext('[(expanded)] written back').toBeTrue();
      expect(toggleOf('Artists').getAttribute('aria-expanded')).toBe('true');
      expect(list.hidden).toBeFalse();
      expect(getComputedStyle(list).display).toBe('flex');
      expect(link('Sintel').getBoundingClientRect().height).toBeGreaterThan(0);

      toggleOf('Artists').click();
      await settle();
      expect(host.artistsOpen()).toBeFalse();
      expect(list.hidden).toBeTrue();
    });

    it('open from the consumer one-way, such as the group holding the current page', async () => {
      host.artistsOpen.set(true);
      await settle();
      expect(listOf('Artists').hidden).toBeFalse();
      expect(toggleOf('Artists').getAttribute('aria-expanded')).toBe('true');
    });

    it("leave the toggle to the button: clicking the link doesn't open or close the group", async () => {
      link('Artists').click();
      await settle();
      expect(host.artistsOpen()).toBeFalse();
    });

    it('control only their own list: a nested group its own, a list under a plain item none', async () => {
      host.artistsOpen.set(true);
      await settle();
      expect(listOf('Sintel').hidden).withContext('inner group still collapsed').toBeTrue();
      expect(listOf('Sintel').id).toBe(toggleOf('Sintel').getAttribute('aria-controls')!);
      expect(listOf('Sintel').id).not.toBe(listOf('Artists').id);

      const plain = el.querySelector<HTMLUListElement>('ul.plain-nested')!;
      expect(plain.hidden).toBeFalse();
      expect(plain.hasAttribute('id')).toBeFalse();

      toggleOf('Sintel').click();
      await settle();
      expect(listOf('Sintel').hidden).toBeFalse();
      expect(listOf('Artists').hidden).toBeFalse();
    });

    it('turn the chevron when expanded', async () => {
      const icon = () => getComputedStyle(toggleOf('Artists').querySelector('hmha-icon')!).transform;
      const collapsed = icon();
      host.artistsOpen.set(true);
      await settle();
      await transitions();
      expect(icon()).not.toBe(collapsed);
    });
  });

  it('is axe-clean in both modes, collapsed and expanded', async () => {
    for (const open of [false, true]) {
      host.artistsOpen.set(open);
      host.albumsOpen.set(open);
      host.current.set(open ? 'album' : 'home');
      for (const mode of ['light', 'dark'] as const) {
        document.documentElement.setAttribute('data-hmha-mode', mode);
        await settle();
        await transitions();
        const results = await axe.run(el, { runOnly: ['wcag2a', 'wcag2aa'] });
        expect(results.violations).withContext(`${mode}, ${open ? 'expanded' : 'collapsed'}`).toEqual([]);
      }
    }
  });
});
