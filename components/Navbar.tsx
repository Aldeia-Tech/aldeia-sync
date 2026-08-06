'use client';

import { useUser } from '@/provider/UserProvider';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from './theme';
import { Button } from './ui/button';

export function NavBar() {
  const user = useUser();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="flex h-[5%] items-center justify-between p-4">
      <h1>Alde</h1>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        {user ? (
          <Button className="cursor-pointer" onClick={handleSignOut}>
            Sair
          </Button>
        ) : (
          ''
        )}
      </div>
    </nav>
  );
}
