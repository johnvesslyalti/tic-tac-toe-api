# ❌ Tic-Tac-Toe Multiplayer (Nakama + Next.js) ⭕

A modern, high-performance multiplayer Tic-Tac-Toe game featuring an authoritative backend, real-time matchmaking, and a sleek glassmorphic UI.

---

## 🏗️ Architecture & Design Decisions

This project follows a professional-grade multiplayer architecture designed for security, scalability, and fairness.

### 1. Authoritative Backend (Nakama)
Unlike "Client-Side" games where players tell the server what happened, this game uses **Authoritative Logic**. 
-   The server ([matchHandler.ts](src/modules/matchHandler.ts)) is the "Source of Truth."
-   It validates every move before updating the grid.
-   This prevents cheating and ensures both players see the exact same state.

### 2. Node.js Auth Proxy
We use a Node/Express server as a **Secure Gateway** between the Frontend and the Game Server.
-   **Purpose**: Protects the Nakama Server Key.
-   **Flow**: Frontend ➡ Node Proxy ➡ Nakama (S2S) ➡ Frontend.
-   This keeps administrative keys hidden from the public browser context.

### 3. Data Flow
-   **Authentication**: REST API through the Node Proxy.
-   **Real-time Play**: Persistent WebSockets directly to Nakama for sub-100ms latency.
-   **Persistence**: PostgreSQL for user accounts and long-term storage.

---

## 🚀 Setup & Installation

### Prerequisites
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-   [Node.js](https://nodejs.org/) (v18+)

### 1. Backend Setup
1.  Navigate to the `tic-tac-toe-api` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment:
    -   Create a `.env` file (see [Environment Configuration](#environment-configuration)).
4.  Build and Start the containers:
    ```bash
    npm run build
    docker-compose up -d
    ```

### 2. Frontend Setup
1.  Navigate to the `tic-tac-toe-client` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration Details

### Backend (.env)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `FRONTEND_URL` | URL of the React app | `http://localhost:3000` |
| `POSTGRES_PASSWORD` | Database password | `localdb` |
| `NAKAMA_SERVER_KEY` | Secret key for S2S auth | `defaultkey` |
| `PORT` | Node Proxy port | `5000` |

### Frontend (.env)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Node Proxy URL | `http://localhost:5000` |
| `NEXT_PUBLIC_NAKAMA_HOST` | Nakama Hostname | `localhost` |

---

## 🎮 How to Test Multiplayer

To test the game alone on your local machine:

1.  **Open two different browsers** (e.g., Chrome and Firefox) or one regular window and one Incognito window.
2.  **Register/Login**: Sign in with two different accounts.
3.  **Start a Game**:
    -   **Quick Match**: Click "Quick Match" on both sessions. Nakama will match you automatically.
    -   **Custom Room**: Create a room on one session, go to "Browse Rooms" on the other, and join. Or share the Match ID.
4.  **Observe**: Watch the real-time updates as you play between the two windows.

---

## 🛠️ Deployment Process

1.  **Orchestration**: For production, move from `docker-compose` to **Kubernetes** using the Nakama Helm charts.
2.  **Database**: Migrate from a local container to a managed service like **AWS RDS** or **Google Cloud SQL**.
3.  **SSL**: Use a Load Balancer (Nginx/Traefik) to terminate SSL and handle `wss://` (WebSocket Secure) connections.
4.  **Optimization**: Run `npm run build` in the client to generate the optimized production bundle.

---

## 📝 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
