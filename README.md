# 🎮 NEXUS PRO: Master Control Online

A high-performance, tactical Chess Management & Tournament Operations Platform. Designed for professional tournament organizers and administrators who require a "Command Center" approach to chess event management.



## 🚀 Overview
**NEXUS PRO** is a full-stack chess platform built with a "Master Control" aesthetic (Prism Arctic theme). It provides deep administrative oversight, real-time tournament tracking, and advanced player orchestration through a glassmorphic, high-tech interface.

---

## 💎 Key Features

### 🏆 🛡️ Tactical Tournament System
*   **Live Command Hub**: Reactive dashboard for managing multiple simultaneous events.
*   **Dynamic Brackets**: Visual "Tournament Tree" representing player progression from Round of 16 to the Grand Final.
*   **Live Leaderboards**: Real-time standings with ELO tracking and performance visualization.
*   **Round Management**: Automated initialization of pairings and round-by-round status tracking.

### 🕹️ 👮 Master Control Panel
*   **Operator Registry**: Comprehensive management of "Tactical Operators" (Players).
*   **Global Broadcast**: One-click administrative communication to all active participants.
*   **Live Moderation**: Real-time game monitoring and administrative intervention (God Mode).
*   **2FA Security**: Military-grade Two-Factor Authentication for all high-clearance (Admin) accounts.

### 📊 📈 Intelligence & Analytics
*   **Threat Map**: Global heat-map of active users and security threats.
*   **Network Velocity**: Real-time monitoring of system usage and connection health.
*   **Audit Logging**: Comprehensive trace of every administrative action for security and accountability.

---

## 🛠️ Technical Stack

### **Frontend**
*   **Core**: React 19 (Vite)
*   **UI System**: Tailwind CSS + Shadcn UI (Custom Prism Arctic Theme)
*   **Animations**: Framer Motion for tactical micro-interactions
*   **State Management**: React Query & Context API
*   **Icons**: Lucide React

### **Backend**
*   **Runtime**: Node.js + Express
*   **Database**: MongoDB (Mongoose ODM)
*   **Real-time**: Socket.io for live bracket updates and global broadcasts
*   **Security**: JWT Authentication, Bcrypt, Helmet, and Rate Limiting
*   **Logging**: Winston + Custom Audit Logger

---

## 📥 Installation

1.  **Clone the Repository**
    ```bash
    git clone [repository-url]
    cd chess-master-control
    ```

2.  **Environment Setup**
    Create a `.env` file in the root:
    ```env
    PORT=5001
    MONGO_URI=[your-mongodb-uri]
    JWT_SECRET=[your-secret]
    NODE_ENV=development
    ```

3.  **Install Dependencies**
    ```bash
    npm install
    ```

4.  **Launch Platform**
    ```bash
    # Start both Frontend and Backend
    npm run dev
    
    # Start Backend only
    npm run server
    ```

---

## 🎯 Project Status
Currently in **Active Development (Phase 3)**. 
- [x] High-Tech UI Implementation
- [x] Tournament CRUD & Bracket Visualization
- [x] Admin Dashboard & 2FA Security
- [ ] ELO Rating Integration (Upcoming)
- [ ] Anti-Cheat Analysis (Upcoming)

---

**Developed for the next generation of professional chess coordination.**
*Confidentiality Notice: This project is part of the NEXUS PRO Master Control initiative.*
