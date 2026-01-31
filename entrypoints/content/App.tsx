import "./App.css";

import React, { useState, useEffect, useRef } from "react";
import { storage } from "#imports";

import { createTRPCProxyClient } from "@trpc/client";
import { chromeLink } from "trpc-chrome/link";
// TODO: change it later for seprate trcp file
import type { AppRouter } from "../background";

const port = chrome.runtime.connect();
// this proxy will be used for calling functions with querying or mutate
const chromeClient = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setRunning] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [digits, setDigits] = useState(["0", "0", "0", "0"]);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const clockRef = useRef<HTMLDivElement>(null);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    const fetchTime = () => {
      chromeClient.getTime.query().then(setTime);
      chromeClient.isRunning.query().then(setRunning);
    };
    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync digits with time
  useEffect(() => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const newDigits = [
      Math.floor(minutes / 10).toString(),
      (minutes % 10).toString(),
      Math.floor(seconds / 10).toString(),
      (seconds % 10).toString(),
    ];
    setDigits(newDigits);
  }, [time]);

  //
  // Keyboard events
  //
  //
  const handleTimeInputBlur = () => {
    setIsEditingTime(true);
    const newTimeStr = digits.join("");
    const minutes = parseInt(newTimeStr.slice(0, 2), 10);
    const seconds = parseInt(newTimeStr.slice(2, 4), 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      const totalSeconds = minutes * 60 + seconds;
      chromeClient.changeTime.mutate({ time: totalSeconds });
    }
  };

  const handleDigitChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const val = e.target.value;
    if (!/^\d?$/.test(val)) return;

    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (pastedData.length === 4) {
      setDigits(pastedData.split(""));
      inputRefs[3].current?.focus();
    }
  };

  ///
  // Handles Dragging
  //
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "INPUT"
    ) {
      return;
    }
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      };
      setPosition(newPosition);
      storage.setItem("local:position", newPosition);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={clockRef}
      className={`floating-clock ${isDragging ? "dragging" : ""}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="timer"
        onFocus={() => setIsEditingTime(true)}
        onBlur={handleTimeInputBlur}
      >
        <input
          ref={inputRefs[0]}
          className="digit-input"
          value={digits[0]}
          onChange={(e) => handleDigitChange(e, 0)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          onPaste={handlePaste}
          maxLength={1}
        />
        <input
          ref={inputRefs[1]}
          className="digit-input"
          value={digits[1]}
          onChange={(e) => handleDigitChange(e, 1)}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          maxLength={1}
        />
        <span className="separator">:</span>
        <input
          ref={inputRefs[2]}
          className="digit-input"
          value={digits[2]}
          onChange={(e) => handleDigitChange(e, 2)}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          maxLength={1}
        />
        <input
          ref={inputRefs[3]}
          className="digit-input"
          value={digits[3]}
          onChange={(e) => handleDigitChange(e, 3)}
          onKeyDown={(e) => handleKeyDown(e, 3)}
          maxLength={1}
        />
      </div>
      <div className="controls">
        <button onClick={() => chromeClient.startStopTime.mutate()}>
          {isRunning ? "Stop" : "Start"}
        </button>
        <button onClick={() => chromeClient.resetTime.mutate()}>Reset</button>
      </div>
    </div>
  );
}

export default App;
