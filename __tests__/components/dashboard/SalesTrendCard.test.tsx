/**
 * Tests del componente SalesTrendCard (tendencia de ventas del dashboard)
 *
 * Se prueban los tres estados que decide el componente (cargando, sin ventas
 * y con ventas). El dibujo del gráfico lo hace recharts y se sustituye por un
 * marcador, porque jsdom no calcula tamaños.
 */

import { render, screen } from '@testing-library/react';
import { SalesTrendCard } from '@/components/dashboard/SalesTrendCard';

jest.mock('recharts', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="chart">{children}</div>
    ),
    LineChart: passthrough,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

const emptyDays = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-09-${String(i + 1).padStart(2, '0')}`,
  totalUsd: 0,
  count: 0,
}));

describe('SalesTrendCard', () => {
  it('muestra el título y el período en USD', () => {
    render(<SalesTrendCard data={emptyDays} />);

    expect(screen.getByText('Tendencia de Ventas')).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 días, en USD')).toBeInTheDocument();
  });

  it('sin ventas en los 30 días muestra el mensaje y no dibuja el gráfico', () => {
    render(<SalesTrendCard data={emptyDays} />);

    expect(
      screen.getByText('Aún no hay ventas en los últimos 30 días')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('sin datos del servidor tampoco inventa un gráfico', () => {
    render(<SalesTrendCard data={[]} />);

    expect(
      screen.getByText('Aún no hay ventas en los últimos 30 días')
    ).toBeInTheDocument();
  });

  it('con al menos una venta dibuja el gráfico', () => {
    const data = [...emptyDays];
    data[29] = { date: '2026-09-30', totalUsd: 4, count: 3 };

    render(<SalesTrendCard data={data} />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(
      screen.queryByText('Aún no hay ventas en los últimos 30 días')
    ).not.toBeInTheDocument();
  });

  it('mientras carga no muestra ni el mensaje vacío ni el gráfico', () => {
    const data = [...emptyDays];
    data[0] = { date: '2026-09-01', totalUsd: 4, count: 3 };

    render(<SalesTrendCard data={data} loading />);

    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Aún no hay ventas en los últimos 30 días')
    ).not.toBeInTheDocument();
  });
});
