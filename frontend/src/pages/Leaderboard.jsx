import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { io } from 'socket.io-client';

function Leaderboard() {
    const { id } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await axiosClient.get(`/contest/${id}/leaderboard`);
                setLeaderboard(data);
            } catch (err) {
                setError('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
        
        const socket = io('https://clashofcodes-backend-6fwg.onrender.com', {
            withCredentials: true
        });
        
        socket.on('connect', () => {
            socket.emit('joinContest', id);
        });
        
        socket.on('leaderboardUpdate', (data) => {
            if (data.contestId === id) {
                fetchLeaderboard();
            }
        });
        
        return () => socket.disconnect();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner text-primary loading-lg"></span></div>;

    return (
        <div className="min-h-screen bg-base-200 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="flex items-center gap-4 mb-8">
                    <NavLink to={`/contest/${id}`} className="btn btn-circle btn-ghost">
                        <ArrowLeft size={24} />
                    </NavLink>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Trophy className="text-warning" size={32} />
                            Contest Leaderboard
                        </h1>
                        <p className="text-base-content/60 mt-1">Live ranking based on score and time penalty</p>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card bg-base-100 shadow-xl overflow-hidden">
                    {leaderboard.length === 0 ? (
                        <div className="p-10 text-center opacity-50">
                            <h2 className="text-xl font-semibold">No participants yet</h2>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full text-base">
                                <thead className="bg-base-200 text-base-content text-lg">
                                    <tr>
                                        <th className="w-20 text-center">Rank</th>
                                        <th>Participant</th>
                                        <th className="text-center">Score</th>
                                        <th className="text-right">Penalty Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((participant, index) => (
                                        <tr key={participant.userId?._id || index} className="hover">
                                            <td className="text-center font-bold">
                                                {index === 0 ? <Medal className="inline text-warning" size={24} /> :
                                                 index === 1 ? <Medal className="inline text-base-content/50" size={24} /> :
                                                 index === 2 ? <Medal className="inline text-orange-400" size={24} /> :
                                                 <span className="opacity-50">{index + 1}</span>}
                                            </td>
                                            <td className="font-semibold text-lg">
                                                {participant.userId?.firstName} {participant.userId?.lastName}
                                            </td>
                                            <td className="text-center text-success font-bold text-xl">
                                                {participant.score}
                                            </td>
                                            <td className="text-right font-mono text-error">
                                                {participant.penaltyTime} min
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
    );
}

export default Leaderboard;
