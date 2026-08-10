import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Importações
import { useUser } from '@/provider/UserProvider';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { NavBar } from './Navbar'; // Ajuste o caminho se necessário

// 1. Mocks das dependências
vi.mock('@/provider/UserProvider', () => ({
  useUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Substituímos o componente de tema por um elemento simples para evitar problemas
// caso ele dependa de provedores como "next-themes".
vi.mock('./theme', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher">Theme</div>,
}));

describe('NavBar (Client Component)', () => {
  let mockRefresh: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup do useRouter
    mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>);

    // Setup do Supabase createClient
    mockSignOut = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createClient).mockReturnValue({
      auth: { signOut: mockSignOut },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('deve renderizar o logo (Alde) e o ThemeSwitcher para todos os usuários', () => {
    // Simulando que não há usuário (deslogado)
    vi.mocked(useUser).mockReturnValue(null);

    render(<NavBar />);

    expect(screen.getByRole('heading', { name: 'Alde' })).toBeInTheDocument();
    expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
  });

  it('NÃO deve renderizar o botão "Sair" se o usuário estiver deslogado', () => {
    // Simulando que não há usuário
    vi.mocked(useUser).mockReturnValue(null);

    render(<NavBar />);

    // queryByRole retorna null se não encontrar o elemento (diferente do getByRole que dá erro)
    const btnSair = screen.queryByRole('button', { name: /sair/i });
    expect(btnSair).not.toBeInTheDocument();
  });

  it('deve renderizar o botão "Sair" se o usuário estiver logado', () => {
    // Simulando um usuário ativo
    vi.mocked(useUser).mockReturnValue({
      id: 'usuario-123',
      email: 'teste@teste.com',
    } as unknown as ReturnType<typeof useUser>);

    render(<NavBar />);

    const btnSair = screen.getByRole('button', { name: /sair/i });
    expect(btnSair).toBeInTheDocument();
  });

  it('deve chamar o signOut e o router.refresh() ao clicar no botão "Sair"', async () => {
    const user = userEvent.setup();
    // Simulando um usuário ativo
    vi.mocked(useUser).mockReturnValue({
      id: 'usuario-123',
      email: 'teste@teste.com',
    } as unknown as ReturnType<typeof useUser>);

    render(<NavBar />);

    const btnSair = screen.getByRole('button', { name: /sair/i });
    await user.click(btnSair);

    // O signOut é chamado primeiro
    expect(mockSignOut).toHaveBeenCalledOnce();

    // Como o botão faz um await na chamada do signOut, usamos waitFor para verificar o refresh
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledOnce();
    });
  });
});
