import { Link } from 'react-router-dom';

export default function SideNavbar() {
  return (
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>
          <Link to="/profile">Profile</Link>
        </li>

        <li>
          <Link to="/parameters">Parameters</Link>
        </li>

        <li>
          <Link to="/admin">Admin</Link>
        </li>
      </ul>
    </nav>
  );
}
