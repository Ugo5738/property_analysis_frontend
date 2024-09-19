import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="w-full py-4 px-6">
        <div className="flex items-center justify-start">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            PropertyAnalyzer
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
