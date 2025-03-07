import React, { useState, useEffect } from 'react';

const DynamicIsland = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const containerStyle = {
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '20px',
    width: isExpanded ? '260px' : '120px',
    height: isExpanded ? '80px' : '40px',
    transition: 'all 0.3s ease',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    cursor: 'pointer',
    padding: '4px 8px',
    boxSizing: 'border-box'
  };

  return (
    <div 
      style={containerStyle}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? (
        <div>
          <h3 style={{ margin: 0 }}>Dynamic Island</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Click to collapse</p>
        </div>
      ) : (
        <div style={{ fontSize: '14px' }}>•••</div>
      )}
    </div>
  );
};

export default DynamicIsland;