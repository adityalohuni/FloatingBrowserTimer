import React, { useRef, useState } from "react";
import "./App.css";
import ToggleSwitch from "./components/ToggleSwitch";

import { createTRPCProxyClient } from "@trpc/client";
import { chromeLink } from "trpc-chrome/link";

const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Floating Clock</h1>
        <p>Control the visibility of the floating clock on your screen.</p>
      </header>
      <main className="app-main">
        <ToggleSwitch />
      </main>
    </div>
  );
};

export default App;
