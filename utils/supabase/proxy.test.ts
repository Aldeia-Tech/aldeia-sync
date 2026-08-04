import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from './proxy';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: vi.fn().mockImplementation(({ request } = {}) => {
        const store = new Map();
        return {
          request,
          cookies: {
            set: vi.fn((name, value, options) =>
              store.set(name, { name, value, ...options }),
            ),
            getAll: vi.fn(() => Array.from(store.values())),
          },
        };
      }),
      redirect: vi.fn().mockImplementation((url) => {
        const store = new Map();
        return {
          status: 307,
          url,
          cookies: {
            set: vi.fn((name, value, options) =>
              store.set(name, { name, value, ...options }),
            ),
            getAll: vi.fn(() => Array.from(store.values())),
          },
        };
      }),
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

interface MockResponse {
  cookies: {
    set: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
  };
}

describe('Supabase Proxy Utility', () => {
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

  describe('Lógica de Proteção de Rotas com Propagação de Cookies', () => {
    it('deve redirecionar p/ login e propagar os cookies gerados no getUser', async () => {
      const req = createMockRequest('/admin/user');

      mockGetUser.mockImplementation(async () => {
        const config = vi.mocked(createServerClient).mock
          .calls[0][2] as SupabaseMockConfig;

        config.cookies.setAll([
          { name: 'auth_token', value: 'token-renovado' },
        ]);

        return { data: { user: null } } as AuthResponse;
      });

      const response = (await createClient(
        req as unknown as NextRequest,
      )) as unknown as MockResponse;

      expect(req.nextUrl.clone).toHaveBeenCalledOnce();
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/login' }),
      );
      expect(response.cookies.set).toHaveBeenCalledWith(
        'auth_token',
        'token-renovado',
        expect.any(Object),
      );
    });

    it('deve redirecionar p/ root (/) e propagar os cookies se o usuário logado acessar /login', async () => {
      const req = createMockRequest('/login');

      mockGetUser.mockImplementation(async () => {
        const config = vi.mocked(createServerClient).mock
          .calls[0][2] as SupabaseMockConfig;

        config.cookies.setAll([
          { name: 'auth_token', value: 'token-admin-renovado' },
        ]);

        return {
          data: { user: { id: '1', email: 'test@test.com' } },
        } as AuthResponse;
      });

      const response = (await createClient(
        req as unknown as NextRequest,
      )) as unknown as MockResponse;

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/' }),
      );

      expect(response.cookies.set).toHaveBeenCalledWith(
        'auth_token',
        'token-admin-renovado',
        expect.any(Object),
      );
    });
  });

  describe('Manipulação Básica de Cookies', () => {
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

      const mockNextResponseInstance = vi
        .mocked(NextResponse.next)
        .mock.results.at(-1)?.value as MockResponse;

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
