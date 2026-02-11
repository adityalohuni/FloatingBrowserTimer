import React, { useEffect, useState } from 'react';
import './App.css';
import {
  Box,
  Button,
  Flex,
  Heading,
  TextField,
  Separator,
  Switch,
  Text,
  Theme,
} from '@radix-ui/themes';

import { createTRPCProxyClient } from '@trpc/client';
import { chromeLink } from 'trpc-chrome/link';
import type { AppRouter } from '../../src/trpc/_appTimer.ts';

const port = chrome.runtime.connect();
// this proxy will be used for calling functions with querying or mutate
const chromeClient = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

type ActiveTabScope = {
  site?: string;
};

const App = () => {
  const [isVisible, setVisibility] = useState(true);
  const [scope, setScope] = useState<ActiveTabScope>({});
  const [isSuspended, setSuspended] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [customSeconds, setCustomSeconds] = useState('00');
  const [customError, setCustomError] = useState<string | null>(null);

  const getActiveTabScope = async (): Promise<ActiveTabScope> => {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    let site: string | undefined;
    if (activeTab?.url) {
      try {
        site = new URL(activeTab.url).hostname;
      } catch {
        site = undefined;
      }
    }

    return { site };
  };

  useEffect(() => {
    const fetchVisibility = async () => {
      const activeScope = await getActiveTabScope();
      setScope(activeScope);
      const visible = await chromeClient.isVisible.query(activeScope);
      setVisibility(visible);
      const suspended = await chromeClient.isSuspended.query();
      setSuspended(suspended);
    };

    fetchVisibility();
    const visiblityInterval = setInterval(fetchVisibility, 1000);
    return () => clearInterval(visiblityInterval);
  }, []);

  const handleToggle = async (nextVisible: boolean) => {
    setVisibility(nextVisible);
    await chromeClient.setVisibility.mutate({
      isVisible: nextVisible,
      site: scope.site,
    });
  };

  const handleSuspendToggle = async (nextSuspended: boolean) => {
    setSuspended(nextSuspended);
    await chromeClient.setSuspended.mutate({ isSuspended: nextSuspended });
  };

  const handleCustomTime = async () => {
    const minutes = parseInt(customMinutes || '0', 10);
    const seconds = parseInt(customSeconds || '0', 10);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
      setCustomError('Enter valid numbers.');
      return;
    }
    if (minutes < 0 || seconds < 0 || seconds > 59) {
      setCustomError('Use minutes >= 0 and seconds 0-59.');
      return;
    }
    const totalSeconds = Math.min(minutes * 60 + seconds, 5999);
    setCustomError(null);
    await chromeClient.changeTime.mutate({ time: totalSeconds });
  };

  return (
    <Theme appearance="light" accentColor="blue" grayColor="slate">
      <Flex className="app" direction="column" gap="4">
        <Box className="popup-surface">
          <Flex direction="column" gap="4">
            <Box>
              <Heading size="4">Floating Clock</Heading>
              <Text size="1" color="gray" className="hint">
                Control visibility, sleep mode, and custom time.
              </Text>
            </Box>

            <Separator size="4" />

            <Flex direction="column" gap="2" className="section">
              <Box>
                <Text size="2" weight="medium" className="section-title">
                  Custom time
                </Text>
                <Text size="1" color="gray" className="hint">
                  Sets default time and resets to it
                </Text>
              </Box>
              <Flex gap="2" className="time-row">
                <TextField.Root
                  size="2"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="MM"
                  aria-label="Minutes"
                  className="time-input"
                />
                <Text size="2" color="gray">
                  :
                </Text>
                <TextField.Root
                  size="2"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  placeholder="SS"
                  aria-label="Seconds"
                  className="time-input"
                />
                <Button
                  size="2"
                  variant="soft"
                  onClick={handleCustomTime}
                  className="set-button"
                >
                  Set
                </Button>
              </Flex>
              {customError ? (
                <Text size="1" color="red">
                  {customError}
                </Text>
              ) : null}
            </Flex>

            <Separator size="4" />

            <Flex direction="column" gap="3">
              <Flex justify="between" className="switch-row">
                <Box>
                  <Text size="2" weight="medium" className="section-title">
                    Visible on this site
                  </Text>
                  <Text size="1" color="gray" className="hint">
                    Applies to{' '}
                    <span className="site-pill">
                      {scope.site ?? 'this page'}
                    </span>
                  </Text>
                </Box>
                <Switch
                  checked={isVisible}
                  onCheckedChange={handleToggle}
                  disabled={isSuspended}
                />
              </Flex>

              <Flex justify="between" className="switch-row">
                <Box>
                  <Text size="2" weight="medium" className="section-title">
                    Sleep mode
                  </Text>
                  <Text size="1" color="gray" className="hint">
                    Stops timers and hides the clock everywhere
                  </Text>
                </Box>
                <Switch
                  checked={isSuspended}
                  onCheckedChange={handleSuspendToggle}
                />
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Theme>
  );
};

export default App;
