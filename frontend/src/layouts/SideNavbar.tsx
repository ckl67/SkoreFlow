import { Link } from 'react-router-dom';

export default function SideNavbar() {
  return (
    <nav className="w-full py-2">
      <ul className="space-y-2">
        <li>
          <Link
            to="/composers"
            className="block w-full px-2 py-2 text-center rounded-md hover:bg-gray-100 transition"
          >
            Composers
          </Link>
        </li>

        <li>
          <Link
            to="/scores"
            className="block w-full px-2 py-2 text-center rounded-md hover:bg-gray-100 transition"
          >
            Scores
          </Link>
        </li>

        <li>
          <Link
            to="/admin"
            className="block w-full px-2 py-2 text-center rounded-md hover:bg-gray-100 transition text-red-600"
          >
            Admin
          </Link>
        </li>
      </ul>
    </nav>
  );
}
