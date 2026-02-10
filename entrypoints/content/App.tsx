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
  const positionRef = useRef(position);
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

  const clampPosition = useCallback((pos: { x: number; y: number }) => {
    const rect = clockRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);
    return {
      x: Math.min(Math.max(pos.x, 0), maxX),
      y: Math.min(Math.max(pos.y, 0), maxY),
    };
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

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!clockRef.current) return;
    const clamped = clampPosition(position);
    if (clamped.x !== position.x || clamped.y !== position.y) {
      setPosition(clamped);
    }
  }, [position, clampPosition]);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (
      (e.target as HTMLElement).tagName === 'BUTTON' ||
      (e.target as HTMLElement).tagName === 'INPUT'
    ) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const newPosition = clampPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
      setPosition(newPosition);
    },
    [isDragging, clampPosition]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      const clamped = clampPosition(positionRef.current);
      setPosition(clamped);
      storage.setItem('local:position', clamped);
      clockRef.current?.releasePointerCapture?.(e.pointerId);
    },
    [isDragging, clampPosition]
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    } else {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const clamped = clampPosition(prev);
        if (clamped.x === prev.x && clamped.y === prev.y) {
          return prev;
        }
        storage.setItem('local:position', clamped);
        return clamped;
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

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
      onPointerDown={handlePointerDown}
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
