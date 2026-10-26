# 🎓 AI CareerMate
### Smart Career Guidance, Internship & Skill Roadmap System

AI CareerMate is an AI-powered career intelligence platform designed for students. It analyzes student profiles, academic credentials, resumes, projects, and career interests to generate personalized career recommendations, deep skill-gap reports, internship matching, and a 4-phase structured learning roadmap.

---

## 🚀 Quick Start (Running the System)

The server is already running live in your workspace! You can open it immediately:

- **Web Application URL:** [http://localhost:3000](http://localhost:3000)

If you ever need to restart the server manually:
```powershell
# Using the built-in runtime:
agy-node server.mjs

# Or using standard Node.js (v18+):
node server.mjs
```

---

## 🧠 Python Algorithmic Engine Reference

If you or your faculty/evaluators want to inspect and execute the pure mathematical algorithms in Python:
```powershell
python ai_engine.py
```
*(Implements TF-IDF vector matching, Cosine similarity, Set-theoretic skill-gap extraction, and Topological DAG roadmap ordering)*.

---

## 📂 Project Structure

```
c:\MINI_PROJECT\
│
├── server.mjs                    # Production backend server (Zero external dependencies, SQLite, REST API)
├── career_mate.db                # SQLite database (Users, Profiles, Roles catalog, Curated Jobs)
├── ai_engine.py                  # Python reference implementation of all mathematical formulas
├── ALGORITHM_SPECIFICATION.md    # Exhaustive academic algorithm specification & formulas
├── README.md                     # Documentation & setup guide
│
└── public/                       # Front-end Single Page Application (SPA)
    ├── index.html                # Modern responsive UI with 7 dedicated tabs
    ├── styles.css                # Polished design system, KPI cards, gauges, timelines
    └── app.js                    # Client-side state manager and dynamic API connectors
```

---

## 🌟 Key Features & Problem Statement Coverage

| Feature | Description |
| :--- | :--- |
| **👤 Student Profile & Auth** | Manages Education, CGPA, Verified Skills, Projects, Certifications, and Target Role. |
| **📄 AI Resume Parser** | Paste raw resume text; the NLP engine automatically extracts verified skills, CGPA, degree, and syncs into profile. |
| **🎯 AI Career Recommendations** | Multi-factor composite scoring ranks industry roles with match percentages and rationale. |
| **🔍 Semantic Skill-Gap Diagnostic** | Set-theoretic comparison classifies skills into Existing, Critical Missing, and Good-to-have, with estimated weeks to bridge. |
| **💼 Internship & Job Matcher** | Real-time opportunity catalog filtered by domain, academic CGPA eligibility, and skill match scores. |
| **🗺️ 4-Phase Learning Roadmap** | Sequential timeline (Foundations -> Frameworks -> Cloud/Scale -> Capstone & Certifications) with verified links to free courses (Coursera, freeCodeCamp, MIT). |
| **📝 Custom JD Input & Scraping** | Paste ANY arbitrary job description from LinkedIn/Indeed to get instant match scores and a bridging sprint. |

---

## 📊 Evaluation Summary

- **Architecture:** Zero-dependency native Node.js (Node v24 with `node:sqlite`) + Python Algorithmic Reference
- **Database:** Embedded persistent SQLite with pre-seeded industry benchmarks
- **Formulas:** Multi-factor weighted composite scoring, TF-IDF cosine similarity, Kahn's DAG topological traversal.
