import { User } from '@supabase/supabase-js';
import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Ajuste o caminho se necessário
import { UserProvider, useUser } from './UserProvider';

describe('UserProvider e useUser', () => {
  // Construímos um mock rigidamente tipado com a interface do Supabase
  // Isso evita completamente o uso de "any" ou casts inseguros.
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'teste@email.com',
    phone: '',
    app_metadata: { provider: 'email' },
    user_metadata: { nome: 'Usuário Teste' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('deve renderizar os children (filhos) corretamente', () => {
    render(
      <UserProvider user={mockUser}>
        <div data-testid="conteudo-filho">Olá Mundo</div>
      </UserProvider>,
    );

    // Garante que o Provider não quebra a renderização da aplicação
    expect(screen.getByTestId('conteudo-filho')).toBeInTheDocument();
    expect(screen.getByText('Olá Mundo')).toBeInTheDocument();
  });

  it('deve retornar o usuário logado quando consumido pelo hook', () => {
    // renderHook permite testar o hook "rodando" dentro do nosso UserProvider
    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => (
        <UserProvider user={mockUser}>{children}</UserProvider>
      ),
    });

    // O retorno (result.current) deve ser exatamente o objeto que injetamos
    expect(result.current).toEqual(mockUser);
    expect(result.current?.email).toBe('teste@email.com');
  });

  it('deve retornar null se o usuário não estiver logado (user={null})', () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => (
        <UserProvider user={null}>{children}</UserProvider>
      ),
    });

    expect(result.current).toBeNull();
  });

  it('deve retornar null se o hook for chamado fora do provider (comportamento base do createContext)', () => {
    // Chamando o hook sem o wrapper (sem o Provider)
    const { result } = renderHook(() => useUser());

    // Como o valor inicial no seu createContext é "null", é isso que ele deve retornar
    expect(result.current).toBeNull();
  });
});
