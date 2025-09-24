import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import App from './App';
import { AuthProvider } from './providers/auth-provider';
import { ThemeProvider } from './providers/theme-provider';
import { api } from './lib/api';

describe('App shell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login page by default', async () => {
    const queryClient = new QueryClient();
    vi.spyOn(api, 'get').mockRejectedValue({ response: { status: 401 } });
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
    expect(await screen.findByText('后台登录')).toBeInTheDocument();
  });
});
