import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateRole } from '../authSlice';
import axiosClient from '../utils/axiosClient';

function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentRole = user?.role || 'user';

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleUpgradeHost = async () => {
    try {
      await axiosClient.post('/user/upgrade-role', { role: 'host' }).catch(() => {});
      dispatch(updateRole('host'));
      alert("Successfully upgraded to Host for free!");
    } catch (e) {
      console.error(e);
      alert("Failed to upgrade role");
    }
  };



  return (
      <nav className="navbar bg-base-100 shadow-lg px-4 mb-4">
        <div className="flex-1 flex items-center gap-4">
          <NavLink to="/" className="btn btn-ghost text-xl">
            CLASH-of-CODES
          </NavLink>
          <NavLink to="/contests" className="btn btn-ghost">All Contests</NavLink>
          <NavLink to="/problems" className="btn btn-ghost">Problems</NavLink>
          
          {/* Respective Panel Link */}
          {currentRole === 'admin' && <NavLink to="/admin" className="btn btn-ghost">Panel</NavLink>}
          {(currentRole === 'host' || currentRole === 'starhost') && <NavLink to="/host/panel" className="btn btn-ghost">Panel</NavLink>}
          
          {/* Role Upgrade Dropdown */}
          {(currentRole === 'user' || currentRole === 'host') && (
            <div className="dropdown ml-4">
              <label tabIndex={0} className="btn btn-primary btn-sm m-1">Upgrade Role</label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                {currentRole === 'user' && (
                  <li><a onClick={handleUpgradeHost}>Become a Host (Free)</a></li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost gap-2">
              <span>{user?.firstName || 'Guest'}</span>
              {user?.role && (
                <span className={`badge badge-sm ${user.role === 'admin' ? 'badge-secondary' : user.role === 'starhost' ? 'badge-warning' : 'badge-primary'}`}>
                  {user.role.toUpperCase()}
                </span>
              )}
            </div>
            <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><button onClick={handleLogout}>Logout</button></li>
              {currentRole === 'admin' && <li><NavLink to="/admin">Admin</NavLink></li>}
              {(currentRole === 'host' || currentRole === 'starhost') && <li><NavLink to="/host/panel">Host Panel</NavLink></li>}
            </ul>
          </div>
        </div>
      </nav>
  );
}

export default Navbar;
