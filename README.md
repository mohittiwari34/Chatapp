# ChatAPPY - Advanced Real-Time Chat & Video Application

A modern, high-performance real-time communication platform built with the MERN stack (MongoDB, Express, React, Node.js) and WebRTC. Experience seamless video calls and instant messaging in a beautifully designed interface.

![Project Screenshot](/img/screenshot.png) <!-- meaningful placeholder if you add screenshots later -->

## 🚀 Features

### Core Functionality
-   **Real-Time Messaging**: Instant text communication powered by Socket.io.
-   **High-Quality Video Calls**: Peer-to-peer video conferencing using WebRTC.
-   **Seamless Mode Switching**: Switch between dedicated "Chat Mode" and "Video Mode" effortlessly.
-   **Room-Based Architecture**: Join specific rooms to chat with groups or individuals.

### Advanced UI/UX
-   **Premium Glassmorphism Design**: A sleek, dark-themed interface with translucent elements and blur effects.
-   **Responsive Layout**: Fully optimized for desktop and mobile devices, featuring a collapsible sidebar.
-   **Smooth Animations**: Polished entry animations and interactive hover states.
-   **Custom Theming**: Professional color palette inspired by leading platforms like Discord and Zoom.

### Key Capabilities
-   **Audio Controls**: Mute/Unmute microphone functionality during calls.
-   **Smart Notifications**: Synthesized sound effects for messages and calls using Web Audio API (No external assets required).
-   **Auto-Reconnect**: Robust connection handling for uninterrupted sessions.
-   **Cross-Platform**: Works on all modern web browsers.

## 🛠️ Tech Stack

-   **Frontend**: React.js, Parcel (Bundler), CSS3 (Custom Properties)
-   **Backend**: Node.js, Express.js
-   **Real-Time Communication**: Socket.io (Signaling & Chat), WebRTC (Video/Audio)
-   **Styling**: Pure CSS with CSS Variables for theming

## 📦 Installation

### Prerequisites
-   Node.js (v14 or higher) installed on your machine.
-   npm (Node Package Manager)

### Setup Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/chatapp.git
    cd chatapp
    ```

2.  **Install Root Dependencies**
    (This installs `concurrently` to run both servers with one command)
    ```bash
    npm install
    ```

3.  **Install Server Dependencies**
    ```bash
    cd server
    npm install
    cd ..
    ```

4.  **Install Client Dependencies**
    ```bash
    cd client
    npm install
    cd ..
    ```

## 🚀 Running the Application

To start both the **Client** and **Server** simultaneously:

```bash
npm start
```

This command will launch:
-   **Frontend**: `http://localhost:1234`
-   **Backend**: `http://localhost:2000`

### Running Individually

-   **Server Only**:
    ```bash
    npm run server
    ```

-   **Client Only**:
    ```bash
    npm run client
    ```

## 📖 Usage Guide

1.  **Join a Room**: Enter your name and a Room ID on the landing page.
2.  **Main Lobby**: See online users in the sidebar. Click on a user to interact.
    -   **💬 Chat Icon**: Open a private text chat.
    -   **📹 Video Icon**: Start a video call instantly.
3.  **In-Call Controls**:
    -   Toggle Microphone (Mute/Unmute)
    -   Open Sidebar Chat during a call
    -   End Call to return to the lobby

## 🌐 Deployment

For detailed deployment instructions (Render + Vercel), see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📄 License

This project is open-source and available under the ISC License.
