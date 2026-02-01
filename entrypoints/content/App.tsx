import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { storage } from '#imports';

import { createTRPCProxyClient } from '@trpc/client';
import { chromeLink } from 'trpc-chrome/link';
import type { AppRouter } from '../../src/trpc/_appTimer';

const port = chrome.runtime.connect();
// this proxy will be used for calling functions with querying or mutate
const chromeClient = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setRunning] = useState(false);

  const [isVisible, setVisibility] = useState(true);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [localDigits, setLocalDigits] = useState(['0', '0', '0', '0']);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const clockRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Function to set individual refs
  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    if (el) {
      inputRefs.current.set(index, el);
    } else {
      inputRefs.current.delete(index);
    }
  };

  useEffect(() => {
    const fetchTime = () => {
      chromeClient.getTime.query().then(setTime);
      chromeClient.isRunning.query().then(setRunning);
      chromeClient.isVisible.query().then(setVisibility);
    };
    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Derived state for displaying digits
  const displayedDigits = useMemo(() => {
    if (isEditingTime) {
      return localDigits;
    } else {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return [
        Math.floor(minutes / 10).toString(),
        (minutes % 10).toString(),
        Math.floor(seconds / 10).toString(),
        (seconds % 10).toString(),
      ];
    }
  }, [time, isEditingTime, localDigits]);

  //
  // Keyboard events
  //
  //
  const handleTimeInputBlur = () => {
    setIsEditingTime(false); // Set to false when done editing
    const newTimeStr = localDigits.join(''); // Use localDigits
    const minutes = parseInt(newTimeStr.slice(0, 2), 10);
    const seconds = parseInt(newTimeStr.slice(2, 4), 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      const totalSeconds = minutes * 60 + seconds + 1; // Add 1 second to compensate for alarm delay
      chromeClient.changeTime.mutate({ time: totalSeconds });
    }
    // After editing, reset localDigits to reflect the actual time, which will be updated by time state
    // This isn't strictly necessary as displayedDigits will switch to using 'time'
    // but ensures localDigits doesn't hold stale user input if they start editing again.
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    setLocalDigits([
      Math.floor(minutes / 10).toString(),
      (minutes % 10).toString(),
      Math.floor(seconds / 10).toString(),
      (seconds % 10).toString(),
    ]);
  };

  const handleDigitChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const val = e.target.value;
    if (!/^\d?$/.test(val)) return;

    const newDigits = [...localDigits];
    newDigits[index] = val;
    setLocalDigits(newDigits);

    if (val && index < 3) {
      inputRefs.current.get(index + 1)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !localDigits[index] && index > 0) {
      // Use localDigits
      inputRefs.current.get(index - 1)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pastedData.length === 4) {
      setLocalDigits(pastedData.split('')); // Use setLocalDigits
      inputRefs.current.get(3)?.focus();
    }
  };

  ///
  // Handles Dragging
  //
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).tagName === 'BUTTON' ||
      (e.target as HTMLElement).tagName === 'INPUT'
    ) {
      return;
    }
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - position.y,
        };
        setPosition(newPosition);
        storage.setItem('local:position', newPosition);
      }
    },
    [isDragging, position]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isVisible) return <></>;
  return (
    <div
      ref={clockRef}
      className={`floating-clock ${isDragging ? 'dragging' : ''}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="timer"
        onFocus={() => setIsEditingTime(true)}
        onBlur={handleTimeInputBlur}
      >
        <input
          ref={setInputRef(0)}
          className="digit-input"
          value={displayedDigits[0]}
          onChange={(e) => handleDigitChange(e, 0)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          onPaste={handlePaste}
          maxLength={1}
        />
        <input
          ref={setInputRef(1)}
          className="digit-input"
          value={displayedDigits[1]}
          onChange={(e) => handleDigitChange(e, 1)}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          maxLength={1}
        />
        <span className="separator">:</span>
        <input
          ref={setInputRef(2)}
          className="digit-input"
          value={displayedDigits[2]}
          onChange={(e) => handleDigitChange(e, 2)}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          maxLength={1}
        />
        <input
          ref={setInputRef(3)}
          className="digit-input"
          value={displayedDigits[3]}
          onChange={(e) => handleDigitChange(e, 3)}
          onKeyDown={(e) => handleKeyDown(e, 3)}
          maxLength={1}
        />
      </div>
      <div className="controls">
        <button onClick={() => chromeClient.switchTimer.mutate()}>
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button onClick={() => chromeClient.resetTime.mutate()}>Reset</button>
      </div>
    </div>
  );
}

export default App;
