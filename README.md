# Niswarth AI

**AI-assisted NGO workflow and impact reporting platform**

Niswarth AI is a frontend product prototype designed for NGOs, foundations, and social-impact teams. It demonstrates how volunteer coordination, campaign tracking, field updates, and AI-assisted impact reporting can work together in a workflow-focused platform.

The word **Niswarth** means **selfless**, reflecting the spirit of people who devote themselves to social impact work.

## Live Deployment

[Niswarth AI Live Project](https://niswarth-ai.vercel.app/)

---

## Project Overview

Many NGOs manage their work through scattered WhatsApp messages, spreadsheets, paper notes, and manual reports. This often makes it difficult to track volunteers, collect field updates, coordinate events, and prepare clear impact summaries.

Niswarth AI explores a cleaner workflow where NGOs can:

- Coordinate volunteers
- Manage campaigns
- Track field updates
- View campaign-level metrics
- Generate AI-assisted impact report drafts
- Keep humans in control before publishing or sharing reports

This project was developed as part of a web development internship task focused on AI-powered website generation, user experience thinking, and practical product structure.

---

## Key Features

### Multi-page Website Structure

The project includes the following pages:

- Home
- Workflow Dashboard
- Use Cases
- About
- Contact

### Interactive Workflow Dashboard

The dashboard demonstrates how an NGO campaign workflow could be managed.

It includes:

- Campaign selector
- Campaign overview
- Volunteer details
- Field updates
- Workflow metrics
- Workflow quality indicators
- AI impact report draft area
- Human review and approval status

### Backend-Connected Campaign Workflow

The dashboard connects with Supabase for campaign, field update, and report records. It also keeps a local fallback path so the interface remains viewable if environment variables are not configured.

The workflow supports:

- Creating campaign records
- Adding field updates to selected campaigns
- Saving AI-assisted report drafts
- Marking reports as human-reviewed
- Refreshing backend records from the dashboard

### Campaign Types

The dashboard includes realistic campaign types:

- Education Drive
- Animal Welfare Drive
- Environment Drive

Each campaign has its own field updates, volunteers, events, and reporting context.

### AI-Assisted Impact Report Draft

The project includes a simulated AI report generation flow.

Users can generate an impact report draft based on selected campaign updates. The AI output is positioned as human-reviewed, not automatically final.

> AI-generated drafts may contain inaccuracies. Human review is required before sharing.

### Gemini 2.5 Flash Report Generation

The report workflow now uses a Vercel serverless function to request report drafts from Gemini 2.5 Flash. The API key is kept server-side through the `GEMINI_API_KEY` environment variable and is not exposed to the browser.

If the AI request fails or the server-side key is not configured, the interface falls back to a local structured draft generator and clearly tells the user to review the fallback draft carefully.

### Use Cases Page

The Use Cases page explains how the platform can support different types of social-impact work, including:

- Education drives
- Animal welfare campaigns
- Environment and plantation drives

### Contact Workflow Form

The contact page includes a workflow-focused form for NGOs and foundations.

Fields include:

- Name
- NGO/Foundation name
- City
- Number of volunteers
- Campaign type
- Message

---

## Tech Stack

- React
- Vite
- Tailwind CSS
- Supabase
- React Router
- Lucide React
- JavaScript
- HTML
- CSS
- Supabase
- Vercel Serverless Functions
- Gemini 2.5 Flash API

---

## Project Architecture

```text
niswarth-ai/
├── api/
│   └── generate-report.js
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   ├── common/
│   │   ├── landing/
│   │   ├── forms/
│   │   └── dashboard/
│   ├── data/
│   ├── database/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Dhruvg334/niswarth-ai.git
```

### 2. Go inside the project folder

```bash
cd niswarth-ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the local preview

Vite will show a local URL similar to:

```text
http://localhost:5173
```

Open it in your browser.

### Environment Variables

Create a `.env.local` file for local Supabase access:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

For deployed AI generation, add this variable in Vercel Project Settings → Environment Variables:

```env
GEMINI_API_KEY=your_gemini_api_key
```

`GEMINI_API_KEY` must not be prefixed with `VITE_` because it is a server-side secret used only by the Vercel API function.

---

## Build Commands

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## What This Project Demonstrates

This project demonstrates:

- AI-assisted website ideation
- Product-oriented website planning
- React component-based structure
- Multi-page frontend routing
- Responsive UI design
- Dashboard-style interface design
- Supabase-backed data workflow
- Service-layer based backend access
- Simulated AI workflow
- Human-in-the-loop product thinking
- Reliability, observation, and workflow quality metrics
- NGO-focused user experience design
- Clean frontend project documentation

---

## Responsible AI Positioning

Niswarth AI does not present AI-generated content as automatically final.

The product concept follows a human-reviewed approach:

1. Field updates are collected.
2. AI assists in drafting an impact summary.
3. A human reviews the draft.
4. The final report is approved before sharing.

This keeps the workflow practical, safer, and more appropriate for NGO communication.

---

## Current Scope

The current version is a frontend product prototype.

It includes:

- Static frontend pages
- Interactive dashboard UI
- Campaign switching
- Gemini-backed AI report generation with local fallback
- Human review UI
- Responsive design

It does not currently include:

- Real backend
- User authentication
- Database storage
- Real AI API integration
- Live email or CRM submission

These are planned for future versions.

---

## Future Improvements

### Stage 3: Functional AI Workflow App

Planned improvements:

- Add Supabase or Firebase backend
- Store real campaigns, volunteers, and field updates
- Add form submission persistence
- Add editable campaign data
- Save generated reports
- Add real dashboard metrics
- Add authentication for NGO admins
- Add AI generation logs and evaluation metrics
- Add report editing before approval

### Stage 4: Advanced Agentic AI System

Possible long-term improvements:

- Campaign planning assistant
- Volunteer coordination assistant
- Field update summarization agent
- Report generation agent
- Risk and missing-data flagging
- Multi-agent workflow orchestration
- Role-based access control
- Audit logs for AI-assisted decisions
- PDF report export
- WhatsApp or email workflow integration

---

## Learning Outcomes

Through this project, I practiced:

- Moving from a static website idea to a structured product prototype
- Designing around a real user workflow
- Creating reusable React components
- Using mock data to simulate product behavior
- Building an interactive dashboard experience
- Thinking about responsible AI in social-impact contexts

---

## Project Status

**Current version:** Frontend product prototype  
**Next planned step:** Backend persistence and real AI workflow integration

---

## Author

**Dhruv Gupta**

GitHub: [Dhruvg334](https://github.com/Dhruvg334)
