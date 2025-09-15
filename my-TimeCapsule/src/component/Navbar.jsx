import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="p-4 bg-gray-100 shadow">
      <div className="flex gap-6 justify-center">
       
        <Link to="/create" className="text-blue-600 hover:underline">
          Create a Capsule
        </Link>
        <Link to="/unlock" className="text-blue-600 hover:underline">
          Unlock Capsule
        </Link>

      </div>
    </nav>
  );
}

export default Navbar;
