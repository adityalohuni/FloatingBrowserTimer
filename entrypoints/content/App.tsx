import './App.css';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { storage } from '#imports';

import { createTRPCProxyClient } from '@trpc/client';
import { chromeLink } from 'trpc-chrome/link';
import type { AppRouter } from '../../src/trpc/_appTimer';

const port = chrome.runtime.connect();
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
  const [localTime, setLocalTime] = useState(['0', '0', '0', '0']);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const clockRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadPosition = async () => {
      const savedPosition = await storage.getItem('local:position');
      if (savedPosition) {
        setPosition(savedPosition);
      }
    };
    loadPosition();
  }, []);

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

  const timeToDigits = useCallback((timeInSeconds: number): string[] => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return [
      Math.floor(minutes / 10).toString(),
      (minutes % 10).toString(),
      Math.floor(seconds / 10).toString(),
      (seconds % 10).toString(),
    ];
  }, []);

  const digitsToTime = useCallback((digits: string[]): number => {
    const minutes =
      parseInt(digits[0] || '0') * 10 + parseInt(digits[1] || '0');
    const seconds =
      parseInt(digits[2] || '0') * 10 + parseInt(digits[3] || '0');
    return Math.min(minutes * 60 + seconds, 5999); // Max 99:59
  }, []);

  const displayedDigits = useMemo(() => {
    if (isEditingTime) {
      return localTime;
    }
    return timeToDigits(time);
  }, [time, isEditingTime, localTime, timeToDigits]);

  useEffect(() => {
    if (!isEditingTime) {
      setLocalTime(timeToDigits(time));
    }
  }, [time, isEditingTime, timeToDigits]);

  const handleDigitChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    // allow single digits
    if (value.length > 1) {
      e.target.value = value.slice(-1);
      return;
    }

    let maxValue = 9;
    if (index === 0) maxValue = 9;
    if (index === 2) maxValue = 5;

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > maxValue) {
      return;
    }

    const newDigits = [...localTime];
    newDigits[index] = value;
    setLocalTime(newDigits);

    if (value !== '' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && e.currentTarget.value === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocalTime(timeToDigits(time));
      setIsEditingTime(false);
      e.currentTarget.blur();
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (!isEditingTime) {
      setIsEditingTime(true);
    }
  };

  const handleTimeInputBlur = () => {
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }

    editTimeoutRef.current = setTimeout(() => {
      const activeElement = document.activeElement;
      const isStillEditing = inputRefs.current.some(
        (ref) => ref === activeElement
      );

      if (!isStillEditing) {
        const newTime = digitsToTime(localTime);
        chromeClient.changeTime.mutate({ time: newTime });
        setIsEditingTime(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, []);

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
          y: e.clientY - dragStartPos.current.y,
        };
        setPosition(newPosition);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      storage.setItem('local:position', position);
    }
  }, [isDragging, position]);

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

  const handleToggleTimer = useCallback(() => {
    chromeClient.switchTimer.mutate();
  }, []);

  const handleResetTimer = useCallback(() => {
    chromeClient.resetTime.mutate();
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={clockRef}
      className={`floating-clock ${isDragging ? 'dragging' : ''}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="timer">
        {displayedDigits.map((digit, index) => (
          <React.Fragment key={index}>
            {index === 2 && <span className="separator">:</span>}
            <input
              ref={(el) => (inputRefs.current[index] = el)}
              className="digit-input"
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleDigitChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={handleInputFocus}
              onBlur={handleTimeInputBlur}
              maxLength={1}
              aria-label={`${index < 2 ? 'Minutes' : 'Seconds'} digit ${(index % 2) + 1}`}
            />
          </React.Fragment>
        ))}
      </div>
      <div className="controls">
        <button
          onClick={handleToggleTimer}
          aria-label={isRunning ? 'Stop timer' : 'Start timer'}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button onClick={handleResetTimer} aria-label="Reset timer">
          Reset
        </button>
      </div>
    </div>
  );
}

export default App;
