import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navigation from '@/components/Navigation';
import CardBucket from '@/components/CardBucket';
import Home from '@/pages/Home';
import CardEditor from '@/pages/CardEditor';
import Export from '@/pages/Export';
import Settings from '@/pages/Settings';
import { useTheme } from '@/hooks/useTheme';

function App() {
  useTheme(); // Initialize theme system

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={<CardEditor />} />
            <Route path="/export" element={<Export />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <CardBucket />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
