'use client';

import { loginUser } from '@/actions/auth';
import { LoginFormData, loginSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { toast } from './ui/toast';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    startTransition(async () => {
      const response = await loginUser(data);

      if (response?.error) {
        toast.add({
          title: 'Error.',
          description: response.error,
          type: 'error',
        });
      } else if (response?.success) {
        router.refresh();
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acesso ao Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                required
                {...register('email')}
                disabled={isPending}
              />
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                required
                {...register('password')}
                disabled={isPending}
              />
              {errors.password && (
                <span className="text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Autenticando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
