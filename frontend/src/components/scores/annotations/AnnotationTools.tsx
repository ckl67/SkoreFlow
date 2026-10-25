import { createContext, useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import {
  Circle,
  Undo2,
  Redo2,
  MoveUpRight,
  RectangleHorizontal,
  WholeWord,
  SquareDashedPlus,
} from 'lucide-react'; // For nicer icons https://lucide.dev/icons/

// ---------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------
export type AnnotationToolsContextType = {
  activeTool: AnnotationTool;
  strokeWidth: number;
  fontSize: number;
  color: string;
};

export const AnnotationToolsContext =
  createContext<AnnotationToolsContextType | null>(null);

// ---------------------------------------------------------------------
// TYPE
// ---------------------------------------------------------------------

type Props = {
  children: ReactNode;
};

// Current Tools
type AnnotationTool =
  'noTool' | 'circle' | 'arrow' | 'rectangle' | 'text' | 'undo' | 'redo';

type ToolbarPosition = {
  x: number;
  y: number;
};

/**
 * AnnotationTools component acts as a context provider and floating draggable toolbar
 * that manages drawing tool states (active tool, dimensions, stroke width, font size, and color)
 * and handles context menu interactions to position the toolbar over the score.
 *    It handles the display of the toolbox and provides access to the context :
 *    activeTool, fontSize, color, ..
 *
 * @param props - The component properties.
 * @param props.children - The child components wrapped within the annotation tools context provider.
 * @returns The rendered AnnotationTools component containing the provider wrapper, context menu listener, and floating toolbar.

 */
export default function AnnotationTools({ children }: Props) {
  // Position relative to the browser viewport.
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({
    x: 100,
    y: 100,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Active tool and drawing settings.
  const [activeTool, setActiveTool] = useState<AnnotationTool>('circle');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState('#ff0000');

  // Open the toolbar at the pointer position.
  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    // Prevents the browser’s native context menu from appearing when you right-click.
    event.preventDefault();

    setToolbarPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setToolbarOpen(true);
  };

  // Record the pointer offset when dragging starts.
  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    //Check that it is indeed a left-mouse-button click (code 0 corresponds to a left-click).
    if (event.button !== 0) return;

    setIsDragging(true);
    setDragOffset({
      x: event.clientX - toolbarPosition.x,
      y: event.clientY - toolbarPosition.y,
    });

    event.preventDefault();
    event.stopPropagation();
  };

  // Track dragging outside the toolbar and clean up event listeners.
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      setToolbarPosition({
        x: Math.max(0, event.clientX - dragOffset.x),
        y: Math.max(0, event.clientY - dragOffset.y),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Button Selection
  const toolButtonClass = (tool: AnnotationTool) =>
    `rounded border p-1 flex items-center justify-center shadow-md transition-all  ${
      activeTool === tool
        ? 'border-blue-600 bg-blue-100 text-blue-800'
        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <AnnotationToolsContext.Provider
      value={{
        activeTool,
        strokeWidth,
        fontSize,
        color,
      }}
    >
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
      >
        {children}

        {toolbarOpen && (
          <div
            // TOOLBAR WINDOW
            // - fixed: The toolbox floats on the screen and is independent.
            // - z-50: It moves to the absolute foreground, over the PDF and the rest of the page.
            // - w-xx: It has a compact fixed width (approximately 288px).
            // - bg-white: Opaque white background (so that the text in the PDF cannot be seen through it).
            // - rounded-lg: Modern rounded corners.
            // - border: A thin grey border to define the frame.
            // - shadow-2xl: A wide, deep drop shadow that gives the effect of ‘floating’ above the page.
            className="fixed z-50 bg-white backdrop-blur-sm rounded-lg border border-gray-500 shadow-xl select-none"
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <div
              // Area that the user drags with the mouse to move the window around the screen).
              //    flex: Enables Flexbox mode to align child elements  horizontally.
              //    cursor-move: Changes the mouse cursor to a move icon (a cross with arrows ✥)
              //    select-none: Prevents accidental selection of the text
              //    items-center: Vertically centres the text and icons within the header.
              //    justify-between: Spaces the elements as far apart as possible:
              //    px-3 py-2: Adds generous internal spacing (padding)
              //    rounded-t-lg: Rounds only the top corners of the bar.
              //      The main container (fixed ... rounded-lg): It rounds the entire box,
              //      but it also applies an implicit `overflow: hidden`
              //      The problem with the grey background (bg-gray-50):
              //      The header is a rectangular element positioned at the very top of the box.
              //      --> Meaning we have to round the top of the rectangle
              //    border-b border-gray-200: Draws a thin grey border at the bottom (border-b).
              //    bg-gray-50: Provides a very light grey background, which is the visual standard for distinguishing a title bar from the rest of a white panel.
              //    onMouseDown={handleMouseDown}: This is the magic trigger! This is where the event listener fires when the user clicks and holds down the mouse button on the bar to start dragging (drag & drop) the toolbox across the screen.
              className="flex cursor-move items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-100 px-2 py-1"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px]  text-gray-400">⠿</span>
                <span className="text-xs font-medium text-gray-600">
                  Annotation Tools
                </span>
              </div>

              <button
                type="button"
                className="rounded px-1 text-xs font-bold text-gray-400 hover:text-gray-700"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setToolbarOpen(false)}
                title="Close"
                aria-label="Close annotation tools"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 p-2 ">
              {/* Shape and text tools. */}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={toolButtonClass('noTool')}
                  onClick={() => setActiveTool('noTool')}
                  title="Move/Modify/Delete"
                >
                  <SquareDashedPlus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className={toolButtonClass('circle')}
                  onClick={() => setActiveTool('circle')}
                  title="Circle"
                >
                  <Circle className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className={toolButtonClass('arrow')}
                  onClick={() => setActiveTool('arrow')}
                  title="Arrow"
                >
                  <MoveUpRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className={toolButtonClass('rectangle')}
                  onClick={() => setActiveTool('rectangle')}
                  title="Rectangle"
                >
                  <RectangleHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className={toolButtonClass('text')}
                  onClick={() => setActiveTool('text')}
                  title="Text"
                >
                  <WholeWord className="w4 h-4" />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                <button
                  type="button"
                  className={toolButtonClass('undo')}
                  onClick={() => setActiveTool('undo')}
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className={toolButtonClass('redo')}
                  onClick={() => setActiveTool('redo')}
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>

              {/* Line and text appearance. */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 text-xs">
                {['circle', 'rectangle', 'arrow'].includes(activeTool) && (
                  <label className="flex items-center gap-1 text-gray-500">
                    <span>Line thickness </span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={strokeWidth}
                      onChange={(event) =>
                        setStrokeWidth(Math.max(1, Number(event.target.value)))
                      }
                      className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                    />
                    <span className="text-gray-500">px</span>
                  </label>
                )}

                {activeTool === 'text' && (
                  <label className="flex items-center gap-1 text-gray-500">
                    <span>Font size </span>
                    <input
                      type="number"
                      min={6}
                      max={100}
                      value={fontSize}
                      onChange={(event) =>
                        setFontSize(Math.max(6, Number(event.target.value)))
                      }
                      className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                    />
                    <span className="text-gray-500">px</span>
                  </label>
                )}

                {['circle', 'rectangle', 'arrow', 'text'].includes(
                  activeTool
                ) && (
                  <div className="flex items-center gap-1 text-gray-500 ml-auto">
                    <span>Color</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                      className="h-6 w-7 cursor-pointer rounded border border-gray-300 p-0 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AnnotationToolsContext.Provider>
  );
}
