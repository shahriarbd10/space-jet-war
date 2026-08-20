// Voidline Command app shell: the route is intentionally only the full-screen tactical game theater.
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GameCanvas from "./components/GameCanvas";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <GameCanvas />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

