import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { Trash2, Trophy, Clock, Calendar } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

function ContestList() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        try {
            setLoading(true);
            const { data } = await axiosClient.get('/contest/all');
            setContests(data);
        } catch (err) {
            console.error('Fetch contests error:', err);
            setError('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this contest?')) return;
        try {
            await axiosClient.delete(`/contest/${id}`);
            setContests(contests.filter(c => c._id !== id));
        } catch (err) {
            alert('Failed to delete contest');
        }
    };

    const getContestStatus = (startTime, duration) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);
        
        if (now < start) return { label: 'Upcoming', color: 'badge-info' };
        if (now > end) return { label: 'Ended', color: 'badge-neutral' };
        return { label: 'Active', color: 'badge-success' };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            <Trophy className="text-warning" size={40} />
                            Contests
                        </h1>
                        <p className="text-base-content/70 mt-2">Compete, learn, and rank up on the leaderboard!</p>
                    </div>
                    {user?.role === 'admin' && (
                        <NavLink to="/admin" className="btn btn-primary">
                            Admin Panel
                        </NavLink>
                    )}
                </div>

                {error && <div className="alert alert-error mb-6">{error}</div>}

                <div className="grid gap-6">
                    {contests.length === 0 ? (
                        <div className="text-center py-20 bg-base-100 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-semibold text-base-content/50">No contests available right now.</h2>
                        </div>
                    ) : (
                        contests.map(contest => {
                            const status = getContestStatus(contest.startTime, contest.duration);
                            return (
                                <div key={contest._id} className="card bg-base-100 shadow-xl border-t-4 border-t-primary">
                                    <div className="card-body">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="card-title text-2xl mb-2">{contest.title}</h2>
                                                <p className="text-base-content/70 mb-4">{contest.description}</p>
                                                
                                                <div className="flex flex-wrap gap-4 text-sm font-medium">
                                                    <span className={`badge ${status.color} p-3 gap-2`}>
                                                        {status.label}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={16} className="text-info" />
                                                        {new Date(contest.startTime).toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={16} className="text-warning" />
                                                        {contest.duration} Minutes
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2 items-end">
                                                {user?.role === 'admin' && (
                                                    <button onClick={() => handleDelete(contest._id)} className="btn btn-ghost text-error btn-sm">
                                                        <Trash2 size={18} /> Delete
                                                    </button>
                                                )}
                                                
                                                {status.label === 'Ended' ? (
                                                    <NavLink to={`/contest/${contest._id}/leaderboard`} className="btn btn-outline btn-primary mt-2">
                                                        View Leaderboard
                                                    </NavLink>
                                                ) : (
                                                    <NavLink to={`/contest/${contest._id}`} className="btn btn-primary mt-2 w-32">
                                                        {status.label === 'Upcoming' ? 'View Details' : 'Enter Contest'}
                                                    </NavLink>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContestList;
