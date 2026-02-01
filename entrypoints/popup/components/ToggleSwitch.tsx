import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ isVisible, setVisibility }) => {
  const handleToggle = () => {
    setVisibility(!isVisible);
  };
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={isVisible} onChange={handleToggle} />
      <span className="slider"></span>
    </label>
  );
};

export default ToggleSwitch;
