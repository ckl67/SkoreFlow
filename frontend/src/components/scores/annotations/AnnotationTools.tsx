import { createContext, useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type AnnotationTool = 'circle' | 'arrow' | 'rectangle' | 'text';

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

type ToolbarPosition = {
  x: number;
  y: number;
};

/**
 * AnnotationTools component acts as a context provider and floating draggable toolbar
 * that manages drawing tool states (active tool, dimensions, stroke width, font size, and color)
 * and handles context menu interactions to position the toolbar over the score.
 *    It handles the display of the toolbox and provides access to the context :
 *    activeTool, circleDiameter, strokeWidth, rectangleWidth,  rectangleHeight,
 *    fontSize,color, ..
 *
 * @param props - The component properties.
 * @param props.children - The child components wrapped within the annotation tools context provider.
 * @returns The rendered AnnotationTools component containing the provider wrapper, context menu listener, and floating toolbar.

 */
export default function AnnotationTools({ children }: Props) {
  const [toolbarOpen, setToolbarOpen] = useState(false);

  // Position relative to the browser viewport.
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

  const toolButtonClass = (tool: AnnotationTool) =>
    `rounded border px-3 py-2 text-sm ${
      activeTool === tool
        ? 'border-blue-600 bg-blue-100 text-blue-800'
        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
    }`;

  const settingInputClass =
    'w-20 rounded border border-gray-300 px-2 py-1 text-sm';

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
            className="fixed z-50 w-72 rounded-lg border bg-white shadow-2xl "
            style={{
              left: toolbarPosition.x,
              top: toolbarPosition.y,
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {/* Draggable toolbar header. */}
            <div
              className="flex cursor-move items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-50 px-3 py-2 select-none"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">⠿</span>
                <span className="text-sm font-semibold text-gray-700">
                  Annotation Tools
                </span>
              </div>

              <button
                type="button"
                className="rounded px-1.5 py-0.5 font-bold text-gray-400 hover:text-gray-700"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setToolbarOpen(false)}
                title="Close"
                aria-label="Close annotation tools"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-3 overflow-y-auto">
              {/* Shape and text tools. */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Tools
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={toolButtonClass('circle')}
                    onClick={() => setActiveTool('circle')}
                  >
                    ○ Circle
                  </button>

                  <button
                    type="button"
                    className={toolButtonClass('arrow')}
                    onClick={() => setActiveTool('arrow')}
                  >
                    ↗ Arrow
                  </button>

                  <button
                    type="button"
                    className={toolButtonClass('rectangle')}
                    onClick={() => setActiveTool('rectangle')}
                  >
                    □ Rectangle
                  </button>

                  <button
                    type="button"
                    className={toolButtonClass('text')}
                    onClick={() => setActiveTool('text')}
                  >
                    T Text
                  </button>
                </div>
              </section>

              {/* Line and text appearance. */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-gray-500">
                  Style
                </h3>

                <label className="flex items-center justify-between gap-3 text-sm">
                  Line thickness
                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={strokeWidth}
                      onChange={(event) =>
                        setStrokeWidth(Math.max(1, Number(event.target.value)))
                      }
                      className={settingInputClass}
                    />
                    <span className="text-gray-500">px</span>
                  </span>
                </label>

                <label className="flex items-center justify-between gap-3 text-sm">
                  Font size
                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      min={6}
                      max={100}
                      value={fontSize}
                      onChange={(event) =>
                        setFontSize(Math.max(6, Number(event.target.value)))
                      }
                      className={settingInputClass}
                    />
                    <span className="text-gray-500">px</span>
                  </span>
                </label>

                <label className="flex items-center justify-between gap-3 text-sm">
                  Color
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-gray-300"
                  />
                </label>
              </section>

              <div className="border-t border-gray-200 pt-2 text-xs text-gray-500">
                <strong>
                  {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
                </strong>
                {activeTool !== 'text' &&
                  ` ::  Size ${strokeWidth} - Color ${color}`}
                {activeTool === 'text' &&
                  ` - Font ${fontSize} - Color ${color}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </AnnotationToolsContext.Provider>
  );
}
