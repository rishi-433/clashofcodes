import { useEffect, useState } from 'react';
import { NavLink, Navigate } from 'react-router'; // Fixed import
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { loadRazorpayScript } from '../utils/RazorpayService';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentRole = user?.role || 'user';
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all' 
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]); // Clear solved problems on logout
  };

  const handleUpgradeHost = async () => {
    try {
      // Mock backend call assuming we just upgrade
      await axiosClient.post('/user/upgrade-role', { role: 'host' }).catch(() => {});
      dispatch(updateRole('host'));
      alert("Successfully upgraded to Host for free!");
    } catch (e) {
      console.error(e);
      alert("Failed to upgrade role");
    }
  };

  const handleUpgradeStarhost = async () => {
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }
      
      // Mock options - in reality order ID comes from backend
      const options = {
        key: "rzp_test_mockkey_placeholder", // Replace with real test key
        amount: "99900", // ₹999.00
        currency: "INR",
        name: "Contest Platform",
        description: "Starhost Upgrade",
        handler: async function (response) {
          // Mock verification call
          await axiosClient.post('/user/upgrade-role', { role: 'starhost' }).catch(() => {});
          dispatch(updateRole('starhost'));
          alert("Payment successful! You are now a Starhost!");
        },
        prefill: {
          name: user?.firstName || 'User',
          email: user?.emailId || 'user@example.com',
        },
        theme: {
          color: "#3399cc",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (e) {
      console.error(e);
      alert("Payment initialization failed.");
    }
  };

  const filteredProblems = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch = filters.status === 'all' || 
                      solvedProblems.some(sp => sp._id === problem._id);
    return difficultyMatch && tagMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-base-200">
      {/* Main Content */}
      <div className="container mx-auto p-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* New Status Filter */}
          <select 
            className="select select-bordered"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All Problems</option>
            <option value="solved">Solved Problems</option>
          </select>

          <select 
            className="select select-bordered"
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select 
            className="select select-bordered"
            value={filters.tag}
            onChange={(e) => setFilters({...filters, tag: e.target.value})}
          >
            <option value="all">All Tags</option>
            <option value="array">Array</option>
            <option value="linkedList">Linked List</option>
            <option value="graph">Graph</option>
            <option value="dp">DP</option>
          </select>
        </div>

        {/* Solved Problems Section */}
        {user && solvedProblems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              My Solved Problems
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {solvedProblems.map(problem => (
                <div key={problem._id} className="card bg-base-100 shadow-xl border-t-4 border-success">
                  <div className="card-body">
                    <h3 className="card-title text-lg">
                      <NavLink to={`/problem/${problem._id}`} className="hover:text-primary">
                        {problem.title}
                      </NavLink>
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </div>
                      <div className="badge badge-info">{problem.tags}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider mt-8">All Problems</div>
          </div>
        )}

        {/* Problems List */}
        <div className="grid gap-4">
          {filteredProblems.map(problem => (
            <div key={problem._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">
                    <NavLink to={`/problem/${problem._id}`} className="hover:text-primary">
                      {problem.title}
                    </NavLink>
                  </h2>
                  {solvedProblems.some(sp => sp._id === problem._id) && (
                    <div className="badge badge-success gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Solved
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </div>
                  <div className="badge badge-info">
                    {problem.tags}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'hard': return 'badge-error';
    default: return 'badge-neutral';
  }
};

export default Homepage;