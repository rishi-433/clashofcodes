import { useState, useRef, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';



const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {


  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isHovering, setIsHovering] = useState(false);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => console.log('Playback interrupted:', error));
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update current time during playback
  useEffect(() => {
    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      if (video) setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (video && video.duration) {
        setVideoDuration(video.duration);
      }
    };
    
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  if (!secureUrl) {
    return (
      <div className="text-center p-8 bg-base-200 rounded-xl text-base-content/70">
        No video solution available for this problem yet.
      </div>
    );
  }

  const isYouTube = secureUrl?.includes('youtube.com') || secureUrl?.includes('youtu.be');

  if (isYouTube) {
    let videoId = '';
    if (secureUrl.includes('youtube.com/watch?v=')) {
      videoId = secureUrl.split('v=')[1]?.split('&')[0];
    } else if (secureUrl.includes('youtu.be/')) {
      videoId = secureUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (secureUrl.includes('youtube.com/embed/')) {
      videoId = secureUrl.split('youtube.com/embed/')[1]?.split('?')[0];
    }
    
    return (
      <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg aspect-video">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={secureUrl}
        poster={thumbnailUrl}
        onClick={togglePlayPause}
        className="w-full aspect-video bg-black cursor-pointer"
      />
      
      {/* Video Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity ${
          isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="btn btn-circle btn-primary mr-3"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause/>
          ) : (
            <Play/>
          )}
        </button>
        
        {/* Progress Bar */}
        <div className="flex items-center w-full mt-2">
          <span className="text-white text-sm mr-2">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={videoDuration || 100}
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.currentTime = Number(e.target.value);
              }
            }}
            className="range range-primary range-xs flex-1"
          />
          <span className="text-white text-sm ml-2">
            {formatTime(videoDuration)}
          </span>
        </div>
      </div>
    </div>
  );
};


export default Editorial;