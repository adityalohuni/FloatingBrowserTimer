import { storage } from '#imports';

const ALARM_NAME = 'floating-clock-timer';

type TimerState = {
  isRunning: boolean;
  currentTime: number;
  defaultTime: number;
  clockVisibleByScope: Record<string, boolean>;
  isSuspended: boolean;
};

type VisibilityScope = {
  site?: string;
};

async function getState(): Promise<TimerState> {
  const state = await storage.getItem<TimerState>('local:timerState');
  if (!state) {
    return {
      isRunning: false,
      currentTime: 100,
      defaultTime: 100,
      clockVisibleByScope: {},
      isSuspended: false,
    };
  }

  return {
    ...state,
    clockVisibleByScope: state.clockVisibleByScope ?? {},
    isSuspended: state.isSuspended ?? false,
  };
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
  if (state.isSuspended) return;
  if (!state.isRunning) {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 / 60 });
    await setState({ isRunning: true });
  }
}

export async function switchTimer() {
  const state = await getState();
  if (state.isSuspended) return;
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

const toSiteScope = (site: string) => `site:${site.toLowerCase()}`;

export const getVisibility = async (scope?: VisibilityScope) => {
  const state = await getState();

  if (scope?.site) {
    const siteVisible = state.clockVisibleByScope[toSiteScope(scope.site)];
    if (siteVisible !== undefined) return siteVisible;
  }

  return true;
};

export const setVisibility = async (val: boolean, scope?: VisibilityScope) => {
  const state = await getState();
  const nextVisibilityByScope = { ...state.clockVisibleByScope };

  if (scope?.site) {
    nextVisibilityByScope[toSiteScope(scope.site)] = val;
  }

  await setState({ clockVisibleByScope: nextVisibilityByScope });
};

export const isSuspended = async () => (await getState()).isSuspended;

export const setSuspended = async (val: boolean) => {
  if (val) {
    chrome.alarms.clear(ALARM_NAME);
    await setState({ isSuspended: true, isRunning: false });
    return;
  }

  await setState({ isSuspended: false });
};
