import { render, screen, act } from '@testing-library/react';
import { useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

function Probe() {
  const [value, setValue] = useState('uno');
  const debounced = useDebouncedValue(value, 200);
  return (
    <div>
      <span>{debounced}</span>
      <button type="button" onClick={() => setValue('dos')}>cambiar</button>
    </div>
  );
}

describe('useDebouncedValue', () => {
  it('espera el retardo antes de publicar el valor', () => {
    vi.useFakeTimers();
    render(<Probe />);
    expect(screen.getByText('uno')).toBeInTheDocument();
    act(() => screen.getByRole('button').click());
    expect(screen.getByText('uno')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText('dos')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
