import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={true}
      storageKey="kwenda-theme-global"
      themes={['light', 'dark', 'system']}
      forcedTheme={undefined}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}