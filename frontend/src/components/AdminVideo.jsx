import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';

const AdminVideo = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadType, setUploadType] = useState('link'); // 'link' or 'file'
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const selectedFile = watch('videoFile')?.[0];

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove the video from this problem?')) return;
    try {
      await axiosClient.delete(`/video/delete/${id}`);
      alert('Video removed successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to remove video.');
    }
  };

  const onSubmit = async (data) => {
    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      let secureUrl = data.videoLink;
      let cloudinaryPublicId = null;
      let duration = 0;

      if (uploadType === 'file') {
        const file = data.videoFile[0];
        
        // Backend now handles finding the problem by title
        const signatureResponse = await axiosClient.post(`/video/create-signature`, { title: data.title.trim() });
        const { signature, timestamp, public_id, api_key, upload_url } = signatureResponse.data;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp);
        formData.append('public_id', public_id);
        formData.append('api_key', api_key);

        const uploadResponse = await axios.post(upload_url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        });

        const cloudinaryResult = uploadResponse.data;
        secureUrl = cloudinaryResult.secure_url;
        cloudinaryPublicId = cloudinaryResult.public_id;
        duration = cloudinaryResult.duration;
      }

      await axiosClient.post('/video/save', {
        title: data.title.trim(),
        uploadType,
        cloudinaryPublicId,
        secureUrl,
        duration,
      });

      setMessage({ type: 'success', text: 'Video added successfully!' });
      reset();
      fetchProblems(); // Refresh the list
    } catch (err) {
      const errorData = err.response?.data;
      const errorText = typeof errorData === 'string' ? errorData : errorData?.message || err.message || 'Upload failed. Please try again.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Upload Form Section */}
      <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Add Video to Problem</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Problem Title</span></label>
              <input
                type="text"
                placeholder="Enter problem title"
                {...register('title', { required: 'Problem title is required' })}
                className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                disabled={uploading}
              />
              {errors.title && <span className="label-text-alt text-error mt-1">{errors.title.message}</span>}
            </div>

            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold">Video Source</span></label>
              <div className="flex space-x-4">
                <label className="label cursor-pointer space-x-2">
                  <input type="radio" name="uploadType" className="radio radio-primary" checked={uploadType === 'link'} onChange={() => setUploadType('link')} disabled={uploading} />
                  <span className="label-text">External Link</span>
                </label>
                <label className="label cursor-pointer space-x-2">
                  <input type="radio" name="uploadType" className="radio radio-primary" checked={uploadType === 'file'} onChange={() => setUploadType('file')} disabled={uploading} />
                  <span className="label-text">Upload File</span>
                </label>
              </div>
            </div>

            {uploadType === 'link' ? (
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Video URL</span></label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  {...register('videoLink', { required: uploadType === 'link' ? 'Video link is required' : false })}
                  className={`input input-bordered w-full ${errors.videoLink ? 'input-error' : ''}`}
                  disabled={uploading}
                />
                {errors.videoLink && <span className="label-text-alt text-error mt-1">{errors.videoLink.message}</span>}
              </div>
            ) : (
              <div className="form-control w-full">
                <label className="label"><span className="label-text font-semibold">Choose video file</span></label>
                <input
                  type="file"
                  accept="video/*"
                  {...register('videoFile', { required: uploadType === 'file' ? 'Please select a video file' : false })}
                  className={`file-input file-input-bordered w-full ${errors.videoFile ? 'file-input-error' : ''}`}
                  disabled={uploading}
                />
                {errors.videoFile && <span className="label-text-alt text-error mt-1">{errors.videoFile.message}</span>}
                {selectedFile && <div className="text-sm mt-2 text-base-content/70">Selected: {selectedFile.name}</div>}
              </div>
            )}

            {uploading && uploadType === 'file' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <progress className="progress progress-primary w-full" value={uploadProgress} max="100"></progress>
              </div>
            )}

            {message.text && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mt-4`}>
                <span>{message.text}</span>
              </div>
            )}

            <div className="card-actions justify-end mt-6">
              <button type="submit" disabled={uploading} className={`btn btn-primary ${uploading ? 'loading' : ''}`}>
                {uploading ? 'Processing...' : 'Submit Video'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="divider">Existing Problems</div>

      {/* Problems Table Section */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-4/12">Title</th>
              <th className="w-2/12">Difficulty</th>
              <th className="w-3/12">Tags</th>
              <th className="w-2/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4"><span className="loading loading-spinner"></span></td></tr>
            ) : problems.map((problem, index) => (
              <tr key={problem._id}>
                <th>{index + 1}</th>
                <td>{problem.title}</td>
                <td>
                  <span className={`badge ${problem.difficulty === 'Easy' ? 'badge-success' : problem.difficulty === 'Medium' ? 'badge-warning' : 'badge-error'}`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td><span className="badge badge-outline">{problem.tags}</span></td>
                <td>
                  <div className="flex items-center space-x-2">
                    {problem.videoLink ? (
                      <button onClick={() => handleDelete(problem._id)} className="btn btn-sm btn-error">
                        Delete Video
                      </button>
                    ) : (
                      <span className="text-sm text-base-content/60 italic">No video available</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminVideo;