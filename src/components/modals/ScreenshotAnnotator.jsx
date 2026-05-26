import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowUpRight,
  Square,
  Pen,
  Type,
  EyeOff,
  Undo2,
  Trash2,
} from 'lucide-react';

/**
 * ScreenshotAnnotator
 * ----------------------------------------------------------------------------
 * Lightweight in-browser annotation editor. Accepts a screenshot data URL,
 * lets the user draw arrows / boxes / freehand / text / redactions on top,
 * and emits the flattened (annotated) JPEG data URL via onChange.
 *
 * No external deps — pure HTML5 canvas + pointer events.
 *
 * Tools:
 *   - arrow   straight line with arrowhead
 *   - box     stroked rectangle
 *   - pen     freehand path
 *   - text    typed label
 *   - redact  filled black rectangle (for hiding PII)
 *
 * Coordinates: shapes are stored in the screenshot's natural pixel space.
 * The canvas is CSS-scaled to fit the modal; pointer events are remapped
 * back to natural space via the bounding-rect ratio.
 */

const COLORS = [
  { name: 'Red', value: '#dc2626' },
  { name: 'Yellow', value: '#facc15' },
  { name: 'Black', value: '#111827' },
];

const TOOLS = [
  { id: 'arrow', label: 'Arrow', Icon: ArrowUpRight },
  { id: 'box', label: 'Box', Icon: Square },
  { id: 'pen', label: 'Pen', Icon: Pen },
  { id: 'text', label: 'Text', Icon: Type },
  { id: 'redact', label: 'Redact', Icon: EyeOff },
];

function drawArrow(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = Math.max(12, width * 4);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - head * Math.cos(angle - Math.PI / 7),
    y2 - head * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    x2 - head * Math.cos(angle + Math.PI / 7),
    y2 - head * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();
}

function drawBox(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.strokeRect(
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.abs(x2 - x1),
    Math.abs(y2 - y1),
  );
}

function drawRedact(ctx, x1, y1, x2, y2) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.abs(x2 - x1),
    Math.abs(y2 - y1),
  );
}

