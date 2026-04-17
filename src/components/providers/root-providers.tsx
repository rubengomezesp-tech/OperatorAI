'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { I18nProvider } from '@/lib/i18n';

export function RootProviders({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => {
              const status = (err as { status?: number }).status;
              if (status === 401 || status === 403 || status === 404) return false;
              return count < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <I18nProvider>
          {children}
          <ToastProvider />
        </I18nProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}  );
}
