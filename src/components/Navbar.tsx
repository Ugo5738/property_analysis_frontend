import { Link } from 'react-router-dom';
import { useAuth } from '../components/contexts/AuthContext';

const Navbar = () => {
  const { logout } = useAuth();
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  return (
    <nav className="bg-white shadow-md">
      <div className="flex justify-between items-center w-full py-4 px-6">
        <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
          PropertyAnalyzer
        </Link>
        {isAuthenticated && (
          <button
            onClick={logout}
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Come Back Later
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
