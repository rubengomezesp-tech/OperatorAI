'use client';

/**
 * Editor Canvas — Konva Stage + Layers
 *
 * Renders the project's layers using react-konva.
 * Background is an Image layer (locked).
 * Text/Logo/Shape layers are draggable and resizable.
 */

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Text as KonvaText, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type {
  Layer,
  ImageLayer,
  TextLayer,
  LogoLayer,
  ShapeLayer,
} from '../types';

interface EditorCanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  canvasWidth: number;
  canvasHeight: number;
  /** display scale (0..1) so it fits in screen */
  displayScale: number;
}

export function EditorCanvas({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  canvasWidth,
  canvasHeight,
  displayScale,
}: EditorCanvasProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Attach transformer to selected node
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (!selectedLayerId) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }
    const node = stageRef.current.findOne(`#${selectedLayerId}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedLayerId, layers]);

  // Click on empty area deselects (works for both mouse + touch)
  function handleStageClick(
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    if (e.target === e.target.getStage()) {
      onSelectLayer(null);
    }
  }

  return (
    <Stage
      ref={stageRef}
      width={canvasWidth * displayScale}
      height={canvasHeight * displayScale}
      scaleX={displayScale}
      scaleY={displayScale}
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
      style={{
        background: '#0a0a0b',
        borderRadius: 8,
      }}
    >
      <KonvaLayer>
        {layers.map((layer) => {
          if (!layer.visible) return null;
          const isSelected = layer.id === selectedLayerId;

          if (layer.kind === 'image') {
            return (
              <RenderImageLayer
                key={layer.id}
                layer={layer}
                isSelected={isSelected}
                onSelect={() => onSelectLayer(layer.id)}
                onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
              />
            );
          }
          if (layer.kind === 'text') {
            return (
              <RenderTextLayer
                key={layer.id}
                layer={layer}
                isSelected={isSelected}
                onSelect={() => onSelectLayer(layer.id)}
                onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
              />
            );
          }
          if (layer.kind === 'logo') {
            return (
              <RenderLogoLayer
                key={layer.id}
                layer={layer}
                isSelected={isSelected}
                onSelect={() => onSelectLayer(layer.id)}
                onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
              />
            );
          }
          if (layer.kind === 'shape') {
            return (
              <RenderShapeLayer
                key={layer.id}
                layer={layer}
                isSelected={isSelected}
                onSelect={() => onSelectLayer(layer.id)}
                onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
              />
            );
          }
          return null;
        })}

        {/* Transformer attaches to selected node */}
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
          ]}
          borderStroke="#D4AF37"
          anchorStroke="#D4AF37"
          anchorFill="#fff"
          anchorSize={10}
          rotateAnchorOffset={28}
        />
      </KonvaLayer>
    </Stage>
  );
}

// ─────────────────────────────────────────────────────────────────
// Image / Background layer
// ─────────────────────────────────────────────────────────────────

function RenderImageLayer({
  layer,
  isSelected,
  onSelect,
  onUpdate,
}: {
  layer: ImageLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<ImageLayer>) => void;
}) {
  const [image] = useImage(layer.src, 'anonymous');
  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked && !layer.isBackground}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) =>
        onUpdate({
          x: e.target.x(),
          y: e.target.y(),
        })
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Text layer
// ─────────────────────────────────────────────────────────────────

function RenderTextLayer({
  layer,
  isSelected,
  onSelect,
  onUpdate,
}: {
  layer: TextLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<TextLayer>) => void;
}) {
  return (
    <KonvaText
      id={layer.id}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      rotation={layer.rotation}
      opacity={layer.opacity}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily}
      fontStyle={layer.fontWeight >= 600 ? 'bold' : 'normal'}
      fill={layer.fill}
      align={layer.textAlign}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      shadowColor={layer.shadow?.color}
      shadowBlur={layer.shadow?.blur ?? 0}
      shadowOffsetX={layer.shadow?.offsetX ?? 0}
      shadowOffsetY={layer.shadow?.offsetY ?? 0}
      shadowEnabled={!!layer.shadow}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) =>
        onUpdate({
          x: e.target.x(),
          y: e.target.y(),
        })
      }
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onUpdate({
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width() * scaleX),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Logo layer
// ─────────────────────────────────────────────────────────────────

function RenderLogoLayer({
  layer,
  onSelect,
  onUpdate,
}: {
  layer: LogoLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<LogoLayer>) => void;
}) {
  const [image] = useImage(layer.src, 'anonymous');
  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) =>
        onUpdate({
          x: e.target.x(),
          y: e.target.y(),
        })
      }
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onUpdate({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Shape layer
// ─────────────────────────────────────────────────────────────────

function RenderShapeLayer({
  layer,
  onSelect,
  onUpdate,
}: {
  layer: ShapeLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<ShapeLayer>) => void;
}) {
  if (layer.shapeType === 'rect') {
    return (
      <Rect
        id={layer.id}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        opacity={layer.opacity}
        fill={layer.fill}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth ?? 0}
        cornerRadius={layer.cornerRadius ?? 0}
        draggable={!layer.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) =>
          onUpdate({
            x: e.target.x(),
            y: e.target.y(),
          })
        }
      />
    );
  }
  return null;
}
