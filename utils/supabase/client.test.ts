import { createBrowserClient } from '@supabase/ssr';
import { createClient } from './client';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}));

describe('Supabase Client Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar o createBrowserClient com as credenciais do ambiente', () => {
    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });
});
