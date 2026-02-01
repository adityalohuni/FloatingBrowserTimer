import { storage } from 'wxt/storage';

const ALARM_NAME = 'floating-clock-timer';

type TimerState = {
  isRunning: boolean;
  currentTime: number;
  defaultTime: number;
  clockVisible: boolean;
};

async function getState(): Promise<TimerState> {
  const state = await storage.getItem<TimerState>('local:timerState');
  return (
    state ?? {
      isRunning: false,
      currentTime: 100,
      defaultTime: 100,
      clockVisible: true,
    }
  );
}

async function setState(newState: Partial<TimerState>) {
  const oldState = await getState();
  await storage.setItem('local:timerState', { ...oldState, ...newState });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const { currentTime, defaultTime } = await getState();
    if (currentTime <= 0) {
      await setState({ currentTime: defaultTime });
    } else {
      await setState({ currentTime: currentTime - 1 });
    }
  }
});

export async function runTimer() {
  const state = await getState();
  if (!state.isRunning) {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 });
    await setState({ isRunning: true });
  }
}

export async function switchTimer() {
  const state = await getState();
  if (state.isRunning) {
    chrome.alarms.clear(ALARM_NAME);
    await setState({ isRunning: false });
  } else {
    runTimer();
  }
}

export async function setTime(timeVal: number) {
  await setState({
    currentTime: timeVal,
    defaultTime: timeVal,
  });
}

export const isRunning = async () => (await getState()).isRunning;

export const resetClock = async () =>
  await setState({ currentTime: (await getState()).defaultTime });

export const getTime = async () => (await getState()).currentTime;

export const getVisibility = async () => (await getState()).clockVisible;
export const setVisibility = async (val: boolean) =>
  await setState({ clockVisible: val });
