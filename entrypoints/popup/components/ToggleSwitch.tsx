import React, { useState, useEffect } from "react";
import "./ToggleSwitch.css";
import { storage } from "#imports";

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
