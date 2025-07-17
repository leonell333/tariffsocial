import React from 'react';

const Spinner = ({ size = 20, className = '', style = {} }) => (
  <>
    <div
      className={`spinner ${className}`}
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, Math.round(size / 8))}px solid #eee`,
        borderTop: `${Math.max(2, Math.round(size / 8))}px solid #888`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        ...style,
      }}
    />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </>
);

export default Spinner;