function drawPen(ctx, points, color, width) {
  if (!points || points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawText(ctx, x, y, text, color, fontSize) {
  if (!text) return;
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'top';
  // Subtle white halo for legibility on any background
  ctx.lineWidth = Math.max(2, fontSize * 0.18);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawShape(ctx, s) {
  switch (s.type) {
    case 'arrow':
      return drawArrow(ctx, s.x1, s.y1, s.x2, s.y2, s.color, s.width);
    case 'box':
      return drawBox(ctx, s.x1, s.y1, s.x2, s.y2, s.color, s.width);
    case 'redact':
      return drawRedact(ctx, s.x1, s.y1, s.x2, s.y2);
    case 'pen':
      return drawPen(ctx, s.points, s.color, s.width);
    case 'text':
      return drawText(ctx, s.x, s.y, s.text, s.color, s.fontSize);
    default:
      return null;
  }
}

const ScreenshotAnnotator = ({ src, onChange }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const imageRef = useRef(null);
  const textInputRef = useRef(null);

  const [imageReady, setImageReady] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [draft, setDraft] = useState(null); // in-progress shape during drag
  const [tool, setTool] = useState('arrow');
  const [color, setColor] = useState(COLORS[0].value);
  const [pendingText, setPendingText] = useState(null); // {x, y, screenX, screenY}
  const [textValue, setTextValue] = useState('');

  // Reset state any time a new screenshot comes in
  useEffect(() => {
    setShapes([]);
    setDraft(null);
    setPendingText(null);
    setTextValue('');
    setImageReady(false);
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setImageReady(true);
    };
    img.src = src;
  }, [src]);

  // Stroke width scales with image so it reads well at any resolution
  const strokeWidth = imageRef.current
    ? Math.max(3, Math.round(imageRef.current.naturalWidth * 0.004))
    : 4;
  const fontSize = imageRef.current
    ? Math.max(16, Math.round(imageRef.current.naturalHeight * 0.028))
    : 20;

  // Redraw on every state change
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    for (const s of shapes) drawShape(ctx, s);
    if (draft) drawShape(ctx, draft);
  }, [shapes, draft]);

  useEffect(() => {
    if (!imageReady) return;
    render();
  }, [imageReady, render]);

  // Emit the flattened result whenever committed shapes change
  useEffect(() => {
    if (!imageReady || !onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Re-render without any draft so the export is clean
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);
    for (const s of shapes) drawShape(ctx, s);
    try {
      onChange(canvas.toDataURL('image/jpeg', 0.85));
    } catch {
      /* best-effort */
    }
    // Restore draft if any
    if (draft) drawShape(ctx, draft);
    // shapes is the dep; draft is intentionally not — we only export commits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, imageReady]);

  // Map pointer event → natural canvas coordinates
  const pointerToCanvas = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e) => {
    if (!imageReady) return;
    // Text tool: open floating input at the click position
    if (tool === 'text') {
      const { x, y } = pointerToCanvas(e);
      const wrapper = wrapperRef.current;
      const wrapperRect = wrapper.getBoundingClientRect();
      setPendingText({
        x,
        y,
        screenX: e.clientX - wrapperRect.left,
        screenY: e.clientY - wrapperRect.top,
        color,
      });
      setTextValue('');
      // Focus next tick after the input mounts
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pointerToCanvas(e);
    if (tool === 'pen') {
      setDraft({ type: 'pen', points: [{ x, y }], color, width: strokeWidth });
    } else {
      // arrow / box / redact
      setDraft({
        type: tool,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        color,
        width: strokeWidth,
      });
    }
  };

  const onPointerMove = (e) => {
    if (!draft) return;
    const { x, y } = pointerToCanvas(e);
    if (draft.type === 'pen') {
      setDraft({ ...draft, points: [...draft.points, { x, y }] });
    } else {
      setDraft({ ...draft, x2: x, y2: y });
    }
  };

  const onPointerUp = (e) => {
    if (!draft) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    // Discard zero-size shapes (accidental clicks)
    const isTrivial =
      draft.type !== 'pen' &&
      Math.abs(draft.x2 - draft.x1) < 4 &&
      Math.abs(draft.y2 - draft.y1) < 4;
    const isTinyPen = draft.type === 'pen' && draft.points.length < 2;
    if (!isTrivial && !isTinyPen) {
      setShapes((prev) => [...prev, draft]);
    }
    setDraft(null);
  };

  const commitText = () => {
    if (pendingText && textValue.trim()) {
      setShapes((prev) => [
        ...prev,
        {
          type: 'text',
          x: pendingText.x,
          y: pendingText.y,
          text: textValue.trim(),
          color: pendingText.color,
          fontSize,
        },
      ]);
    }
    setPendingText(null);
    setTextValue('');
  };

  const cancelText = () => {
    setPendingText(null);
    setTextValue('');
  };

  const undo = () => setShapes((prev) => prev.slice(0, -1));
  const clear = () => setShapes([]);

  // Approximate on-screen pixel size of the canvas font, for the text input
  const inputFontSize = (() => {
    const canvas = canvasRef.current;
    if (!canvas) return 14;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !canvas.width) return 14;
    return Math.max(12, Math.round(fontSize * (rect.width / canvas.width)));
  })();

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            title={label}
            aria-pressed={tool === id}
            className={`p-1.5 rounded-md transition-colors ${
              tool === id
                ? 'bg-corporate-teal text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />

        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setColor(c.value)}
            title={c.name}
            aria-pressed={color === c.value}
            disabled={tool === 'redact'}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              color === c.value && tool !== 'redact'
                ? 'border-slate-900 dark:border-white scale-110'
                : 'border-slate-300 dark:border-slate-600'
            } ${tool === 'redact' ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: c.value }}
          />
        ))}

        <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />

        <button
          type="button"
          onClick={undo}
          disabled={shapes.length === 0}
          title="Undo"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={shapes.length === 0}
          title="Clear all"
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={wrapperRef}
        className="relative border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="block w-full h-auto max-h-72 object-contain touch-none"
          style={{
            cursor:
              tool === 'text'
                ? 'text'
                : tool === 'redact'
                ? 'crosshair'
                : 'crosshair',
          }}
        />
        {pendingText && (
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitText();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelText();
              }
            }}
            onBlur={commitText}
            placeholder="Type, press Enter"
            className="absolute bg-white/95 dark:bg-slate-800/95 border border-corporate-teal rounded px-1.5 py-0.5 outline-none shadow-md"
            style={{
              left: pendingText.screenX,
              top: pendingText.screenY,
              color: pendingText.color,
              fontWeight: 700,
              fontSize: `${inputFontSize}px`,
              maxWidth: '70%',
            }}
          />
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Tip: use <strong>Redact</strong> to hide any personal info before
        submitting.
      </p>
    </div>
  );
};

export default ScreenshotAnnotator;
