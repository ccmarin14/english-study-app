import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/word-bank', label: 'Banco de Palabras', icon: '📚' },
    { path: '/practice', label: 'Práctica', icon: '✏️' },
    { path: '/groups', label: 'Grupos', icon: '👥' },
    { path: '/import', label: 'Importar', icon: '📥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">English Study</h1>
              <div className="hidden md:flex ml-10 space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{profile.username}</span>
                </div>
              )}
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
