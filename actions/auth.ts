'use server';

import { LoginFormData, loginSchema } from '@/lib/validations/auth';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function loginUser(data: LoginFormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const parsedData = loginSchema.safeParse(data);

  if (!parsedData.success) {
    return { error: 'Dados inválidos enviados ao servidor.' };
  }

  const { email, password } = parsedData.data;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, message: 'Login realizado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { error: 'Ocorreu um erro interno. Tente novamente.' };
  }
}
