import React, { useRef, useState } from "react";
import "./App.css";
import ToggleSwitch from "./components/ToggleSwitch";

import { createTRPCProxyClient } from "@trpc/client";
import { chromeLink } from "trpc-chrome/link";
import type { AppRouter } from "../../src/trpc/_appTimer.ts";

const port = chrome.runtime.connect();
// this proxy will be used for calling functions with querying or mutate
const chromeClient = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })],
});

const App = () => {
  const [isVisible, setVisibility] = useState(true);
  useEffect(() => {
    const visiblityInterval = setInterval(
      () => chromeClient.isVisible.query().then(setVisibility),
      1000,
    );
    return () => clearInterval(visiblityInterval);
  });

  useEffect(() => {
    chromeClient.setVisibility.mutate({ isVisible });
  }, [isVisible]);
  return (
    <div className="app">
      <header className="app-header">
        <h1>Floating Clock</h1>
        <p>Control the visibility of the floating clock on your screen.</p>
      </header>
      <main className="app-main">
        <ToggleSwitch isVisible={isVisible} setVisibility={setVisibility} />
      </main>
    </div>
  );
};

export default App;
