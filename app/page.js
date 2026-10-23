import { MadrassaApp } from './components/MadrassaApp';

/**
 * The only page of the app (the "/" route). All screens are shown inside <MadrassaApp />,
 * which switches between them without reloading the page.
 */
export default function HomePage() {
  return <MadrassaApp />;
}
