# H_ET Maintenance Intelligence

**An advanced AI-powered data analysis platform for H_ET maintenance data.**

This application provides strategic insights into maintenance operations for **CCTV, PABX, and Digital Radio** infrastructure using Google's **Gemini 3 Flash** model. It visualizes asset status, predicts battery replacements, and offers an interactive AI chatbot for deep data querying.

![Dashboard Preview](https://via.placeholder.com/800x400?text=H_ET+Maintenance+Intelligence+Dashboard)

## 🚀 Key Features

*   **📊 Dynamic Dashboard:** Visualizes asset distribution, battery health status (Critical/Warning/Normal), and monthly maintenance schedules using interactive charts.
*   **🧠 AI Strategic Analysis:** Uses **Gemini 3 Flash** to generate executive summaries, revenue insights, and actionable maintenance recommendations based on live sheet data.
*   **💬 Intelligent Chatbot:** Interactive AI assistant ("Maintenance AI Advisor") capable of querying the dataset, generating Markdown tables, and answering specific maintenance questions with context awareness.
*   **📅 Smart Data Processing:** Automatically processes raw Excel data from Google Sheets, handling Thai date formats, currency parsing, and data cleaning.
*   **📱 Modern UI/UX:** Built with Tailwind CSS for a responsive, clean, and professional interface.

## 🛠 Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **Data Visualization:** Recharts
*   **Data Processing:** SheetJS (xlsx)
*   **AI Integration:** Google GenAI SDK (`@google/genai`)
*   **Deployment:** Docker, Nginx, Vercel

## ⚙️ Setup & Installation

### Prerequisites

*   Node.js (v18 or higher)
*   Google AI Studio API Key (Get one [here](https://aistudio.google.com/app/apikey))

### Local Development

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd h-et-maintenance-intelligence
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your API Key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

## 🐳 Docker Deployment

The application uses a multi-stage Docker build served by Nginx.
**Important:** Since Vite is a build tool, the API Key needs to be embedded during the build process via `vite.config.ts`.

### 1. Build the Image
Pass your API Key as a build argument:
```bash
docker build --build-arg API_KEY=your_actual_api_key_here -t h-et-maintenance .
```

### 2. Run the Container
```bash
docker run -p 8080:80 h-et-maintenance
```
Access the app at `http://localhost:8080`.

## ☁️ Vercel Deployment

1.  Push the code to your Git repository (GitHub/GitLab/Bitbucket).
2.  Import the project into **Vercel**.
3.  In the **Environment Variables** section, add:
    *   **Key:** `API_KEY`
    *   **Value:** Your Google Gemini API Key
4.  Click **Deploy**. Vercel will automatically detect the Vite framework and build the project.

## 📂 Project Structure

```
├── src/
│   ├── components/    # UI Components (DataVisualizer, ChatBot, etc.)
│   ├── services/      # API Logic (Gemini integration, Sheet fetching)
│   ├── types/         # TypeScript Interfaces
│   ├── App.tsx        # Main Application Logic
│   └── main.tsx       # Entry Point
├── public/            # Static assets
├── Dockerfile         # Docker configuration
├── vite.config.ts     # Vite configuration
└── package.json       # Dependencies
```

---
*Powered by Google Gemini API*