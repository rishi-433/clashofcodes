import React, { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { Trash2, ShieldAlert } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await axiosClient.get('/user/admin/users');
            setUsers(data);
        } catch (err) {
            console.error('Fetch users error:', err);
            setError(`Failed to fetch users: ${err.response?.data || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axiosClient.patch(`/user/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(user => 
                user._id === userId ? { ...user, role: newRole } : user
            ));
        } catch (err) {
            alert('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await axiosClient.delete(`/user/admin/users/${userId}`);
            setUsers(users.filter(user => user._id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
                        <ShieldAlert className="text-primary" size={32} />
                        Manage Users
                    </h1>
                    <p className="text-base-content/70 mt-2">View, modify roles, or delete users from the platform.</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-6">
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-base-100 rounded-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        {/* head */}
                        <thead>
                            <tr className="bg-base-200 text-base-content">
                                <th>Name</th>
                                <th>Email</th>
                                <th>ID</th>
                                <th>Role</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className="hover">
                                    <td className="font-semibold">{user.firstName}</td>
                                    <td>{user.emailId}</td>
                                    <td className="text-sm font-mono opacity-50">{user._id}</td>
                                    <td>
                                        <select 
                                            className="select select-bordered select-sm w-full max-w-xs"
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="host">Host</option>
                                            <option value="starhost">Starhost</option>
                                        </select>
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            onClick={() => handleDeleteUser(user._id)}
                                            className="btn btn-ghost btn-sm text-error hover:bg-error/20"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-base-content/50">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
