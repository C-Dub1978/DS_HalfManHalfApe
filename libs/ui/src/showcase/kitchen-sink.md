# Kitchen sink (planned)

This is going to be the full-fledged kitchen sink, that is a story that has every single component, multiple layouts, everything.
Yes, this is sort of clashing with the app sandbox, but its more for documentation purposes and showing all variants of all components,
whilst also giving interactivity controls to the developer whos running the story.

## Tabs vs. multiple stories

We have two good options for the "multiple pages" idea:

Several stories under one title. Export one story per page (Forms, Buttons, Feedback, Layout...) from kitchen-sink.stories.ts. The Storybook
sidebar then groups them and works like tabs, with no extra code, and each page gets its own URL. One story with real tabs. Build the page with
your own tabs component, if the library has one. This doubles as a good real-world test of that component, but everything lives in a single story.

Option 1 is simpler to maintain, and option 2 is a nicer demo. Either way, give it a title like title: 'Overview/Kitchen Sink' so it sits in its
own section at the top of the sidebar, separate from the per-component stories.

## How it differs from the sandbox

This overlaps a bit with apps/sandbox, but they serve different purposes. The sandbox proves the libraries work when consumed like a real client
app would (imports through the public API, real app setup), while the kitchen sink is a visual inventory inside your docs. It's worth keeping
both. For the kitchen sink, a density toggle, like a wrapper with data-hmha-density bound to a Storybook control, would let you see every
component switch between comfortable and compact at once.
