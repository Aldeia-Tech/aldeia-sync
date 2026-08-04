import { createServerClient } from '@supabase/ssr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from './server';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('Supabase Server Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve repassar o getAll para o cookieStore', () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([{ name: 'sessao', value: '123' }]),
      set: vi.fn(),
    } as Partial<Awaited<ReturnType<typeof import('next/headers').cookies>>>;

    createClient(
      mockCookieStore as Awaited<
        ReturnType<typeof import('next/headers').cookies>
      >,
    );

    const config = vi.mocked(createServerClient).mock.calls[0][2];

    expect(config.cookies.getAll()).toEqual([{ name: 'sessao', value: '123' }]);
    expect(mockCookieStore.getAll).toHaveBeenCalledOnce();
  });

  it('deve repassar o setAll para o cookieStore', () => {
    const mockCookieStore = {
      getAll: vi.fn(),
      set: vi.fn(),
    } as Partial<Awaited<ReturnType<typeof import('next/headers').cookies>>>;

    createClient(
      mockCookieStore as Awaited<
        ReturnType<typeof import('next/headers').cookies>
      >,
    );
    const config = vi.mocked(createServerClient).mock.calls[0][2];

    if (config.cookies.setAll) {
      config.cookies.setAll(
        [{ name: 'token', value: 'abc', options: { path: '/' } }],
        {},
      );
    }

    expect(mockCookieStore.set).toHaveBeenCalledWith('token', 'abc', {
      path: '/',
    });
  });

  it('deve silenciar erros no setAll caso seja chamado em um Server Component', () => {
    const mockCookieStore = {
      getAll: vi.fn(),
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cannot set cookies in Server Component');
      }),
    } as Partial<Awaited<ReturnType<typeof import('next/headers').cookies>>>;

    createClient(
      mockCookieStore as Awaited<
        ReturnType<typeof import('next/headers').cookies>
      >,
    );
    const config = vi.mocked(createServerClient).mock.calls[0][2];

    expect(() => {
      if (config.cookies.setAll) {
        config.cookies.setAll(
          [{ name: 'token', value: 'abc', options: {} }],
          {},
        );
      }
    }).not.toThrow();
  });
});
