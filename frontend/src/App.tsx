import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Translator from './pages/Translator';
import History from './pages/History';
import Auth from './pages/Auth';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout} />

        <main className="flex-1 overflow-auto bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/translator" element={<Translator user={user} />} />
            <Route path="/history" element={<History user={user} />} />
            <Route path="/auth" element={<Auth setUser={setUser} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
