import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSwitcher } from './ThemeSwitcher';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeSwitcher', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTheme).mockReturnValue({
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      theme: 'light',
      systemTheme: 'light',
      resolvedTheme: 'light',
    });
  });

  it('deve renderizar o botão de alternar tema corretamente', () => {
    render(<ThemeSwitcher />);
    const triggerBtn = screen.getByRole('button', { name: /toggle theme/i });
    expect(triggerBtn).toBeInTheDocument();
  });

  it('deve chamar setTheme com "dark" ao clicar na opção Dark', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const triggerBtn = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(triggerBtn);

    const darkOption = await screen.findByRole('menuitem', { name: /dark/i });
    await user.click(darkOption);

    expect(mockSetTheme).toHaveBeenCalledTimes(1);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('deve chamar setTheme com "light" ao clicar na opção Light', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const triggerBtn = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(triggerBtn);

    const lightOption = await screen.findByRole('menuitem', { name: /light/i });
    await user.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('deve chamar setTheme com "system" ao clicar na opção System', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const triggerBtn = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(triggerBtn);

    const systemOption = await screen.findByRole('menuitem', {
      name: /system/i,
    });
    await user.click(systemOption);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
