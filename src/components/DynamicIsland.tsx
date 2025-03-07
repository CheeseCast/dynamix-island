import { useState } from 'react'
import { useMediaPlayer } from '../hooks/useMediaPlayer'
import React from 'react';

const DynamicIsland = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentTrack, isPlaying, controls } = useMediaPlayer();

  return (
    <div 
      className="dynamic-island-container text-white"
      id="island"
      style={{
        width: isExpanded ? '350px' : 'fit-content',
        height: isExpanded ? '65px' : '35px',
        background: 'rgba(0, 0, 0, 0.95)',
        borderRadius: isExpanded ? '25px' : '20px',
        display: 'flex',
        alignItems: 'center',
        margin: 'auto',
        padding: isExpanded ? '12px 15px' : '0 10px',
        boxSizing: 'border-box',
        transition: 'width 0.3s ease-out, height 0.3s ease-out, border-radius 0.3s ease-out, padding 0.3s ease-out',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Minimal content shown by default */}
      <div 
        className="minimal-content w-full"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          transition: 'opacity 0.2s ease-out',
          opacity: isExpanded ? 0 : 1,
          pointerEvents: isExpanded ? 'none' : 'auto'
        }}
      >
        <div 
          className="minimal-art flex-shrink-0"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: currentTrack?.artUrl 
              ? `url(${currentTrack.artUrl}) center center / cover no-repeat` 
              : '#333',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginRight: '8px',
          }}
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center" style={{  width: 'max-content',}}>
          <div className="text-white text-[10px] leading-tight truncate font-medium">
            {currentTrack?.title || 'Not Playing'}
          </div>
        </div>
      </div>

      {/* Expanded content shown on hover */}
      <div 
        className="expanded-content"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', // Added this
          padding: '12px 15px',
          boxSizing: 'border-box',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
          pointerEvents: isExpanded ? 'auto' : 'none'
        }}
      >
        <div 
          id="album-art"
          className="flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            marginRight: '12px',
            background: currentTrack?.artUrl 
              ? `url(${currentTrack.artUrl}) center center / cover no-repeat` 
              : '#333',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        />
    <div id="info" className="flex-grow" style={{ width: 'max-content', }}>
      <p className="text-white text-sm font-medium m-0">
        {currentTrack?.title || 'Not Playing'}
      </p>
      <p className="text-white/70 text-xs m-0 mt-0.5">
        {currentTrack?.artist || 'Unknown Artist'}
      </p>
    </div>
        {/* Control buttons section */}
        <div className="flex gap-4" style={{display: "inline-flex"}}>
          <button 
            className="control-button text-white"
            onClick={() => controls.previous()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: 0.8,
              color: '#ffffff',
              filter: 'brightness(1)',
              WebkitTextStroke: '1px rgba(255, 255, 255, 0.1)' // This helps with icon sharpness
            }}
          >
            ⏮
          </button>
          <button 
            className="control-button text-white"
            onClick={() => controls.playPause()}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              color: '#000',
              padding: "0px 5px",
              marginLeft: '8px',
              marginRight: '8px',
              transform: 'translateY(0)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isPlaying ? '⏸' : '⏯'}
          </button>
          <button 
            className="control-button text-white"
            onClick={() => controls.next()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: 0.8,
              color: '#ffffff',
              filter: 'brightness(1)',
              WebkitTextStroke: '1px rgba(255, 255, 255, 0.1)'
            }}
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}

export default DynamicIsland;
