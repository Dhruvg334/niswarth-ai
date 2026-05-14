# Niswarth AI

**AI-assisted NGO workflow and impact reporting platform**

Niswarth AI is a frontend product prototype designed for NGOs, foundations, and social-impact teams. It demonstrates how volunteer coordination, campaign tracking, field updates, and AI-assisted impact reporting can work together in a workflow-focused platform.

The word **Niswarth** means **selfless**, reflecting the spirit of people who devote themselves to social impact work.

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
- AI impact report draft area
- Human review and approval status

### Campaign-Based Demo Data

The dashboard includes realistic campaign types:

- Education Drive
- Animal Welfare Drive
- Environment Drive

Each campaign has its own field updates, volunteers, events, and reporting context.

### AI-Assisted Impact Report Draft

The project includes a simulated AI report generation flow.

Users can generate an impact report draft based on selected campaign updates. The AI output is positioned as human-reviewed, not automatically final.

> AI-generated drafts may contain inaccuracies. Human review is required before sharing.

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
- React Router
- Lucide React
- JavaScript
- HTML
- CSS

---

## Project Architecture

```text
niswarth-ai/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   ├── common/
│   │   ├── landing/
│   │   └── dashboard/
│   ├── data/
│   ├── pages/
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
git clone https://github.com/your-username/niswarth-ai.git
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
- Mock data-driven rendering
- Simulated AI workflow
- Human-in-the-loop product thinking
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
- Simulated AI report generation
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
- Integrate a real AI API for report generation
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

**Version:** Stage 2 frontend prototype 
**Next planned step:** Backend and real AI workflow integration

---

## Author

**Dhruv Gupta**

GitHub: [Dhruvg334](https://github.com/Dhruvg334)
