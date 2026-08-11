import {Routes, Route ,Navigate, useLocation} from "react-router";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import HostHomepage from "./pages/HostHomepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage"
import Admin from "./pages/Admin";
import AdminVideo from "./components/AdminVideo"
import HostVideo from "./components/HostVideo"
import AdminDelete from "./components/AdminDelete"
import AdminUpload from "./components/AdminUpload"
import AdminUpdateList from "./components/AdminUpdateList"
import AdminUpdateForm from "./components/AdminUpdateForm"
import AdminUsers from "./components/AdminUsers"
import CreateContest from "./components/CreateContest"
import ContestList from "./pages/ContestList"
import ContestDashboard from "./pages/ContestDashboard"
import Leaderboard from "./pages/Leaderboard"

function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/problem/') || 
                     location.pathname === '/login' || 
                     location.pathname === '/signup';

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return(
  <>
    {!hideNavbar && <Navbar />}
    <Routes>
      <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/participant" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/problems" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
      
      {/* Host Routes */}
      <Route path="/host" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <HostHomepage /> : <Navigate to="/" />} />
      <Route path="/host/panel" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <Admin /> : <Navigate to="/" />} />
      <Route path="/host/create" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/host/update" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <AdminUpdateList /> : <Navigate to="/" />} />
      <Route path="/host/update/:id" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <AdminUpdateForm /> : <Navigate to="/" />} />
      <Route path="/host/delete" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <AdminDelete /> : <Navigate to="/" />} />
      <Route path="/host/video" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <HostVideo /> : <Navigate to="/" />} />
      <Route path="/host/contest/create" element={isAuthenticated && (user?.role === 'host' || user?.role === 'starhost' || user?.role === 'admin') ? <CreateContest /> : <Navigate to="/" />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/admin/update" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdateList /> : <Navigate to="/" />} />
      <Route path="/admin/update/:id" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdateForm /> : <Navigate to="/" />} />
      <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
      <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
      <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />
      <Route path="/admin/users" element={isAuthenticated && user?.role === 'admin' ? <AdminUsers /> : <Navigate to="/" />} />
      <Route path="/admin/contest/create" element={isAuthenticated && user?.role === 'admin' ? <CreateContest /> : <Navigate to="/" />} />
      
      {/* Common Protected Routes */}
      <Route path="/contests" element={isAuthenticated ? <ContestList /> : <Navigate to="/signup" />} />
      <Route path="/contest/:id" element={isAuthenticated ? <ContestDashboard /> : <Navigate to="/signup" />} />
      <Route path="/contest/:id/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/signup" />} />
      
      {/* Public Routes */}
      <Route path="/problem/:problemId" element={<ProblemPage/>}></Route>
      
    </Routes>
  </>
  )
}

export default App;