import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT_${url}`);
  }),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

interface MockUser {
  id: string;
  email: string;
}

interface AuthResponse {
  data: { user: MockUser | null };
  error: Error | null;
}

describe('Home Page (Server Component)', () => {
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser = vi.fn();

    vi.mocked(cookies).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof cookies>>,
    );

    vi.mocked(createClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('deve redirecionar para /login se NÃO houver usuário logado (ou se houver erro)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Não autenticado'),
    } as AuthResponse);

    await expect(Home()).rejects.toThrow('NEXT_REDIRECT_/login');

    expect(redirect).toHaveBeenCalledWith('/login');
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it('deve redirecionar para admin/user se o usuário ESTIVER logado', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: '123', email: 'admin@teste.com' } },
      error: null,
    } as AuthResponse);

    await expect(Home()).rejects.toThrow('NEXT_REDIRECT_admin/user');

    expect(redirect).toHaveBeenCalledWith('admin/user');
    expect(mockGetUser).toHaveBeenCalledOnce();
  });
});
