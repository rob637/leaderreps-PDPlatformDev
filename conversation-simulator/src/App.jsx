import { AuthGate } from './auth.jsx';
import SpikePage from './SpikePage.jsx';

export default function App() {
  return (
    <AuthGate>
      {({ user, mode }) => <SpikePage user={user} mode={mode} />}
    </AuthGate>
  );
}
