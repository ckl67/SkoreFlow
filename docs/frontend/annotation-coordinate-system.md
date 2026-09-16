# SkoreFlow — Annotation Coordinate System

## Purpose

Annotations must remain correctly positioned on a score page regardless of:

- browser window size;
- PDF display size;
- zoom level;
- canvas scaling.

To achieve this, annotation coordinates are stored independently of the current screen or canvas dimensions.

## Coordinate System

SkoreFlow uses the **PDF coordinate system** as the reference coordinate system.

Annotation coordinates are **not stored as screen pixels or percentages**.

For example:

```json
{
  "type": "circle",
  "page": 1,
  "x": 148.75,
  "y": 693.25
}
```

Here, `x` and `y` represent coordinates in the PDF page coordinate system.

## PDF.js Conversion

PDF.js provides the conversion between the PDF coordinate system and the displayed viewport.

### PDF → Canvas

When displaying an annotation:

```ts
viewport.convertToViewportPoint(x, y);
```

This converts PDF coordinates into coordinates usable by the displayed canvas/viewport.

### Canvas → PDF

When the user creates or moves an annotation:

```ts
viewport.convertToPdfPoint(x, y);
```

This converts the mouse/canvas coordinates back into PDF coordinates.

The PDF coordinates are then stored.

## Y-Axis

The PDF coordinate system and the canvas/viewport coordinate system use different Y-axis orientations.

Canvas / viewport:

```text
(0,0) ───────────────→ X
  │
  │
  ↓
  Y
```

PDF:

```text
        Y
        ↑
        │
        │
        │
(0,0) ──┴─────────────→ X
```

Therefore, **the conversion must always be performed through PDF.js** rather than manually calculating the Y coordinate.

## Scaling

The current PDF display scale must never be stored in an annotation.

For example, this should **not** be stored:

```json
{
  "x": 320,
  "y": 450,
  "scale": 1.5
}
```

Instead, the annotation stores only its PDF coordinates:

```json
{
  "x": 148.75,
  "y": 693.25
}
```

The current viewport scale is handled entirely by React/PDF.js when the annotation is rendered.

## Geometric Dimensions

Geometric properties such as:

- radius;
- width;
- height;
- line thickness;

should also be expressed in **PDF units**, rather than screen pixels.

For example:

```json
{
  "type": "circle",
  "page": 1,
  "x": 148.75,
  "y": 693.25,
  "radius": 20
}
```

The value `20` represents 20 PDF units.

This ensures that the annotation scales together with the score.

## Architecture

The responsibility is divided as follows:

```text
                     PDF
                      │
                      │
                 PDF.js viewport
                      │
          ┌───────────┴───────────┐
          │                       │
     PDF rendering          Annotation layer
          │                       │
       Canvas              React overlay
          │                       │
          └───────────┬───────────┘
                      │
              PDF coordinates
                      │
                   Backend
```

The backend stores annotation geometry using PDF coordinates.

React is responsible for converting those coordinates to the current viewport when displaying or editing annotations.

## Core Rule

> **Annotation geometry is always stored in PDF coordinates. Display coordinates are derived from the current PDF.js viewport.**
