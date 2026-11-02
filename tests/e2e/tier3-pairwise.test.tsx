import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('Tier 3 — Cross-Feature Pairwise Interactions', () => {
  it('1. Combina filtro de categoría + búsqueda + favoritas + edición en panel lateral + recálculo de resumen', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Filtrar por categoría Producto
    await user.click(screen.getByTestId('category-pill-product'));

    // 2. Activar filtro Favoritas
    await user.click(screen.getByTestId('filter-pinned-btn'));

    // 3. Buscar por palabra clave "Ejemplo 1"
    const searchInput = screen.getByTestId('search-ideas-input');
    await user.type(searchInput, 'Ejemplo 1');

    // Debe permanecer visible la idea seed-1
    const card = screen.getByTestId('idea-card-idea-seed-1');
    expect(card).toBeInTheDocument();

    // 4. Abrir el panel lateral y completar los pasos restantes
    await user.click(card);
    const drawer = screen.getByTestId('idea-detail-drawer');
    await user.click(within(drawer).getByTestId('toggle-step-step-102'));
    await user.click(within(drawer).getByTestId('toggle-step-step-103'));

    expect(
      within(drawer).getByText(/Pasos o tareas \(3\/3\)/i)
    ).toBeInTheDocument();

    // 5. Cambiar estado a Completada y verificar el contador superior
    await user.selectOptions(
      within(drawer).getByTestId('drawer-stage-select'),
      'launched'
    );
    await user.click(within(drawer).getByTestId('close-drawer-btn'));

    expect(screen.getByTestId('kpi-launched-ideas')).toHaveTextContent('2');
  });

  it('2. Combina filtro por estado + filtro por categoría + botón limpiar filtros', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('status-filter-building'));
    await user.click(screen.getByTestId('category-pill-tech'));

    expect(
      screen.getByText('Ejemplo 2: Avanza el estado de tus ideas en 1 clic')
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('reset-filters-btn'));
    expect(
      screen.getByText('Ejemplo 1: Cómo capturar y detallar una idea')
    ).toBeInTheDocument();
  });
});
