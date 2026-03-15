/**
 * App shell — wraps with ThemeProvider and React Query.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./hooks/useTheme";
import { HomePage } from "./pages/HomePage";

const queryClient = new QueryClient({
  defaultOptions: { mutations: { retry: 1 } },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
