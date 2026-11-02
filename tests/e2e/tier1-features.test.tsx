import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('Tier 1 — Feature Coverage (Happy Paths E2E)', () => {
  it('1. Renderiza la interfaz limpia con los 3 ejemplos de uso, resumen y modo local activo', () => {
    render(<App />);

    expect(screen.getByText('Mis Ideas')).toBeInTheDocument();
    expect(screen.getByTestId('sync-status-badge')).toHaveTextContent(
      'Guardado Local'
    );
    expect(screen.getByTestId('kpi-active-ideas')).toHaveTextContent('1');
    expect(
      screen.getByText('Ejemplo 1: Cómo capturar y detallar una idea')
    ).toBeInTheDocument();
  });

  it('2. Captura una idea rápida desde la barra superior y actualiza el contador', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByTestId('quick-spark-input');
    await user.type(input, 'Crear un blog de notas personales');
    await user.click(screen.getByTestId('quick-spark-submit-btn'));

    expect(
      screen.getByText('Crear un blog de notas personales')
    ).toBeInTheDocument();
    expect(screen.getByTestId('kpi-active-ideas')).toHaveTextContent('2');
  });

  it('3. Crea una idea desde el Modal sencillo con título, notas y categoría', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('new-idea-btn'));
    const modal = screen.getByTestId('new-idea-modal');

    await user.type(
      within(modal).getByTestId('new-idea-title-input'),
      'Aprender fotografía los domingos'
    );
    await user.type(
      within(modal).getByTestId('new-idea-summary-input'),
      'Salir 1 hora por la mañana a practicar composición'
    );
    await user.click(within(modal).getByTestId('submit-new-idea-btn'));

    expect(
      screen.getByText('Aprender fotografía los domingos')
    ).toBeInTheDocument();
  });

  it('4. Abre el panel lateral de detalles, permite escribir con espacios en título y notas, y añade un paso', async () => {
    const user = userEvent.setup();
    render(<App />);

    const card = screen.getByTestId('idea-card-idea-seed-1');
    await user.click(card);

    const drawer = screen.getByTestId('idea-detail-drawer');
    expect(drawer).toBeInTheDocument();

    const titleInput = within(drawer).getByTestId('drawer-title-input');
    await user.clear(titleInput);
    await user.type(titleInput, 'Idea editada con espacios libres');
    expect(titleInput).toHaveValue('Idea editada con espacios libres');

    const summaryInput = within(drawer).getByTestId('drawer-summary-input');
    await user.clear(summaryInput);
    await user.type(
      summaryInput,
      'Nota con múltiples palabras y espacios sin bloquearse'
    );
    expect(summaryInput).toHaveValue(
      'Nota con múltiples palabras y espacios sin bloquearse'
    );

    const stepInput = within(drawer).getByTestId('new-validation-step-input');
    await user.type(stepInput, 'Compartir con dos amigos');
    await user.click(within(drawer).getByTestId('add-validation-step-btn'));

    expect(
      within(drawer).getByText('Compartir con dos amigos')
    ).toBeInTheDocument();
  });

  it('5. Filtra las ideas por estado (Por Explorar, En Desarrollo, Completadas)', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('status-filter-launched'));
    expect(
      screen.getByText(
        'Ejemplo 3: Inicia sesión con Google para guardar tu perfil'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Ejemplo 1: Cómo capturar y detallar una idea')
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId('status-filter-all'));
    expect(
      screen.getByText('Ejemplo 1: Cómo capturar y detallar una idea')
    ).toBeInTheDocument();
  });

  it('6. Alterna entre Modo Claro y Modo Oscuro persistiendo la clase dark en html', async () => {
    const user = userEvent.setup();
    render(<App />);

    const themeBtn = screen.getByTestId('theme-toggle-btn');
    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
