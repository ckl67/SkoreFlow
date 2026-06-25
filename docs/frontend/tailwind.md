# Tailwind CSS

## Installation de Tailwind CSS

[Tailwind css](https://tailwindcss.com/), helps to build modern websites without ever leaving your HTML.

```shell

npm install tailwindcss @tailwindcss/vite -w frontend

```

## Tailwind CSS Syntax Cheat Sheet

Tailwind CSS works with an intuitive system of **utility classes**. This guide breaks down the core syntax and classes you need to build layouts, components, and responsive designs.

---

### Box Model & Spacing

Tailwind uses a numeric scale where `1` equals `0.25rem` (`4px` by default).

- **Margin (External space):** `m-4` (all sides), `mx-2` (left/right), `my-auto` (top/bottom), `mt-6` (top), `mb-4` (bottom).
- **Padding (Internal space):** `p-4` (all sides), `px-3` (left/right), `py-2` (top/bottom).
- **Dimensions:**
  - **Width:** `w-full` (100%), `w-screen` (100vw), `w-64` (16rem / 256px), `max-w-md`.
  - **Height:** `h-screen` (100vh), `h-16` (4rem / 64px), `h-full`.

---

### Layout: Flexbox & Grid

Essential tools for aligning elements and building page structures.

- **Flexbox:**
  - `flex` (enables flexbox context).
  - `flex-col` (sets flex direction to column).
  - `flex-1` (allows an item to grow and shrink to take up available space).
  - `items-center` (aligns items vertically).
  - `justify-center` / `justify-between` (aligns items horizontally).
- **Gaps:** `gap-2` / `gap-4` (defines the space between child elements inside a flex or grid container).
- **Grid:** `grid`, `grid-cols-3` (creates a 3-column grid).

---

### Typography

Used to style text elements, headings, and paragraphs.

- **Size:** `text-xs`, `text-sm`, `text-base` (default), `text-lg`, `text-xl`, `text-2xl`, etc.
- **Font Weight:** `font-normal`, `font-medium`, `font-semibold`, `font-bold`.
- **Color & Alignment:** `text-gray-500`, `text-white`, `text-center`, `text-left`.

---

### Visual Styles (Borders, Shadows, Colors)

Classes to style your buttons, cards, and containers.

- **Background:** `bg-white`, `bg-gray-100`, `bg-transparent`.
- **Borders:** `border` (adds a 1px border), `border-b` (bottom only), `border-r` (right only), `border-gray-200`.
- **Border Radius (Rounded corners):** `rounded` (small), `rounded-lg` (medium), `rounded-xl` (large), `rounded-full` (pill/circle).
- **Box Shadows:** `shadow-sm`, `shadow-md`, `shadow-lg`.

---

### Positioning & Visibility

- **Position:** `fixed`, `absolute`, `relative`, `sticky`.
- **Coordinates:** `top-0`, `bottom-4`, `right-4`, `left-1/2`.
- **Overflow:** `overflow-auto` (adds scrollbars when needed), `overflow-hidden` (clips content that extends beyond the container).

---

### States & Responsiveness

Tailwind uses **modifiers** (prefixes) to handle user interactions and media queries.

### Interaction States

- **Hover (`hover:`):** `hover:bg-gray-100` (changes the background color on mouse hover).
- **Focus (`focus:`):** `focus:ring-2` (adds a focus ring, crucial for accessibility on inputs and buttons).

### Responsive Design (Mobile-First)

By default, Tailwind classes apply to all screen sizes (starting from mobile). You add prefixes to apply styles on larger screens:

- `md:` (tablets and up) $\rightarrow$ _Example:_ `w-full md:w-1/2`
- `lg:` (laptops/desktops) $\rightarrow$ _Example:_ `flex-col lg:flex-row`

---

## 💡 Pro-Tip: Arbitrary Values

If you need a specific value that doesn't exist in Tailwind's default theme, you can use square brackets `[]`:

- `w-[350px]` (exact width of 350px)
- `bg-[#FF5733]` (custom hex color)
- `top-[12%]` (exact percentage positioning)
