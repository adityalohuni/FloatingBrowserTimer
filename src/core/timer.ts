var defaultTime = 100;
var currentTime = 0;

let timeInterval: any | null = null;
let clockVisible: boolean = true;

export function runTimer() {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  timeInterval = setInterval(async () => {
    if (currentTime <= 0) {
      currentTime = defaultTime;
    } else {
      currentTime -= 1;
    }
  }, 1000);
}

export function switchTimer() {
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  } else runTimer();
}

export async function setTime(timeVal: number) {
  await storage.setItem("local:time", timeVal);
  currentTime = timeVal;
  defaultTime = timeVal;
}

export const isRunning = () => !!timeInterval;

export const resetClock = () => (currentTime = defaultTime);

export const getTime = () => currentTime;

export const getVisibility = () => clockVisible;
export const setVisibility = (val: boolean) => (clockVisible = val);
