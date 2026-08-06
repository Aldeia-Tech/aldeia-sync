import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { loginUser } from './auth';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('loginUser (Server Action)', () => {
  let mockSignInWithPassword: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSignInWithPassword = vi.fn();

    vi.mocked(cookies).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof cookies>>,
    );

    vi.mocked(createClient).mockReturnValue({
      auth: { signInWithPassword: mockSignInWithPassword },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('deve realizar login com sucesso quando os dados forem válidos', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: '123' } },
    });

    const validData = { email: 'teste@email.com', password: 'senhaSegura123' };
    const response = await loginUser(validData);

    expect(response).toEqual({
      success: true,
      message: 'Login realizado com sucesso!',
    });
    expect(mockSignInWithPassword).toHaveBeenCalledOnce();
    expect(mockSignInWithPassword).toHaveBeenCalledWith(validData);
  });

  it('deve retornar erro se a validação do Zod falhar', async () => {
    const invalidData = { email: 'email_invalido', password: '123' };
    const response = await loginUser(invalidData);

    expect(response).toEqual({
      error: 'Dados inválidos enviados ao servidor.',
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('deve retornar mensagem de erro do Supabase se as credenciais estiverem incorretas', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
      data: { user: null },
    });

    const validData = { email: 'teste@email.com', password: 'senhaErrada123' };
    const response = await loginUser(validData);

    expect(response).toEqual({ error: 'Invalid login credentials' });
    expect(mockSignInWithPassword).toHaveBeenCalledOnce();
  });

  it('deve retornar erro genérico se ocorrer uma exceção (Catch block)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockSignInWithPassword.mockRejectedValue(new Error('Falha na rede'));

    const validData = { email: 'teste@email.com', password: 'senhaSegura123' };
    const response = await loginUser(validData);

    expect(response).toEqual({
      error: 'Ocorreu um erro interno. Tente novamente.',
    });
    expect(consoleSpy).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });
});
