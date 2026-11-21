<!-- cspell:ignore Flexbox  jamais écrasé   -->

# Tailwind CSS

[← back](../doc.md)

## Installation de Tailwind CSS

[Tailwind css](https://tailwindcss.com/), helps to build modern websites without ever leaving your HTML.

```shell

npm install tailwindcss @tailwindcss/vite -w frontend

```

## Tailwind CSS Syntax Cheat Sheet

Tailwind CSS works with an intuitive system of **utility classes**. This guide breaks down the core syntax and classes you need to build layouts, components, and responsive designs.

## Strategy

Tailwind classes are modular: each family of utility classes acts independently on a specific CSS property:

Sizes and widths (w-full, max-w-xl, h-64) deal solely with the element’s dimensions.

Margins (mx-auto, mt-4, p-6) only affect spacing around or within the element.

Positioning (flex, grid, relative) is only used when you need to align multiple elements with one another.

flex (Flexbox) and grid (CSS Grid) are, first and foremost, native technologies of CSS (the standard web language).

- Flexbox (flex) is the king of 1D (one dimension): perfect for aligning elements in rows (flex-row) or columns (flex-col).

- CSS Grid (grid) is the king of 2D (two dimensions): perfect for organizing elements in columns and rows at the same time (such as a table or a grid of buttons).

## Box Model & Spacing

Tailwind uses a numeric scale where `1` equals `0.25rem` (`4px` by default).

- **Margin (External space):** `m-4` (all sides), `mx-2` (left/right), `my-auto` (top/bottom), `mt-6` (top), `mb-4` (bottom).
- **Padding (Internal space):** `p-4` (all sides), `px-3` (left/right), `py-2` (top/bottom).
- **Dimensions:**
  - **Width:** `w-full` (100%), `w-screen` (100vw), `w-64` (16rem / 256px), `max-w-md`.
  - **Height:** `h-screen` (100vh), `h-16` (4rem / 64px), `h-full`.

### flex

Enables Flexbox and defines the axis

flex-col, flex-row

- flex-col: children vertically (from top to bottom)
- flex-row : from left to right

### Size & Flex

- flex-1 : Use ALL the remaining space available in the parent box.
- flex-2 : Use the HALF of the remaining space available in the parent box.

- If two children have flex-1, they share the free space equally (50 per cent each).
- If one child has flex-1 and another has flex-2, the second child will take up twice as much free space as the first.

### shrink-0 (Crucial)

- shrink-0 = is never squeezed (jamais écrasé !)
- with `<header className="h-16 shrink-0">`
  - The browser locks the 64px width of the `<header>`.
  - It tells the section: “The top bar won’t move a millimeter.
  - If you’re too wide, it’s up to you to manage your own scrolling (overflow-auto) within the space you have left.”

By default, within a Flexbox container, children have `flex-shrink: 1`, which means that the browser attempts to shrink the element so that it fits on the screen. By setting `shrink-0` (`flex-shrink: 0`), you’re telling Flexbox: ‘Do not shrink this div; strictly maintain the width calculated by the viewport (`viewport.width`).’

### Screen Size

- h-screen
  - the full height of the screen
- w-screen
  - the full width of the screen

- h-full
  - Takes up 100 per cent of the height of its PARENT element.
- w-full
  - Takes up 100 per cent of the width of its PARENT element.

- In child elements (such as ScoreViewer) set `h-full` to say Fill 100 per cent of the space allocated by the parent component.
- This is **Crucial** for unlocking the internal scroll

### Screen Layer

`z-50`, relates to the Z-axis (depth, or the stacking of elements on top of one another), which is known as the z-index in CSS.

When we use several elements overlapping on a web page (for example, your floating toolbox that overlaps the PDF or other menus), the browser needs to know which one is displayed in the foreground and which one is in the background.

- z-0 (or no z-class): This is the default base level.
- The higher the number, the ‘higher’ the element is in the stack and the more it comes to the foreground.
- z-50 is a high value in Tailwind (often one of the highest used by default, alongside z-max).

### overflow

overflow-hidden,
overflow-auto

By default, if a child element (for example, a large section or a zoomed-in canvas) exceeds the size of its parent container,
the browser either allows to create a scroll bar across the entire browser window.
With overflow-hidden sets a strict rule: Anything that extends beyond the physical boundaries of this <div> is hidden (clipped) -> NO Scroll BAR

Scrolling will only occur within the areas you have selected (overflow-auto).

The `overflow-auto` property only works if the browser knows the maximum height of the container.
Meaning that --> **h-full remains mandatory**

In other words
“Set the height to h-full (100% of the height of <main>), and IF your content exceeds this height, scroll (overflow-auto).”

### relative

The relative element acts as a geometric anchor (a reference point).
It is required whenever a child element located within it uses absolute positioning (position: absolute, or the Tailwind classes absolute, fixed, inset-0).

Relative positioning turns the parent element into a ‘magnet’ (a fixed reference point) for its children that use absolute positioning

### fixed

fixed = Fixed positioning

The element is removed from the normal flow of the page and positioned relative to the browser window (the viewport), rather than relative to its parent element.

Key consequence: Even if the user scrolls or zooms, the element remains ‘fixed’ in exactly the same position on the screen. This is why it is used for modal windows, floating menus or movable toolbars.

### min-h-0

In Flexbox, by default, all elements have a hidden property: min-height: auto.
This means that the browser will not shrink an element below the minimum size of its text or image content.

`min-h-0` does not mean ‘set to 0 pixels’, but ‘remove the minimum height imposed by your content’.
To understand this, you need to recognize the trap that CSS sets for us by default.

When you write:

```Typescript
  <main className="flex-1 overflow-auto"> {/* WITHOUT min-h-0 */}
    <GrandePartition /> {/* Makes it 2000px high */}
  </main>
```

The browser secretly applies this rule: min-height: auto.
This `min-height: auto` means:
The absolute minimum height of this box must be AT LEAST equal to the height of its content (2000px).’

Result: Even though you’ve written `flex-1` to say ‘take up the remaining space on the screen’, the floor rule (`min-height: auto`) wins the battle!
The <main> stretches to 2000px, causes your screen to overflow (h-screen) and pushes your footer right to the bottom, out of view.

What min-h-0 REALLY does
When you add min-h-0 (min-height: 0px), you’re not telling the <main> to become invisible or to be 0px.

You’re simply telling it:
**“Remove that default minimum height. Don’t let your 2000px content force your hand. Your true minimum allowed height is 0px if necessary.”**

As soon as this minimum height is removed:

flex-1 takes control: The <main> adjusts exactly to the remaining height of the screen (e.g. 800px).

overflow-auto is triggered: As the container is 2000px but the <main> is restricted to 800px, the scroll bar finally appears within the <main>.

### mx-auto

In Tailwind CSS, mx-auto stands for Margin X (horizontal): auto.

When combined with `items-center` on the parent, `mx-auto` forces automatic margins on the left and right.
As soon as the width exceeds the edge of the window, the browser sets the left edge to `x=0` instead of pushing the content into the inaccessible negative area.

The essential condition: For mx-auto to work, the element must have a defined width (which is the case here thanks to the dynamic style: width: viewport?.width).
