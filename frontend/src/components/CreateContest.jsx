import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

function CreateContest() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [problems, setProblems] = useState([]);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const { data } = await axiosClient.get('/problem/getAllProblem');
                setProblems(data);
            } catch (err) {
                console.error('Error fetching problems:', err);
                setError('Failed to load problems');
            }
        };
        fetchProblems();
    }, []);

    const toggleProblem = (problemId) => {
        setSelectedProblems(prev => 
            prev.includes(problemId) 
                ? prev.filter(id => id !== problemId)
                : [...prev, problemId]
        );
    };

    const onSubmit = async (data) => {
        if (selectedProblems.length === 0) {
            setError('Please select at least one problem for the contest');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await axiosClient.post('/contest/create', {
                ...data,
                problems: selectedProblems,
                duration: parseInt(data.duration)
            });
            navigate('/contests');
        } catch (err) {
            setError(err.response?.data || 'Failed to create contest');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl py-8">
            <h1 className="text-4xl font-bold mb-8">Create New Contest</h1>

            {error && (
                <div className="alert alert-error mb-6">
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="bg-base-100 shadow-xl rounded-xl p-8 space-y-6">
                
                <div className="form-control w-full">
                    <label className="label"><span className="label-text font-semibold">Contest Title</span></label>
                    <input 
                        type="text" 
                        {...register('title', { required: 'Title is required' })} 
                        className="input input-bordered w-full" 
                        placeholder="e.g. Weekly Coding Challenge #1" 
                    />
                    {errors.title && <span className="text-error text-sm mt-1">{errors.title.message}</span>}
                </div>

                <div className="form-control w-full">
                    <label className="label"><span className="label-text font-semibold">Description</span></label>
                    <textarea 
                        {...register('description', { required: 'Description is required' })} 
                        className="textarea textarea-bordered h-24" 
                        placeholder="Brief description of the contest..."
                    ></textarea>
                    {errors.description && <span className="text-error text-sm mt-1">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-semibold">Duration (Minutes)</span></label>
                        <input 
                            type="number" 
                            {...register('duration', { required: 'Duration is required', min: { value: 10, message: 'Minimum 10 minutes' } })} 
                            className="input input-bordered w-full" 
                            placeholder="120" 
                        />
                        {errors.duration && <span className="text-error text-sm mt-1">{errors.duration.message}</span>}
                    </div>

                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-semibold">Global Start Time</span></label>
                        <input 
                            type="datetime-local" 
                            {...register('startTime', { required: 'Start time is required' })} 
                            className="input input-bordered w-full" 
                        />
                        {errors.startTime && <span className="text-error text-sm mt-1">{errors.startTime.message}</span>}
                    </div>
                </div>

                <div className="divider">Select Problems</div>

                <div className="bg-base-200 p-4 rounded-lg max-h-96 overflow-y-auto">
                    {problems.length === 0 ? (
                        <p className="text-center text-base-content/60">No problems available.</p>
                    ) : (
                        <div className="space-y-2">
                            {problems.map((prob) => (
                                <label key={prob._id} className="label cursor-pointer justify-start gap-4 bg-base-100 p-3 rounded-lg hover:bg-base-300 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="checkbox checkbox-primary" 
                                        checked={selectedProblems.includes(prob._id)}
                                        onChange={() => toggleProblem(prob._id)}
                                    />
                                    <span className="label-text flex-1 font-medium">{prob.title}</span>
                                    <span className="badge badge-sm">{prob.difficulty || 'neutral'}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-sm text-base-content/60">{selectedProblems.length} problems selected</p>

                <div className="form-control mt-8">
                    <button type="submit" className="btn btn-primary w-full text-lg" disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : 'Create Contest'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateContest;
