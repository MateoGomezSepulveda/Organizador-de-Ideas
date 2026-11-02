import React, { useRef, useState } from 'react';
import { LayoutGrid, Move } from 'lucide-react';
import { useAppDispatch } from '../../context/AppContext';
import { Idea } from '../../types/domain';
import { cn } from '../../utils/cn';
import { EmptyState } from '../common/EmptyState';
import { IdeaCard } from './IdeaCard';

interface IdeaBoardViewProps {
  ideas: Idea[];
  onOpenNewIdeaModal: () => void;
}

export const IdeaBoardView: React.FC<IdeaBoardViewProps> = ({
  ideas,
  onOpenNewIdeaModal,
}) => {
  const dispatch = useAppDispatch();
  const [boardMode, setBoardMode] = useState<'grid' | 'free'>('grid');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Estado para arrastre en Pizarra Libre (coordenadas X, Y)
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [activePointerCard, setActivePointerCard] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  if (ideas.length === 0) {
    return (
      <EmptyState
        title="No hay ideas para mostrar"
        description="Escribe una idea arriba o limpia los filtros de búsqueda para ver todas tus notas."
        actionLabel="Nueva Idea"
        onAction={onOpenNewIdeaModal}
      />
    );
  }

  // Handlers de Drag & Drop para Cuadrícula
  const handleDragStart = (e: React.DragEvent<HTMLElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== targetId) {
      setDragOverId(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      dispatch({
        type: 'REORDER_IDEAS',
        payload: { sourceId, targetId },
      });
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Handlers de Cursor para Pizarra Libre (X, Y)
  const handlePointerDownFreeCard = (
    e: React.PointerEvent<HTMLElement>,
    id: string
  ) => {
    if (boardMode !== 'free' || !canvasRef.current) return;
    const cardEl = e.currentTarget;
    const cardRect = cardEl.getBoundingClientRect();
    setActivePointerCard({
      id,
      offsetX: e.clientX - cardRect.left,
      offsetY: e.clientY - cardRect.top,
    });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointerCard || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const nextX = Math.max(
      12,
      Math.min(
        canvasRect.width - 310,
        e.clientX - canvasRect.left - activePointerCard.offsetX
      )
    );
    const nextY = Math.max(
      12,
      e.clientY - canvasRect.top - activePointerCard.offsetY
    );

    dispatch({
      type: 'MOVE_IDEA_POSITION',
      payload: {
        id: activePointerCard.id,
        position: { x: nextX, y: nextY },
      },
    });
  };

  const handleCanvasPointerUp = () => {
    if (activePointerCard) {
      setActivePointerCard(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selector de modo de movimiento con el cursor */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {boardMode === 'grid'
            ? 'Arrastra cualquier tarjeta con el cursor para cambiar su orden.'
            : 'Pizarra Libre: arrastra cada tarjeta con el cursor y suéltala en cualquier lugar del lienzo.'}
        </p>

        <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          <button
            type="button"
            data-testid="board-mode-grid-btn"
            onClick={() => setBoardMode('grid')}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors duration-200',
              boardMode === 'grid'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Cuadrícula</span>
          </button>
          <button
            type="button"
            data-testid="board-mode-free-btn"
            onClick={() => setBoardMode('free')}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors duration-200',
              boardMode === 'free'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Move className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pizarra Libre</span>
          </button>
        </div>
      </div>

      {boardMode === 'grid' ? (
        <div
          data-testid="ideas-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              draggable
              isDragging={draggedId === idea.id}
              isDragOver={dragOverId === idea.id && draggedId !== idea.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      ) : (
        <div
          ref={canvasRef}
          data-testid="ideas-free-canvas"
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className="relative min-h-[680px] w-full overflow-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 p-4"
        >
          {ideas.map((idea, index) => {
            const defaultX = (index % 3) * 320 + 20;
            const defaultY = Math.floor(index / 3) * 230 + 20;
            const posX = idea.position?.x ?? defaultX;
            const posY = idea.position?.y ?? defaultY;

            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isDragging={activePointerCard?.id === idea.id}
                onPointerDownCard={handlePointerDownFreeCard}
                style={{
                  position: 'absolute',
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: '300px',
                  zIndex: activePointerCard?.id === idea.id ? 30 : 10,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
