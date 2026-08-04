import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from './proxy';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/server', () => {
  const mockResponseCookies = { set: vi.fn() };
  return {
    NextResponse: {
      next: vi.fn().mockImplementation(() => ({
        cookies: mockResponseCookies,
      })),
      redirect: vi.fn().mockImplementation((url) => ({
        status: 307,
        url,
      })),
    },
    NextRequest: vi.fn(),
  };
});

interface MockUser {
  id: string;
  email: string;
}

interface AuthResponse {
  data: { user: MockUser | null };
}

interface CookieToSet {
  name: string;
  value: string;
  options?: { path?: string; [key: string]: unknown };
}

interface SupabaseMockConfig {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookiesToSet: CookieToSet[]) => void;
  };
}

describe('Supabase Proxy', () => {
  let mockGetUser: ReturnType<typeof vi.fn>;
  const createMockRequest = (initialPathname: string) => {
    const clonedUrl = { pathname: initialPathname };

    const mockNextUrl = {
      pathname: initialPathname,
      startsWith: (path: string) => initialPathname.startsWith(path),
      clone: vi.fn().mockReturnValue(clonedUrl),
    };

    return {
      headers: new Headers(),
      cookies: {
        getAll: vi.fn().mockReturnValue([{ name: 'my-cookie', value: 'xyz' }]),
        set: vi.fn(),
      },
      nextUrl: mockNextUrl,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser = vi.fn();
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as unknown as ReturnType<typeof createServerClient>);
  });

  describe('Lógica de Proteção de Rotas', () => {
    it('deve redirecionar para /login se o usuário NÃO estiver logado e tentar acessar /admin/user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } } as AuthResponse);
      const req = createMockRequest('/admin/user');

      await createClient(req as unknown as NextRequest);

      expect(req.nextUrl.clone).toHaveBeenCalledOnce();

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/login' }),
      );
    });

    it('deve redirecionar para / (home) se o usuário ESTIVER logado e tentar acessar /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@test.com' } },
      } as AuthResponse);

      const req = createMockRequest('/login');

      await createClient(req as unknown as NextRequest);

      expect(req.nextUrl.clone).toHaveBeenCalledOnce();
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/' }),
      );
    });

    it('NÃO deve redirecionar se o usuário NÃO estiver logado e acessar uma rota pública', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } } as AuthResponse);

      const req = createMockRequest('/sobre');

      await createClient(req as unknown as NextRequest);

      expect(req.nextUrl.clone).not.toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled(); // Passou direto
    });

    it('NÃO deve redirecionar se o usuário ESTIVER logado e acessar uma rota protegida permitida', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: '1', email: 'admin@test.com' } },
      } as AuthResponse);

      const req = createMockRequest('/admin/user');

      await createClient(req as unknown as NextRequest);

      expect(req.nextUrl.clone).not.toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Manipulação de Cookies', () => {
    it('deve atualizar os cookies da Request e da Response através do setAll', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } } as AuthResponse);
      const req = createMockRequest('/rota-publica');

      await createClient(req as unknown as NextRequest);

      const config = vi.mocked(createServerClient).mock
        .calls[0][2] as SupabaseMockConfig;

      const cookiesToSet: CookieToSet[] = [
        { name: 'auth_token', value: '12345', options: { path: '/' } },
      ];

      config.cookies.setAll(cookiesToSet);

      expect(req.cookies.set).toHaveBeenCalledWith('auth_token', '12345');
      expect(NextResponse.next).toHaveBeenCalledWith({ request: req });

      const mockNextResponseInstance = vi.mocked(NextResponse.next).mock
        .results[0].value;
      expect(mockNextResponseInstance.cookies.set).toHaveBeenCalledWith(
        'auth_token',
        '12345',
        { path: '/' },
      );
    });

    it('deve ler os cookies da Request através do getAll', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } } as AuthResponse);
      const req = createMockRequest('/rota-publica');

      await createClient(req as unknown as NextRequest);

      const config = vi.mocked(createServerClient).mock
        .calls[0][2] as SupabaseMockConfig;

      const cookies = config.cookies.getAll();

      expect(req.cookies.getAll).toHaveBeenCalledOnce();
      expect(cookies).toEqual([{ name: 'my-cookie', value: 'xyz' }]);
    });
  });
});
