# Floating Clock - Productivity Timer

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-%233986E5.svg?style=for-the-badge&logo=trpc&logoColor=white)
![Framework](https://img.shields.io/badge/Framework-wxt-8746ff.svg?style=for-the-badge)

A simple, elegant, and draggable floating clock to boost your productivity. This web extension provides a persistent timer that is always on screen, helping you stay focused and manage your time effectively across all your browser tabs.

## How It Enhances Productivity

In a browser with countless tabs and distractions, it's easy to lose track of time. The Floating Clock acts as a universal productivity timer that follows you wherever you go.

Instead of being tied to a single tab, the clock's state is synchronized globally across your browser. Set a timer for a task, and it will remain visible and counting down whether you're reading documentation, checking email, or browsing articles. This is perfect for time-management techniques like:

- **Time-boxing**: Allocate a specific amount of time for a task and stick to it.
- **The Pomodoro Technique**: Work in focused 25-minute intervals with short breaks.
- **General Focus**: Keep a constant, non-intrusive reminder of the time you have left to stay on task.

## Features

- **Draggable Interface**: Move the clock anywhere on the screen.
- **Editable Timer**: Click on the digits to set your desired countdown time.
- **Simple Controls**: Easily Start, Stop, and Reset the timer.
- **Global State**: The timer's state is persistent and synchronized across all your tabs.

## Demo

## TODO: Add the ss here

_(A screenshot or GIF of the clock in action would go here)_

![Floating Clock Demo](https://i.imgur.com/someRandomGifInPlace.gif)

## Getting Started

Follow these instructions to build and run the extension locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [pnpm](https://pnpm.io/installation) (You can install it with `npm install -g pnpm`)

### Installation and Building

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Build the extension for production:**
    ```bash
    pnpm build
    ```
    This command compiles the extension and places the output in the `.output/chrome-mv3` directory.

## Loading the Extension

To use the extension in your browser:

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle switch in the top-right corner.
3.  Click on the **"Load unpacked"** button.
4.  Select the `.output/chrome-mv3` directory from the project folder.

The Floating Clock icon should now appear in your browser's toolbar, and the clock will be visible on any new page you visit.

## Technologies Used

- **Framework**: [WXT](https://wxt.dev/)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API/RPC**: [tRPC](https://trpc.io/)
