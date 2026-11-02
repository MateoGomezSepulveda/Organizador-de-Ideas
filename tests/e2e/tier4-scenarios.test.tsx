import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';
import { generateIdeaWordDocumentHtml } from '../../src/utils/wordExport';
import { SEED_IDEAS } from '../../src/constants/initialData';

describe('Tier 4 — Real-World End-to-End Scenarios', () => {
  it('1. Ciclo completo de una idea: Por Explorar -> En Desarrollo -> Completada', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Capturar idea inicial
    const quickInput = screen.getByTestId('quick-spark-input');
    await user.type(quickInput, 'Organizar mi escritorio minimalista');
    await user.click(screen.getByTestId('quick-spark-submit-btn'));

    // Abrir la idea recién creada
    const createdTitle = screen.getByText(
      'Organizar mi escritorio minimalista'
    );
    await user.click(createdTitle);

    const drawer = screen.getByTestId('idea-detail-drawer');
    const stageSelect = within(drawer).getByTestId('drawer-stage-select');
    expect(stageSelect).toHaveValue('spark');

    // Pasar a En Desarrollo y luego a Completada
    await user.selectOptions(stageSelect, 'building');
    expect(stageSelect).toHaveValue('building');

    await user.selectOptions(stageSelect, 'launched');
    expect(stageSelect).toHaveValue('launched');

    await user.click(within(drawer).getByTestId('close-drawer-btn'));

    // El contador de ideas completadas subió de 1 a 2
    expect(screen.getByTestId('kpi-launched-ideas')).toHaveTextContent('2');
  });

  it('2. Alterna a Pizarra Libre para mover tarjetas con el cursor, genera Roadmap en Word (.doc) y restaura ejemplos', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Verificar que el botón de respaldo superior fue eliminado
    expect(screen.queryByTestId('open-settings-btn')).not.toBeInTheDocument();

    // Cambiar a Pizarra Libre y volver a Cuadrícula
    await user.click(screen.getByTestId('board-mode-free-btn'));
    expect(screen.getByTestId('ideas-free-canvas')).toBeInTheDocument();

    await user.click(screen.getByTestId('board-mode-grid-btn'));
    expect(screen.getByTestId('ideas-grid')).toBeInTheDocument();

    // Verificar generación del documento Word con el Roadmap completo
    const wordHtml = generateIdeaWordDocumentHtml(SEED_IDEAS[0]);
    expect(wordHtml).toContain('ROADMAP ESTRATÉGICO Y PLAN DE EJECUCIÓN');
    expect(wordHtml).toContain(SEED_IDEAS[0].title);
    expect(wordHtml).toContain('Hoja de Ruta Completa (Roadmap por Fases)');

    // Eliminar la primera idea desde el panel lateral y restaurar ejemplos
    await user.click(screen.getByTestId('idea-card-idea-seed-1'));
    const drawer = screen.getByTestId('idea-detail-drawer');
    expect(
      within(drawer).getByTestId('drawer-download-word-btn')
    ).toBeInTheDocument();
    await user.click(within(drawer).getByTestId('delete-idea-btn'));

    expect(
      screen.queryByTestId('idea-card-idea-seed-1')
    ).not.toBeInTheDocument();

    // Restaurar ejemplo desde el banner de guía
    const guideBanner = screen.getByTestId('demo-guide-banner');
    await user.click(
      within(guideBanner).getByRole('button', { name: /Restaurar Ejemplo/i })
    );
    expect(screen.getByTestId('idea-card-idea-seed-1')).toBeInTheDocument();
  });
});
