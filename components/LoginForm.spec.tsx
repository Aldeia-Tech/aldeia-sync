import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { loginUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { toast } from './ui/toast';

vi.mock('@/actions/auth', () => ({
  loginUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('./ui/toast', () => ({
  toast: { add: vi.fn() },
}));

describe('LoginForm (Client Component)', () => {
  let mockRefresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('deve renderizar os campos do formulário corretamente', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('não deve chamar a Server Action (loginUser) se os campos estiverem vazios', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).not.toHaveBeenCalled();
    });
  });

  it('deve exibir um toast de erro se a Server Action retornar um erro', async () => {
    render(<LoginForm />);

    vi.mocked(loginUser).mockResolvedValue({ error: 'Credenciais inválidas' });

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'teste@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Senha@Forte123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: 'teste@email.com',
        password: 'Senha@Forte123!',
      });
      expect(toast.add).toHaveBeenCalledWith({
        title: 'Error.',
        description: 'Credenciais inválidas',
        type: 'error',
      });
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  it('deve chamar router.refresh() se o login for bem-sucedido', async () => {
    render(<LoginForm />);

    vi.mocked(loginUser).mockResolvedValue({
      success: true,
      message: 'Sucesso',
    });

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'teste@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Senha@Forte123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: 'teste@email.com',
        password: 'Senha@Forte123!',
      });
      expect(mockRefresh).toHaveBeenCalledOnce();
      expect(toast.add).not.toHaveBeenCalled();
    });
  });

  it('deve desabilitar os campos e mudar o texto do botão enquanto estiver autenticando', async () => {
    vi.mocked(loginUser).mockImplementation(() => {
      return new Promise((resolve) =>
        setTimeout(() => resolve({ success: true, message: '' }), 150),
      );
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'teste@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Senha@Forte123!' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    expect(submitButton).toHaveTextContent(/autenticando/i);
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledOnce();
    });
  });

  it('deve exibir mensagens de erro do Zod sob os campos se a validação falhar', async () => {
    const { container } = render(<LoginForm />);

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    fireEvent.change(passwordInput, { target: { value: '12' } });

    const form = emailInput.closest('form');

    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    await waitFor(() => {
      const errorSpans = container.querySelectorAll('.text-red-500');
      expect(errorSpans.length).toBeGreaterThan(0);
    });

    expect(loginUser).not.toHaveBeenCalled();
  });

  it('não deve disparar toast ou refresh se a resposta não contiver erro ou sucesso (else implícito)', async () => {
    render(<LoginForm />);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(loginUser).mockResolvedValue({} as any);

    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'teste@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Senha@Forte123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalled();
      expect(toast.add).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
