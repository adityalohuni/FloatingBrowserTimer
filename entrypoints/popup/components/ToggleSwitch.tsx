import React, { useState, useEffect } from "react";
import "./ToggleSwitch.css";
import { storage } from "#imports";

const ToggleSwitch = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load the initial state from storage
    storage.getItem("local:clock-enabled").then((value) => {
      setIsEnabled(!!value);
    });
  }, []);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    storage.setItem("local:clock-enabled", newState);
  };

  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={isEnabled} onChange={handleToggle} />
      <span className="slider"></span>
    </label>
  );
};

export default ToggleSwitch;
