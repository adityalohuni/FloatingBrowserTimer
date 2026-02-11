import './App.css';
import '@radix-ui/themes/styles.css';

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
import { Box, Button, Flex, Theme } from '@radix-ui/themes';

const port = chrome.runtime.connect();
const chromeClient = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

const isPosition = (value: unknown): value is { x: number; y: number } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybePosition = value as { x?: unknown; y?: unknown };
  return (
    typeof maybePosition.x === 'number' && typeof maybePosition.y === 'number'
  );
};

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setRunning] = useState(false);
  const [isVisible, setVisibility] = useState(true);
  const [isSuspended, setSuspended] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const clockRef = useRef<HTMLDivElement>(null);
  const site = window.location.hostname;

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

  const displayedDigits = useMemo(
    () => timeToDigits(time),
    [time, timeToDigits]
  );

  useEffect(() => {
    const loadPosition = async () => {
      const savedPosition = await storage.getItem('local:position');
      if (isPosition(savedPosition)) {
        setPosition(savedPosition);
      }
    };
    loadPosition();
  }, []);

  useEffect(() => {
    const fetchTime = () => {
      chromeClient.getTime.query().then(setTime);
      chromeClient.isRunning.query().then(setRunning);
      chromeClient.isVisible.query({ site }).then(setVisibility);
      chromeClient.isSuspended.query().then(setSuspended);
    };
    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, [site]);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
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

  if (isSuspended || !isVisible) return null;

  return (
    <Theme appearance="dark" accentColor="blue" grayColor="mauve">
      <Box
        ref={clockRef}
        className={`floating-clock ${isDragging ? 'dragging' : ''}`}
        style={{ left: position.x, top: position.y }}
        onPointerDown={handlePointerDown}
      >
        <Flex direction="column" align="center" gap="3">
          <div className="timer">
            {displayedDigits.map((digit, index) => (
              <React.Fragment key={index}>
                {index === 2 && <span className="separator">:</span>}
                <div
                  className="digit-input"
                  aria-label={`${index < 2 ? 'Minutes' : 'Seconds'} digit ${(index % 2) + 1}`}
                >
                  {digit}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="controls">
            <Button
              size="1"
              variant={isRunning ? 'solid' : 'soft'}
              onClick={handleToggleTimer}
              aria-label={isRunning ? 'Stop timer' : 'Start timer'}
            >
              {isRunning ? 'Stop' : 'Start'}
            </Button>
            <Button
              size="1"
              variant="soft"
              onClick={handleResetTimer}
              aria-label="Reset timer"
            >
              Reset
            </Button>
          </div>
        </Flex>
      </Box>
    </Theme>
  );
}

export default App;
