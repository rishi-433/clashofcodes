import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router';
import { Trophy, Clock, AlertCircle } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

function ContestDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetchContestDetails();
    }, [id]);

    useEffect(() => {
        if (!contest) return;
        
        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(contest.startTime);
            const end = new Date(start.getTime() + contest.duration * 60000);

            if (now < start) {
                setStatus('Upcoming');
                const diff = start - now;
                setTimeLeft(formatTime(diff));
            } else if (now >= start && now <= end) {
                if (status !== 'Active' && status !== '') {
                    // Refresh to fetch problems if contest just started
                    fetchContestDetails();
                }
                setStatus('Active');
                const diff = end - now;
                setTimeLeft(formatTime(diff));
            } else {
                setStatus('Ended');
                setTimeLeft('00:00:00');
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contest, status]);

    const fetchContestDetails = async () => {
        try {
            const { data } = await axiosClient.get(`/contest/${id}`);
            setContest(data);
        } catch (err) {
            setError('Failed to load contest details');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            await axiosClient.post(`/contest/${id}/register`);
            fetchContestDetails();
            alert("Registered successfully! Good luck!");
        } catch (err) {
            alert('Failed to register');
        }
    };

    const formatTime = (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner text-primary loading-lg"></span></div>;
    if (error) return <div className="text-center text-error mt-20 text-2xl">{error}</div>;

    return (
        <div className="min-h-screen bg-base-200 py-10 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Contest Header */}
                <div className="card bg-base-100 shadow-xl border-t-4 border-primary">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                    <Trophy className="text-warning" size={36} />
                                    {contest.title}
                                </h1>
                                <p className="text-base-content/70">{contest.description}</p>
                            </div>
                            
                            <div className="bg-base-200 p-4 rounded-xl text-center min-w-[200px]">
                                <p className="text-sm font-semibold uppercase opacity-70 mb-1">
                                    {status === 'Upcoming' ? 'Starts In' : status === 'Active' ? 'Ends In' : 'Status'}
                                </p>
                                <p className={`text-3xl font-mono font-bold ${status === 'Active' ? 'text-success' : status === 'Ended' ? 'text-error' : 'text-info'}`}>
                                    {status === 'Ended' ? 'ENDED' : timeLeft}
                                </p>
                            </div>
                        </div>

                        {status === 'Active' && (
                            <div className="alert alert-success mt-4">
                                <AlertCircle />
                                <span>The contest is live! Solve the problems below.</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-base-300">
                            <span className="font-medium opacity-70">
                                Host: {contest.hostId?.firstName} {contest.hostId?.lastName}
                            </span>
                            
                            <div className="flex gap-4">
                                {status === 'Active' && (
                                    <button onClick={handleRegister} className="btn btn-primary">
                                        Join / Register
                                    </button>
                                )}
                                <NavLink to={`/contest/${contest._id}/leaderboard`} className="btn btn-outline">
                                    Leaderboard
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Problems List */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-6">Contest Problems</h2>
                        
                        {status === 'Upcoming' ? (
                            <div className="text-center py-12">
                                <Clock size={48} className="mx-auto text-base-content/30 mb-4" />
                                <p className="text-xl text-base-content/50 font-medium">Problems will be revealed when the contest starts.</p>
                            </div>
                        ) : contest.problems?.length === 0 ? (
                            <p className="text-center opacity-50 py-10">No problems found for this contest.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr className="bg-base-200 text-base-content text-sm">
                                            <th>#</th>
                                            <th>Title</th>
                                            <th>Difficulty</th>
                                            <th className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contest.problems.map((prob, idx) => (
                                            <tr key={prob._id} className="hover">
                                                <td className="font-bold opacity-50">{idx + 1}</td>
                                                <td className="font-semibold text-lg">{prob.title}</td>
                                                <td>
                                                    <span className={`badge ${prob.difficulty === 'hard' ? 'badge-error' : prob.difficulty === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                                                        {prob.difficulty}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <NavLink 
                                                        to={`/problem/${prob._id}?contestId=${contest._id}`} 
                                                        className={`btn btn-sm ${status === 'Ended' ? 'btn-ghost' : 'btn-primary'}`}
                                                    >
                                                        Solve Problem
                                                    </NavLink>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ContestDashboard;
