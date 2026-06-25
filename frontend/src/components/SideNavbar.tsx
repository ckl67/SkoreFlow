import { Link } from 'react-router-dom';

export default function SideNavbar() {
  return (
    <nav className="p-4">
      <ul className="space-y-2">
        <li>
          <Link to="/composers" className="block px-3 py-2 rounded-md hover:bg-gray-100 transition">
            Composers
          </Link>
        </li>

        <li>
          <Link to="/scores" className="block px-3 py-2 rounded-md hover:bg-gray-100 transition">
            Scores
          </Link>
        </li>

        <li>
          <Link
            to="/admin"
            className="block px-3 py-2 rounded-md hover:bg-gray-100 transition text-red-600"
          >
            Admin
          </Link>
        </li>
      </ul>
    </nav>
  );
}
