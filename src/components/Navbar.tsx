import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <ul className="flex space-x-4">
          <li><Link to="/properties" className="hover:text-gray-300">Property List</Link></li>
          <li><Link to="/analyze" className="hover:text-gray-300">New Analysis</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;