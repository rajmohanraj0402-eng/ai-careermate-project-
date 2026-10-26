import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const PORT = process.env.PORT || 3000;
const DB_PATH = path.resolve('career_mate.db');
const PUBLIC_DIR = path.resolve('public');

// ==========================================
// 1. DATABASE INITIALIZATION & SEEDING
// ==========================================
const db = new DatabaseSync(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    education TEXT,
    skills TEXT,
    projects TEXT,
    certifications TEXT,
    interests TEXT,
    target_role TEXT,
    resume_text TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS roles_catalog (
    id TEXT PRIMARY KEY,
    role_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    description TEXT NOT NULL,
    core_skills TEXT NOT NULL,
    secondary_skills TEXT NOT NULL,
    avg_salary TEXT,
    outlook TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    domain TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    optional_skills TEXT NOT NULL,
    min_cgpa REAL DEFAULT 6.0,
    description TEXT NOT NULL,
    apply_url TEXT,
    is_custom INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Standard Canonical Skill Taxonomy & Aliases
const SKILL_TAXONOMY = {
  // Programming Languages
  "python": ["python", "python3", "py"],
  "javascript": ["javascript", "js", "ecmascript"],
  "typescript": ["typescript", "ts"],
  "java": ["java", "core java", "j2ee"],
  "c++": ["c++", "cpp"],
  "c": ["c language", "ansi c"],
  "go": ["golang", "go"],
  "rust": ["rust"],
  "sql": ["sql", "structured query language", "tsql", "plsql"],
  "html": ["html", "html5"],
  "css": ["css", "css3"],

  // AI & Machine Learning
  "machine learning": ["machine learning", "ml", "statistical learning"],
  "deep learning": ["deep learning", "neural networks", "dl", "ann", "cnn", "rnn"],
  "nlp": ["nlp", "natural language processing", "llm", "transformers", "text mining"],
  "computer vision": ["computer vision", "cv", "opencv", "image processing"],
  "pytorch": ["pytorch", "torch"],
  "tensorflow": ["tensorflow", "tf", "keras"],
  "scikit-learn": ["scikit-learn", "sklearn"],
  "pandas": ["pandas"],
  "numpy": ["numpy"],
  "data analysis": ["data analysis", "exploratory data analysis", "eda"],

  // Web & Backend
  "react": ["react", "react.js", "reactjs"],
  "node.js": ["node.js", "nodejs", "node"],
  "express": ["express", "express.js", "expressjs"],
  "next.js": ["next.js", "nextjs"],
  "vue": ["vue", "vue.js", "vuejs"],
  "angular": ["angular", "angularjs"],
  "rest api": ["rest api", "restful api", "rest apis", "restful web services"],
  "graphql": ["graphql"],
  "django": ["django"],
  "fastapi": ["fastapi"],
  "flask": ["flask"],
  "spring boot": ["spring boot", "springboot", "spring framework"],

  // Database & Storage
  "postgresql": ["postgresql", "postgres"],
  "mysql": ["mysql"],
  "mongodb": ["mongodb", "mongo"],
  "redis": ["redis"],
  "sqlite": ["sqlite", "sqlite3"],

  // Cloud & DevOps
  "docker": ["docker", "containerization"],
  "kubernetes": ["kubernetes", "k8s"],
  "aws": ["aws", "amazon web services", "ec2", "s3", "lambda"],
  "azure": ["azure", "microsoft azure"],
  "gcp": ["gcp", "google cloud platform"],
  "git": ["git", "github", "version control", "gitlab"],
  "ci/cd": ["ci/cd", "continuous integration", "github actions", "jenkins"],
  "linux": ["linux", "bash", "shell scripting", "unix"],

  // Cybersecurity
  "network security": ["network security", "tcp/ip", "firewalls"],
  "cryptography": ["cryptography", "encryption", "rsa", "aes"],
  "ethical hacking": ["ethical hacking", "penetration testing", "pentesting"],
  "wireshark": ["wireshark", "packet analysis"],

  // Core CS Concepts
  "data structures": ["data structures", "dsa", "algorithms", "problem solving"],
  "system design": ["system design", "distributed systems", "microservices"],
  "oop": ["object oriented programming", "oop", "oops"]
};

// Seed Roles Catalog
const seedRoles = [
  {
    id: "role-ai-ml",
    role_name: "AI / Machine Learning Engineer",
    domain: "Artificial Intelligence",
    description: "Designs, trains, and deploys predictive machine learning and deep learning models to production systems.",
    core_skills: JSON.stringify(["python", "machine learning", "deep learning", "pytorch", "scikit-learn", "numpy", "pandas", "data structures"]),
    secondary_skills: JSON.stringify(["tensorflow", "nlp", "computer vision", "docker", "fastapi", "git", "sql"]),
    avg_salary: "$95,000 - $145,000",
    outlook: "Extremely High Growth (+38% through 2030)"
  },
  {
    id: "role-fullstack",
    role_name: "Full Stack Web Developer",
    domain: "Software Development",
    description: "Architects and maintains responsive client-side interfaces and robust server-side APIs and database schemas.",
    core_skills: JSON.stringify(["javascript", "typescript", "react", "node.js", "html", "css", "rest api", "sql", "git"]),
    secondary_skills: JSON.stringify(["express", "mongodb", "next.js", "docker", "postgresql", "tailwind css", "ci/cd"]),
    avg_salary: "$85,000 - $130,000",
    outlook: "High Steady Demand (+25% through 2030)"
  },
  {
    id: "role-data-scientist",
    role_name: "Data Scientist & Analytics Specialist",
    domain: "Data & Analytics",
    description: "Extracts actionable statistical insights, builds predictive data models, and communicates findings via dashboards.",
    core_skills: JSON.stringify(["python", "sql", "pandas", "numpy", "data analysis", "machine learning", "scikit-learn"]),
    secondary_skills: JSON.stringify(["data structures", "deep learning", "tableau", "power bi", "git", "docker"]),
    avg_salary: "$90,000 - $135,000",
    outlook: "Rapid Growth (+31% through 2030)"
  },
  {
    id: "role-cloud-devops",
    role_name: "Cloud & DevOps Engineer",
    domain: "Cloud & Infrastructure",
    description: "Automates continuous integration/continuous deployment pipelines, manages cloud infrastructure, and ensures uptime.",
    core_skills: JSON.stringify(["linux", "docker", "kubernetes", "aws", "git", "ci/cd", "python", "bash"]),
    secondary_skills: JSON.stringify(["terraform", "azure", "gcp", "prometheus", "system design", "network security"]),
    avg_salary: "$92,000 - $140,000",
    outlook: "Very High Demand (+28% through 2030)"
  },
  {
    id: "role-cybersecurity",
    role_name: "Cybersecurity Analyst & Security Engineer",
    domain: "Cybersecurity",
    description: "Monitors systems for intrusions, assesses vulnerabilities, implements zero-trust security policies, and audits compliance.",
    core_skills: JSON.stringify(["network security", "linux", "cryptography", "wireshark", "ethical hacking", "python"]),
    secondary_skills: JSON.stringify(["git", "sql", "siem", "firewalls", "owasp", "incident response"]),
    avg_salary: "$88,000 - $132,000",
    outlook: "Critical Industry Need (+33% through 2030)"
  },
  {
    id: "role-backend-eng",
    role_name: "Backend Systems Engineer",
    domain: "Software Development",
    description: "Constructs scalable microservices, low-latency database queries, caching layers, and high-concurrency server architectures.",
    core_skills: JSON.stringify(["node.js", "python", "sql", "postgresql", "rest api", "system design", "data structures", "git"]),
    secondary_skills: JSON.stringify(["redis", "docker", "fastapi", "spring boot", "graphql", "kubernetes", "linux"]),
    avg_salary: "$90,000 - $138,000",
    outlook: "Consistent Core Demand (+22% through 2030)"
  }
];

const checkRoles = db.prepare('SELECT COUNT(*) as count FROM roles_catalog').get();
if (checkRoles.count === 0) {
  const insertRole = db.prepare(`
    INSERT INTO roles_catalog (id, role_name, domain, description, core_skills, secondary_skills, avg_salary, outlook)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of seedRoles) {
    insertRole.run(r.id, r.role_name, r.domain, r.description, r.core_skills, r.secondary_skills, r.avg_salary, r.outlook);
  }
}

// Seed Jobs & Internships
const seedJobs = [
  {
    id: "job-01",
    title: "AI Research & ML Intern",
    company: "Synthetix AI Labs",
    location: "Bengaluru / Remote",
    type: "Internship (6 Months)",
    domain: "Artificial Intelligence",
    required_skills: JSON.stringify(["python", "machine learning", "pytorch", "numpy", "pandas"]),
    optional_skills: JSON.stringify(["deep learning", "nlp", "git", "docker"]),
    min_cgpa: 7.5,
    description: "Work with research scientists to fine-tune transformer models, implement evaluation benchmarks, and optimize inference latency.",
    apply_url: "https://careers.example.com/synthetix-ai-intern"
  },
  {
    id: "job-02",
    title: "Full Stack Engineering Intern",
    company: "Nexus Cloud Systems",
    location: "Hyderabad / Hybrid",
    type: "Internship (3-6 Months)",
    domain: "Software Development",
    required_skills: JSON.stringify(["react", "javascript", "node.js", "html", "css", "rest api"]),
    optional_skills: JSON.stringify(["typescript", "postgresql", "docker", "git"]),
    min_cgpa: 7.0,
    description: "Build customer-facing dashboards, connect RESTful API microservices, and collaborate with agile frontend/backend pods.",
    apply_url: "https://careers.example.com/nexus-fullstack-intern"
  },
  {
    id: "job-03",
    title: "Junior Data Analyst / Scientist",
    company: "QuantMetrics Financial",
    location: "Mumbai / On-site",
    type: "Full-Time (Graduate / Entry)",
    domain: "Data & Analytics",
    required_skills: JSON.stringify(["python", "sql", "pandas", "data analysis", "scikit-learn"]),
    optional_skills: JSON.stringify(["machine learning", "data structures", "git"]),
    min_cgpa: 7.0,
    description: "Analyze large-scale transactional datasets, engineer features, create executive BI reports, and train predictive classifiers.",
    apply_url: "https://careers.example.com/quantmetrics-analyst"
  },
  {
    id: "job-04",
    title: "Cloud Infrastructure & DevOps Intern",
    company: "AetherScale Technologies",
    location: "Pune / Remote",
    type: "Internship (6 Months)",
    domain: "Cloud & Infrastructure",
    required_skills: JSON.stringify(["linux", "docker", "aws", "git", "python"]),
    optional_skills: JSON.stringify(["kubernetes", "ci/cd", "bash", "network security"]),
    min_cgpa: 6.8,
    description: "Deploy and monitor microservices across AWS EKS clusters, build automated GitHub Actions workflows, and enforce security policies.",
    apply_url: "https://careers.example.com/aetherscale-devops"
  },
  {
    id: "job-05",
    title: "Cybersecurity Analyst Trainee",
    company: "Fortress Defense InfoSec",
    location: "Chennai / Hybrid",
    type: "Internship & Trainee",
    domain: "Cybersecurity",
    required_skills: JSON.stringify(["network security", "linux", "wireshark", "ethical hacking"]),
    optional_skills: JSON.stringify(["python", "cryptography", "git"]),
    min_cgpa: 7.0,
    description: "Conduct network vulnerability scans, analyze SIEM threat alerts, draft security audit reports, and test defenses.",
    apply_url: "https://careers.example.com/fortress-cyber-trainee"
  },
  {
    id: "job-06",
    title: "Backend Platform Engineer",
    company: "HyperPay Fintech",
    location: "Bengaluru / Hybrid",
    type: "Full-Time (Entry Level)",
    domain: "Software Development",
    required_skills: JSON.stringify(["node.js", "sql", "postgresql", "rest api", "data structures"]),
    optional_skills: JSON.stringify(["redis", "docker", "system design", "git"]),
    min_cgpa: 7.2,
    description: "Develop resilient banking payment microservices handling high throughput with strict ACID transaction guarantees.",
    apply_url: "https://careers.example.com/hyperpay-backend"
  }
];

const checkJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
if (checkJobs.count === 0) {
  const insertJob = db.prepare(`
    INSERT INTO jobs (id, title, company, location, type, domain, required_skills, optional_skills, min_cgpa, description, apply_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const j of seedJobs) {
    insertJob.run(j.id, j.title, j.company, j.location, j.type, j.domain, j.required_skills, j.optional_skills, j.min_cgpa, j.description, j.apply_url);
  }
}

// Pre-seed Demo User for Instant Testing
const demoUserId = "demo-student-001";
const checkDemo = db.prepare('SELECT id FROM users WHERE id = ?').get(demoUserId);
if (!checkDemo) {
  const hash = crypto.createHash('sha256').update('password123').digest('hex');
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
    demoUserId,
    "Aarav Sharma",
    "aarav.sharma@example.edu",
    hash
  );

  const demoProfile = {
    education: {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "National Institute of Technology",
      cgpa: 8.4,
      gradYear: 2026,
      currentYear: "Final Year"
    },
    skills: [
      { name: "python", level: "Advanced", score: 0.9 },
      { name: "machine learning", level: "Intermediate", score: 0.75 },
      { name: "numpy", level: "Advanced", score: 0.85 },
      { name: "pandas", level: "Advanced", score: 0.85 },
      { name: "scikit-learn", level: "Intermediate", score: 0.7 },
      { name: "sql", level: "Intermediate", score: 0.65 },
      { name: "git", level: "Intermediate", score: 0.7 },
      { name: "data structures", level: "Intermediate", score: 0.75 },
      { name: "html", level: "Intermediate", score: 0.6 },
      { name: "css", level: "Beginner", score: 0.5 }
    ],
    projects: [
      {
        title: "Predictive Crop Disease Detection System",
        tech: ["python", "machine learning", "scikit-learn", "pandas", "opencv"],
        description: "Implemented a supervised computer vision classifier to detect leaf disease with 92% accuracy across 5,000 agricultural images."
      },
      {
        title: "E-Commerce Customer Churn Prediction Engine",
        tech: ["python", "pandas", "scikit-learn", "sql"],
        description: "Built end-to-end churn prediction pipeline evaluating user purchase frequency and telemetry with Random Forest."
      }
    ],
    certifications: [
      {
        title: "Supervised Machine Learning: Regression and Classification",
        issuer: "DeepLearning.AI / Coursera",
        year: 2025
      },
      {
        title: "Python for Data Science and Machine Learning Bootcamp",
        issuer: "Udemy",
        year: 2024
      }
    ],
    interests: ["Artificial Intelligence", "Data & Analytics", "Deep Learning Research"],
    target_role: "role-ai-ml",
    resume_text: "Aarav Sharma | B.Tech CSE Final Year (CGPA: 8.4). Skills: Python, Machine Learning, Pandas, NumPy, Scikit-Learn, SQL, Git, Data Structures. Projects: Crop Disease Detection, Customer Churn Model. Certifications: DeepLearning.AI ML Specialization. Passionate about AI Engineering and Deep Learning models."
  };

  db.prepare(`
    INSERT INTO profiles (user_id, education, skills, projects, certifications, interests, target_role, resume_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    JSON.stringify(demoProfile.education),
    JSON.stringify(demoProfile.skills),
    JSON.stringify(demoProfile.projects),
    JSON.stringify(demoProfile.certifications),
    JSON.stringify(demoProfile.interests),
    demoProfile.target_role,
    demoProfile.resume_text
  );
}

// ==========================================
// 2. AI CORE ALGORITHMIC ENGINE
// ==========================================

// Skill Extraction Engine (Regex & Taxonomy Boundary Matching)
function extractSkillsFromText(text) {
  if (!text) return [];
  const normalized = " " + text.toLowerCase().replace(/[^a-z0-9#+.]/g, " ") + " ";
  const detected = new Set();

  for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
    for (const alias of aliases) {
      // Escape for regex boundary
      const safeAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9#+.])${safeAlias}([^a-z0-9#+.]|$)`, 'i');
      if (regex.test(normalized)) {
        detected.add(canonical);
        break;
      }
    }
  }
  return Array.from(detected);
}

// TF-IDF & Vector Space Engine
function computeTFIDFVector(tokens, vocabulary, idfMap) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const vector = {};
  let norm = 0;
  for (const word of Object.keys(vocabulary)) {
    const termFreq = (tf[word] || 0) / (tokens.length || 1);
    const idf = idfMap[word] || 1.0;
    const val = termFreq * idf;
    vector[word] = val;
    norm += val * val;
  }
  return { vector, magnitude: Math.sqrt(norm) };
}

function cosineSimilarity(v1, mag1, v2, mag2) {
  if (mag1 === 0 || mag2 === 0) return 0;
  let dotProduct = 0;
  for (const k in v1) {
    if (v2[k]) {
      dotProduct += v1[k] * v2[k];
    }
  }
  return dotProduct / (mag1 * mag2);
}

// Curated Resource & Roadmap Database for Missing Skills
const ROADMAP_KNOWLEDGE_BASE = {
  "pytorch": {
    category: "Deep Learning Framework",
    difficulty: "Advanced",
    weeks: 3,
    resources: [
      { name: "Deep Learning with PyTorch: Zero to GANs (freeCodeCamp)", type: "Video Course", url: "https://www.youtube.com/watch?v=GIsg-ZUy0MY" },
      { name: "Official PyTorch 60-Minute Blitz Tutorials", type: "Interactive Docs", url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html" }
    ],
    project: "Build and fine-tune a Convolutional Neural Network (ResNet) on CIFAR-10 image dataset",
    certification: "DeepLearning.AI Deep Learning Specialization (Coursera)"
  },
  "deep learning": {
    category: "Core AI",
    difficulty: "Advanced",
    weeks: 4,
    resources: [
      { name: "MIT 6.S191: Introduction to Deep Learning", type: "University Course", url: "http://introtodeeplearning.com/" },
      { name: "Deep Learning Specialization by Andrew Ng", type: "Coursera", url: "https://www.coursera.org/specializations/deep-learning" }
    ],
    project: "End-to-End Sentiment Classifier with LSTM / Transformer attention heads",
    certification: "TensorFlow Developer Certificate / NVIDIA DLI Certification"
  },
  "docker": {
    category: "Containerization & DevOps",
    difficulty: "Intermediate",
    weeks: 2,
    resources: [
      { name: "Docker for Beginners - Hands-on DevOps (freeCodeCamp)", type: "Course", url: "https://www.youtube.com/watch?v=fqMOX6JJhGo" },
      { name: "Docker Official Get Started Interactive Guide", type: "Official Labs", url: "https://docs.docker.com/get-started/" }
    ],
    project: "Multi-container application containerizing Web API, PostgreSQL, and Redis with Docker Compose",
    certification: "Docker Certified Associate (DCA)"
  },
  "kubernetes": {
    category: "Orchestration & Cloud",
    difficulty: "Advanced",
    weeks: 3,
    resources: [
      { name: "Kubernetes Course for Beginners (TechWorld with Nana)", type: "Video Course", url: "https://www.youtube.com/watch?v=X48VuDVv0do" },
      { name: "Kubernetes The Hard Way (GitHub by Kelsey Hightower)", type: "Lab Guide", url: "https://github.com/kelseyhightower/kubernetes-the-hard-way" }
    ],
    project: "Deploy high-availability microservices cluster with Horizontal Pod Autoscaler and Ingress routing",
    certification: "Certified Kubernetes Administrator (CKA)"
  },
  "aws": {
    category: "Cloud Architecture",
    difficulty: "Intermediate",
    weeks: 3,
    resources: [
      { name: "AWS Certified Cloud Practitioner Training (freeCodeCamp)", type: "Course", url: "https://www.youtube.com/watch?v=SOTamWNgDKc" },
      { name: "AWS Skill Builder Free Hands-on Tier", type: "Labs", url: "https://skillbuilder.aws/" }
    ],
    project: "Serverless event-driven architecture using AWS Lambda, S3, API Gateway, and DynamoDB",
    certification: "AWS Certified Solutions Architect – Associate"
  },
  "nlp": {
    category: "Language Models & NLP",
    difficulty: "Advanced",
    weeks: 3,
    resources: [
      { name: "Hugging Face NLP Course (Free & Interactive)", type: "Hands-on Course", url: "https://huggingface.co/learn/nlp-course" },
      { name: "Stanford CS224N: Natural Language Processing with Deep Learning", type: "University Lectures", url: "https://web.stanford.edu/class/cs224n/" }
    ],
    project: "Custom Retrieval-Augmented Generation (RAG) assistant querying university research papers",
    certification: "Hugging Face Open-Source Certificate"
  },
  "fastapi": {
    category: "High-Performance Backend",
    difficulty: "Intermediate",
    weeks: 2,
    resources: [
      { name: "FastAPI Official Interactive Tutorial", type: "Docs & Code", url: "https://fastapi.tiangolo.com/tutorial/" },
      { name: "Full-Stack FastAPI & Machine Learning Model Deployment (freeCodeCamp)", type: "Video Tutorial", url: "https://www.youtube.com/watch?v=0RS9W8MtUV4" }
    ],
    project: "High-throughput asynchronous ML Model Serving REST API with Pydantic validation and Swagger UI",
    certification: "Full Stack Python Developer (Meta / Coursera)"
  },
  "react": {
    category: "Frontend UI",
    difficulty: "Intermediate",
    weeks: 3,
    resources: [
      { name: "React.dev Official Interactive Tutorial & Sandbox", type: "Official Docs", url: "https://react.dev/learn" },
      { name: "Full Modern React Course 2025 (freeCodeCamp)", type: "Course", url: "https://www.youtube.com/watch?v=bMknfKXIFA8" }
    ],
    project: "Interactive SaaS Dashboard with dark mode, state management, charting, and authentication",
    certification: "Meta Front-End Developer Professional Certificate (Coursera)"
  },
  "typescript": {
    category: "Typed Systems",
    difficulty: "Intermediate",
    weeks: 2,
    resources: [
      { name: "TypeScript for Beginners (fireship / freeCodeCamp)", type: "Crash Course", url: "https://www.youtube.com/watch?v=ahCwqrYpIuM" },
      { name: "TypeScript Handbook (Official Microsoft Documentation)", type: "Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }
    ],
    project: "Refactor legacy JavaScript full-stack application to strict TypeScript with custom generic types",
    certification: "Microsoft Certified: TypeScript Developer"
  },
  "system design": {
    category: "Software Architecture",
    difficulty: "Advanced",
    weeks: 3,
    resources: [
      { name: "System Design Primer by Donne Martin (GitHub)", type: "Comprehensive Guide", url: "https://github.com/donnemartin/system-design-primer" },
      { name: "System Design for Beginners (Gaurav Sen)", type: "Video Series", url: "https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX" }
    ],
    project: "Design document and prototype for a distributed URL shortener or rate limiter handling 100k QPS",
    certification: "Educative System Design Assessment"
  },
  "network security": {
    category: "Cybersecurity",
    difficulty: "Intermediate",
    weeks: 3,
    resources: [
      { name: "Network Security Fundamentals (freeCodeCamp)", type: "Course", url: "https://www.youtube.com/watch?v=qiQR5rTSshw" },
      { name: "Professor Messer's CompTIA Security+ Training", type: "Full Course", url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-training-course/" }
    ],
    project: "Virtual home lab with pfSense firewall, Snort IDS/IPS rules, and attack simulation monitoring",
    certification: "CompTIA Security+ (SY0-701)"
  },
  "ethical hacking": {
    category: "Offensive Security",
    difficulty: "Advanced",
    weeks: 4,
    resources: [
      { name: "TryHackMe: Complete Beginner to Cyber Defense Pathway", type: "Gamified Labs", url: "https://tryhackme.com/" },
      { name: "Practical Ethical Hacking (The Cyber Mentor)", type: "Hands-on Lab", url: "https://www.youtube.com/watch?v=3Kq1MIfTWCE" }
    ],
    project: "Simulated penetration test of vulnerable web app (OWASP Top 10) with complete vulnerability report",
    certification: "eLearnSecurity Junior Penetration Tester (eJPT) / CEH"
  }
};

// Generic Fallback Resource Generator for Any Custom Tech
function getResourceForSkill(skillName) {
  const norm = skillName.toLowerCase();
  if (ROADMAP_KNOWLEDGE_BASE[norm]) {
    return ROADMAP_KNOWLEDGE_BASE[norm];
  }
  return {
    category: "Specialized Technology",
    difficulty: "Intermediate",
    weeks: 2,
    resources: [
      { name: `${skillName} Official Documentation & Getting Started Guide`, type: "Documentation", url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' official documentation tutorials')}` },
      { name: `${skillName} Crash Course & Best Practices (freeCodeCamp)`, type: "Video Tutorial", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial freecodecamp')}` }
    ],
    project: `Build a production-ready application demonstrating core concepts and testing for ${skillName}`,
    certification: `Professional Certification in ${skillName}`
  };
}

// Multi-Factor Career Recommendation Algorithm
function computeCareerRecommendations(studentProfile, roles) {
  const studentSkills = new Set((studentProfile.skills || []).map(s => (s.name || s).toLowerCase()));
  const studentInterests = (studentProfile.interests || []).map(i => i.toLowerCase());
  const studentProjects = studentProfile.projects || [];

  return roles.map(role => {
    const coreSkills = JSON.parse(role.core_skills);
    const secondarySkills = JSON.parse(role.secondary_skills);

    // 1. Core Skill Match (Weight: 50%)
    let coreMatched = 0;
    coreSkills.forEach(s => {
      if (studentSkills.has(s.toLowerCase())) coreMatched++;
    });
    const coreScore = coreSkills.length > 0 ? (coreMatched / coreSkills.length) : 0;

    // 2. Secondary Skill Match (Weight: 20%)
    let secMatched = 0;
    secondarySkills.forEach(s => {
      if (studentSkills.has(s.toLowerCase())) secMatched++;
    });
    const secScore = secondarySkills.length > 0 ? (secMatched / secondarySkills.length) : 0;

    // 3. Project Relevance Score (Weight: 15%)
    let projectMatchCount = 0;
    const allRoleSkills = new Set([...coreSkills, ...secondarySkills].map(s => s.toLowerCase()));
    studentProjects.forEach(p => {
      const techStack = (p.tech || []).map(t => t.toLowerCase());
      techStack.forEach(t => {
        if (allRoleSkills.has(t)) projectMatchCount++;
      });
    });
    const projectScore = Math.min(1.0, projectMatchCount / 4.0);

    // 4. Career Interest Alignment (Weight: 15%)
    let interestScore = 0.2; // Baseline
    studentInterests.forEach(interest => {
      if (role.domain.toLowerCase().includes(interest) || role.role_name.toLowerCase().includes(interest) || interest.includes(role.domain.toLowerCase())) {
        interestScore = 1.0;
      }
    });

    // Total Weighted Score (0.0 to 1.0)
    const compositeScore = (0.50 * coreScore) + (0.20 * secScore) + (0.15 * projectScore) + (0.15 * interestScore);
    const matchPercentage = Math.round(compositeScore * 100);

    return {
      role_id: role.id,
      role_name: role.role_name,
      domain: role.domain,
      description: role.description,
      avg_salary: role.avg_salary,
      outlook: role.outlook,
      match_score: matchPercentage,
      matched_core_skills: coreSkills.filter(s => studentSkills.has(s.toLowerCase())),
      missing_core_skills: coreSkills.filter(s => !studentSkills.has(s.toLowerCase())),
      matched_secondary_skills: secondarySkills.filter(s => studentSkills.has(s.toLowerCase())),
      missing_secondary_skills: secondarySkills.filter(s => !studentSkills.has(s.toLowerCase()))
    };
  }).sort((a, b) => b.match_score - a.match_score);
}

// In-Depth Skill-Gap Analysis Algorithm
function analyzeSkillGap(studentProfile, targetEntity) {
  // targetEntity can be a Role or a Job/JD
  const studentSkillMap = {};
  (studentProfile.skills || []).forEach(s => {
    const name = (typeof s === 'string' ? s : s.name).toLowerCase();
    const level = (typeof s === 'object' && s.level) ? s.level : "Intermediate";
    const score = (typeof s === 'object' && s.score) ? s.score : 0.7;
    studentSkillMap[name] = { level, score };
  });

  const requiredSkills = (targetEntity.required_skills ? (typeof targetEntity.required_skills === 'string' ? JSON.parse(targetEntity.required_skills) : targetEntity.required_skills) : (targetEntity.core_skills ? (typeof targetEntity.core_skills === 'string' ? JSON.parse(targetEntity.core_skills) : targetEntity.core_skills) : [])).map(s => s.toLowerCase());
  
  const optionalSkills = (targetEntity.optional_skills ? (typeof targetEntity.optional_skills === 'string' ? JSON.parse(targetEntity.optional_skills) : targetEntity.optional_skills) : (targetEntity.secondary_skills ? (typeof targetEntity.secondary_skills === 'string' ? JSON.parse(targetEntity.secondary_skills) : targetEntity.secondary_skills) : [])).map(s => s.toLowerCase());

  const existingSkills = [];
  const missingCriticalSkills = [];
  const missingOptionalSkills = [];

  requiredSkills.forEach(req => {
    if (studentSkillMap[req]) {
      existingSkills.push({
        name: req,
        type: "Critical Required",
        student_level: studentSkillMap[req].level,
        proficiency_score: studentSkillMap[req].score
      });
    } else {
      const meta = getResourceForSkill(req);
      missingCriticalSkills.push({
        name: req,
        type: "Critical Missing",
        severity: "CRITICAL",
        category: meta.category,
        estimated_weeks: meta.weeks,
        reason: "Mandatory qualification in 90%+ industry job postings for this role."
      });
    }
  });

  optionalSkills.forEach(opt => {
    if (studentSkillMap[opt]) {
      existingSkills.push({
        name: opt,
        type: "Optional / Good-to-have",
        student_level: studentSkillMap[opt].level,
        proficiency_score: studentSkillMap[opt].score
      });
    } else {
      const meta = getResourceForSkill(opt);
      missingOptionalSkills.push({
        name: opt,
        type: "Secondary Missing",
        severity: "RECOMMENDED",
        category: meta.category,
        estimated_weeks: meta.weeks,
        reason: "High differentiator that gives candidates competitive edge in shortlist."
      });
    }
  });

  // Calculate Match Percentage with Weighted Formula
  const totalWeight = (requiredSkills.length * 2.0) + (optionalSkills.length * 1.0);
  let matchedWeight = 0;
  existingSkills.forEach(s => {
    if (s.type.includes("Critical")) {
      matchedWeight += 2.0 * (s.proficiency_score || 0.7);
    } else {
      matchedWeight += 1.0 * (s.proficiency_score || 0.7);
    }
  });

  const matchScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  const totalWeeksToBridge = [...missingCriticalSkills, ...missingOptionalSkills].reduce((sum, item) => sum + item.estimated_weeks, 0);

  return {
    target_title: targetEntity.role_name || targetEntity.title,
    match_score: matchScore,
    total_required: requiredSkills.length,
    total_optional: optionalSkills.length,
    existing_skills_count: existingSkills.length,
    missing_critical_count: missingCriticalSkills.length,
    missing_optional_count: missingOptionalSkills.length,
    estimated_weeks_to_close_gap: Math.ceil(totalWeeksToBridge * 0.75), // Accounting for concurrent learning
    existing_skills: existingSkills,
    missing_critical: missingCriticalSkills,
    missing_optional: missingOptionalSkills
  };
}

// Internship & Job Matching Algorithm
function computeJobMatches(studentProfile, jobsList) {
  const studentCGPA = studentProfile.education?.cgpa || 7.0;
  const studentSkillSet = new Set((studentProfile.skills || []).map(s => (s.name || s).toLowerCase()));

  return jobsList.map(job => {
    const req = typeof job.required_skills === 'string' ? JSON.parse(job.required_skills) : job.required_skills;
    const opt = typeof job.optional_skills === 'string' ? JSON.parse(job.optional_skills) : job.optional_skills;

    // Direct Skill Overlap
    const reqMatched = req.filter(s => studentSkillSet.has(s.toLowerCase()));
    const optMatched = opt.filter(s => studentSkillSet.has(s.toLowerCase()));
    const reqMissing = req.filter(s => !studentSkillSet.has(s.toLowerCase()));
    const optMissing = opt.filter(s => !studentSkillSet.has(s.toLowerCase()));

    // Weighted Formula
    const maxScore = (req.length * 3) + (opt.length * 1);
    const earnedScore = (reqMatched.length * 3) + (optMatched.length * 1);
    const skillRatio = maxScore > 0 ? (earnedScore / maxScore) : 0.5;

    // Academic Eligibility Factor
    const cgpaEligible = studentCGPA >= (job.min_cgpa || 6.0);
    const cgpaFactor = cgpaEligible ? 1.0 : 0.85;

    // Final Match Score (0 - 100%)
    const finalMatchScore = Math.min(100, Math.round(skillRatio * 100 * cgpaFactor));

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      domain: job.domain,
      min_cgpa: job.min_cgpa,
      cgpa_eligible: cgpaEligible,
      description: job.description,
      apply_url: job.apply_url || "#",
      match_score: finalMatchScore,
      matched_skills: [...reqMatched, ...optMatched],
      missing_skills: [...reqMissing, ...optMissing],
      required_missing: reqMissing,
      is_custom: !!job.is_custom
    };
  }).sort((a, b) => b.match_score - a.match_score);
}

// Personalized Learning Roadmap Generator
function generatePersonalizedRoadmap(studentProfile, targetEntity) {
  const gap = analyzeSkillGap(studentProfile, targetEntity);
  const missingAll = [...gap.missing_critical, ...gap.missing_optional];

  // Organize Missing Skills into 4 Structured Sequential Phases
  const phase1 = []; // Foundations & Prerequisite Tools
  const phase2 = []; // Core Technologies & Frameworks
  const phase3 = []; // Advanced Integration, System Design & Cloud
  const phase4 = []; // Capstone Project Portfolio & Industry Certifications

  missingAll.forEach((item, index) => {
    const meta = getResourceForSkill(item.name);
    const enriched = {
      skill: item.name,
      severity: item.severity,
      category: meta.category,
      difficulty: meta.difficulty,
      duration: `${meta.weeks} Weeks`,
      resources: meta.resources,
      hands_on_project: meta.project,
      recommended_certification: meta.certification
    };

    if (item.category.includes("Core") || item.name.includes("git") || item.name.includes("linux") || item.name.includes("sql")) {
      phase1.push(enriched);
    } else if (item.category.includes("Framework") || item.category.includes("UI") || item.category.includes("Backend")) {
      phase2.push(enriched);
    } else if (item.category.includes("DevOps") || item.category.includes("Cloud") || item.category.includes("Language Models") || item.category.includes("Deep Learning")) {
      phase3.push(enriched);
    } else {
      if (index % 3 === 0) phase1.push(enriched);
      else if (index % 3 === 1) phase2.push(enriched);
      else phase3.push(enriched);
    }
  });

  // Recommended Capstone Projects & Certifications
  const targetTitle = targetEntity.role_name || targetEntity.title;
  const portfolioProjects = [
    {
      title: `Production-Ready ${targetTitle} Capstone Showcase`,
      description: `Architect a full-stack, end-to-end cloud-deployed system combining all bridged competencies: unit tests, CI/CD pipeline, and live interactive UI demo.`,
      deliverables: ["Live Deployed Link (Vercel/AWS)", "GitHub Clean Repo with Architectural Diagram", "API Documentation / Swagger", "Performance Benchmarks"],
      impact: "Demonstrates production readiness to technical interviewers and hiring managers."
    },
    {
      title: `Real-World Industry Case Study & Benchmark Project`,
      description: `Solve an actual business problem reflecting industry standards for ${targetTitle}, handling edge cases, security validation, and asynchronous data streaming.`,
      deliverables: ["Case Study Write-up", "Modular Codebase", "Video Walkthrough Demo"],
      impact: "Proves problem-solving depth and domain expertise beyond toy tutorials."
    }
  ];

  const targetCertifications = [
    {
      name: targetTitle.includes("AI") ? "DeepLearning.AI Deep Learning & MLOps Specialization" : targetTitle.includes("Cloud") ? "AWS Certified Solutions Architect – Associate" : targetTitle.includes("Cyber") ? "CompTIA Security+ (SY0-701)" : "Meta Full-Stack Professional Certificate",
      provider: "Industry Recognized Accreditation",
      preparation_time: "4-6 Weeks",
      strategic_value: "Validates verified technical competency on student resume and LinkedIn profile."
    },
    {
      name: "GitHub Foundations & Professional Open Source Contributor",
      provider: "GitHub / Linux Foundation",
      preparation_time: "2 Weeks",
      strategic_value: "Verifies collaborative software engineering, Git branching, and CI/CD mastery."
    }
  ];

  return {
    target_role_title: targetTitle,
    current_match_score: gap.match_score,
    total_estimated_weeks: Math.max(8, gap.estimated_weeks_to_close_gap),
    skill_gap_summary: {
      existing: gap.existing_skills_count,
      missing_critical: gap.missing_critical_count,
      missing_optional: gap.missing_optional_count
    },
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Foundations & Core Deficiencies",
        timeline: "Weeks 1 - 3",
        objective: "Solidify prerequisite fundamentals, development environment, and core missing libraries.",
        skills: phase1.length > 0 ? phase1 : [{
          skill: "Core Foundations Review",
          duration: "2 Weeks",
          category: "Fundamentals",
          resources: [{ name: "CS50 or Standard Core CS Refresher", type: "Course", url: "https://cs50.harvard.edu/" }],
          hands_on_project: "Implement comprehensive unit test suites for data structures",
          recommended_certification: "Foundational CS Benchmark"
        }]
      },
      {
        phase_number: 2,
        title: "Phase 2: Core Engineering & Framework Mastery",
        timeline: "Weeks 4 - 7",
        objective: "Master industry-standard frameworks, libraries, and integration patterns required for the role.",
        skills: phase2.length > 0 ? phase2 : [{
          skill: "Specialized Framework Immersion",
          duration: "3 Weeks",
          category: "Frameworks",
          resources: [{ name: "Official Framework Tutorials & Best Practices", type: "Docs", url: "https://roadmap.sh" }],
          hands_on_project: "Build full CRUD microservice or predictive pipeline",
          recommended_certification: "Framework Competency Certificate"
        }]
      },
      {
        phase_number: 3,
        title: "Phase 3: Production Deployment, Cloud & Scalability",
        timeline: "Weeks 8 - 10",
        objective: "Bridge high-value differentiators: containerization, CI/CD, cloud deployment, and system security.",
        skills: phase3.length > 0 ? phase3 : [{
          skill: "Containerization & Cloud Infrastructure",
          duration: "3 Weeks",
          category: "Cloud/DevOps",
          resources: [{ name: "Docker & Cloud Hands-On Labs", type: "Interactive", url: "https://docs.docker.com/" }],
          hands_on_project: "Containerize application with automated CI/CD pipeline",
          recommended_certification: "Cloud Associate Certificate"
        }]
      },
      {
        phase_number: 4,
        title: "Phase 4: Capstone Portfolio, Mock Interviews & Placement",
        timeline: "Weeks 11 - 12",
        objective: "Produce enterprise-grade portfolio projects, acquire industry certification, and optimize resume.",
        portfolio_projects: portfolioProjects,
        certifications: targetCertifications,
        action_checklist: [
          "Publish clean GitHub repository with professional README and architectural schematics",
          "Deploy live working project with publicly accessible URL",
          "Update resume with quantified impact statements (e.g., 'reduced latency by 35%')",
          "Conduct 3 mock technical interviews on algorithmic problem solving and system design",
          "Apply to the matched internship opportunities with personalized cover letters"
        ]
      }
    ]
  };
}

// Resume Parser & Entity Extraction
function parseResumeContent(rawText) {
  const clean = rawText || "";
  const extractedSkills = extractSkillsFromText(clean);

  // Extract Email
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Extract Phone
  const phoneMatch = clean.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Extract CGPA
  const cgpaMatch = clean.match(/(?:cgpa|gpa|score)\s*(?::|=|\s)?\s*([0-9]\.[0-9]{1,2})/i);
  const cgpa = cgpaMatch ? parseFloat(cgpaMatch[1]) : 7.5;

  // Extract Degree
  let degree = "B.Tech in Computer Science & Engineering";
  if (/master|m\.tech|m\.s\./i.test(clean)) degree = "M.Tech / M.S. in Computer Science";
  else if (/bca|b\.sc|bachelor of computer/i.test(clean)) degree = "BCA / B.Sc in Computer Science";
  else if (/b\.e\.|b\.tech/i.test(clean)) degree = "B.Tech / B.E. in Engineering";

  // Build Structured Profile Elements
  const skillsObjects = extractedSkills.map(skill => ({
    name: skill,
    level: "Intermediate",
    score: 0.75
  }));

  return {
    email,
    phone,
    degree,
    cgpa,
    extracted_skills: skillsObjects,
    raw_skills_list: extractedSkills,
    summary: `Extracted ${extractedSkills.length} verified technical skills, CGPA (${cgpa}), and qualification: ${degree}.`
  };
}

// ==========================================
// 3. HTTP SERVER & REST API DISPATCHER
// ==========================================

const server = http.createServer(async (req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Helper to read JSON request body
  const readJsonBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });

  // Helper to send JSON response
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // ------------------------------------------
    // API: AUTHENTICATION
    // ------------------------------------------
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const { name, email, password } = await readJsonBody();
      if (!name || !email || !password) {
        return sendJson(400, { error: "Name, email, and password are required." });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return sendJson(409, { error: "An account with this email already exists." });
      }

      const id = "usr-" + crypto.randomUUID().slice(0, 8);
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(id, name, email, hash);

      // Initialize empty profile
      db.prepare(`
        INSERT INTO profiles (user_id, education, skills, projects, certifications, interests, target_role, resume_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        JSON.stringify({ degree: "B.Tech Computer Science", institution: "University", cgpa: 7.5, gradYear: 2026, currentYear: "Final Year" }),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(["Artificial Intelligence"]),
        "role-ai-ml",
        ""
      );

      return sendJson(201, {
        success: true,
        message: "Registration successful!",
        user: { id, name, email }
      });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = await readJsonBody();
      const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
      if (!user) {
        return sendJson(401, { error: "Invalid email or password." });
      }

      const hash = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password_hash !== hash) {
        return sendJson(401, { error: "Invalid email or password." });
      }

      return sendJson(200, {
        success: true,
        message: "Login successful!",
        user: { id: user.id, name: user.name, email: user.email }
      });
    }

    // ------------------------------------------
    // API: STUDENT PROFILE MANAGEMENT
    // ------------------------------------------
    if (pathname === '/api/profile' && req.method === 'GET') {
      const userId = url.searchParams.get('userId') || demoUserId;
      const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

      if (!profileRow) {
        return sendJson(404, { error: "Profile not found." });
      }

      return sendJson(200, {
        user: user || { id: userId, name: "Student", email: "student@example.edu" },
        profile: {
          education: profileRow.education ? JSON.parse(profileRow.education) : {},
          skills: profileRow.skills ? JSON.parse(profileRow.skills) : [],
          projects: profileRow.projects ? JSON.parse(profileRow.projects) : [],
          certifications: profileRow.certifications ? JSON.parse(profileRow.certifications) : [],
          interests: profileRow.interests ? JSON.parse(profileRow.interests) : [],
          target_role: profileRow.target_role || "role-ai-ml",
          resume_text: profileRow.resume_text || ""
        }
      });
    }

    if (pathname === '/api/profile' && req.method === 'POST') {
      const body = await readJsonBody();
      const userId = body.userId || demoUserId;

      const education = JSON.stringify(body.education || {});
      const skills = JSON.stringify(body.skills || []);
      const projects = JSON.stringify(body.projects || []);
      const certifications = JSON.stringify(body.certifications || []);
      const interests = JSON.stringify(body.interests || []);
      const targetRole = body.target_role || "role-ai-ml";
      const resumeText = body.resume_text || "";

      db.prepare(`
        INSERT INTO profiles (user_id, education, skills, projects, certifications, interests, target_role, resume_text, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          education = excluded.education,
          skills = excluded.skills,
          projects = excluded.projects,
          certifications = excluded.certifications,
          interests = excluded.interests,
          target_role = excluded.target_role,
          resume_text = excluded.resume_text,
          updated_at = CURRENT_TIMESTAMP
      `).run(userId, education, skills, projects, certifications, interests, targetRole, resumeText);

      return sendJson(200, { success: true, message: "Profile updated successfully!" });
    }

    // ------------------------------------------
    // API: RESUME PARSE & UPLOAD
    // ------------------------------------------
    if (pathname === '/api/resume/parse' && req.method === 'POST') {
      const { text, userId } = await readJsonBody();
      if (!text || text.trim().length === 0) {
        return sendJson(400, { error: "Resume text content is required." });
      }

      const parsed = parseResumeContent(text);

      // If userId is provided, automatically merge extracted skills into profile
      if (userId) {
        const current = db.prepare('SELECT skills, education FROM profiles WHERE user_id = ?').get(userId);
        let existingSkills = current && current.skills ? JSON.parse(current.skills) : [];
        const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase()));

        parsed.extracted_skills.forEach(s => {
          if (!existingNames.has(s.name.toLowerCase())) {
            existingSkills.push(s);
          }
        });

        db.prepare('UPDATE profiles SET skills = ?, resume_text = ? WHERE user_id = ?').run(
          JSON.stringify(existingSkills),
          text,
          userId
        );
      }

      return sendJson(200, {
        success: true,
        data: parsed
      });
    }

    // ------------------------------------------
    // API: ROLES CATALOG & JOBS CATALOG
    // ------------------------------------------
    if (pathname === '/api/roles' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM roles_catalog').all();
      return sendJson(200, {
        roles: rows.map(r => ({
          ...r,
          core_skills: JSON.parse(r.core_skills),
          secondary_skills: JSON.parse(r.secondary_skills)
        }))
      });
    }

    if (pathname === '/api/jobs' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM jobs ORDER BY is_custom DESC, created_at DESC').all();
      return sendJson(200, {
        jobs: rows.map(j => ({
          ...j,
          required_skills: JSON.parse(j.required_skills),
          optional_skills: JSON.parse(j.optional_skills)
        }))
      });
    }

    // ------------------------------------------
    // API: CUSTOM JOB DESCRIPTION (JD) INPUT & SCRAPING
    // ------------------------------------------
    if (pathname === '/api/jobs/custom' && req.method === 'POST') {
      const { title, company, location, type, domain, jd_text, min_cgpa } = await readJsonBody();

      if (!title || !jd_text) {
        return sendJson(400, { error: "Job title and Job Description (JD) text are required." });
      }

      // AI Skill Extraction from JD Text
      const extractedSkills = extractSkillsFromText(jd_text);
      const reqSkills = extractedSkills.slice(0, Math.ceil(extractedSkills.length * 0.65));
      const optSkills = extractedSkills.slice(Math.ceil(extractedSkills.length * 0.65));

      const newJobId = "custom-job-" + crypto.randomUUID().slice(0, 8);
      db.prepare(`
        INSERT INTO jobs (id, title, company, location, type, domain, required_skills, optional_skills, min_cgpa, description, is_custom)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        newJobId,
        title,
        company || "Direct Job Description Post",
        location || "Remote / Specified in JD",
        type || "Internship / Full-time",
        domain || "Software Engineering",
        JSON.stringify(reqSkills.length > 0 ? reqSkills : ["python", "data structures"]),
        JSON.stringify(optSkills.length > 0 ? optSkills : ["git", "rest api"]),
        min_cgpa ? parseFloat(min_cgpa) : 6.5,
        jd_text
      );

      return sendJson(201, {
        success: true,
        message: "Job description analyzed and added successfully!",
        job_id: newJobId,
        extracted_skills: extractedSkills
      });
    }

    // ------------------------------------------
    // API: AI CAREER RECOMMENDATION
    // ------------------------------------------
    if (pathname === '/api/analyze/career' && req.method === 'POST') {
      const body = await readJsonBody();
      const userId = body.userId || demoUserId;
      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

      const profile = body.profile || (profileRow ? {
        education: JSON.parse(profileRow.education || "{}"),
        skills: JSON.parse(profileRow.skills || "[]"),
        projects: JSON.parse(profileRow.projects || "[]"),
        certifications: JSON.parse(profileRow.certifications || "[]"),
        interests: JSON.parse(profileRow.interests || "[]")
      } : {});

      const roles = db.prepare('SELECT * FROM roles_catalog').all();
      const recommendations = computeCareerRecommendations(profile, roles);

      return sendJson(200, {
        success: true,
        recommendations,
        top_role: recommendations[0] || null
      });
    }

    // ------------------------------------------
    // API: SKILL-GAP ANALYSIS
    // ------------------------------------------
    if (pathname === '/api/analyze/skill-gap' && req.method === 'POST') {
      const body = await readJsonBody();
      const userId = body.userId || demoUserId;
      const targetRoleId = body.target_role_id;
      const customJdId = body.job_id;

      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
      const profile = body.profile || (profileRow ? {
        skills: JSON.parse(profileRow.skills || "[]"),
        education: JSON.parse(profileRow.education || "{}")
      } : { skills: [] });

      let targetEntity = null;
      if (customJdId) {
        targetEntity = db.prepare('SELECT * FROM jobs WHERE id = ?').get(customJdId);
      } else {
        const roleId = targetRoleId || (profileRow ? profileRow.target_role : "role-ai-ml");
        targetEntity = db.prepare('SELECT * FROM roles_catalog WHERE id = ?').get(roleId);
      }

      if (!targetEntity) {
        return sendJson(404, { error: "Target role or job posting not found." });
      }

      const report = analyzeSkillGap(profile, targetEntity);
      return sendJson(200, {
        success: true,
        report
      });
    }

    // ------------------------------------------
    // API: INTERNSHIP & JOB MATCHING
    // ------------------------------------------
    if (pathname === '/api/analyze/internships' && req.method === 'POST') {
      const body = await readJsonBody();
      const userId = body.userId || demoUserId;
      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

      const profile = body.profile || (profileRow ? {
        education: JSON.parse(profileRow.education || "{}"),
        skills: JSON.parse(profileRow.skills || "[]")
      } : { skills: [] });

      const allJobs = db.prepare('SELECT * FROM jobs').all();
      const matches = computeJobMatches(profile, allJobs);

      return sendJson(200, {
        success: true,
        total_opportunities: matches.length,
        matches
      });
    }

    // ------------------------------------------
    // API: PERSONALIZED LEARNING ROADMAP
    // ------------------------------------------
    if (pathname === '/api/analyze/roadmap' && req.method === 'POST') {
      const body = await readJsonBody();
      const userId = body.userId || demoUserId;
      const targetRoleId = body.target_role_id;
      const jobId = body.job_id;

      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
      const profile = body.profile || (profileRow ? {
        skills: JSON.parse(profileRow.skills || "[]"),
        education: JSON.parse(profileRow.education || "{}")
      } : { skills: [] });

      let targetEntity = null;
      if (jobId) {
        targetEntity = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
      } else {
        const roleId = targetRoleId || (profileRow ? profileRow.target_role : "role-ai-ml");
        targetEntity = db.prepare('SELECT * FROM roles_catalog WHERE id = ?').get(roleId);
      }

      if (!targetEntity) {
        return sendJson(404, { error: "Target entity for roadmap not found." });
      }

      const roadmap = generatePersonalizedRoadmap(profile, targetEntity);
      return sendJson(200, {
        success: true,
        roadmap
      });
    }

    // ------------------------------------------
    // API: DASHBOARD SUMMARY
    // ------------------------------------------
    if (pathname === '/api/analytics/summary' && req.method === 'GET') {
      const userId = url.searchParams.get('userId') || demoUserId;
      const profileRow = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
      const roles = db.prepare('SELECT * FROM roles_catalog').all();
      const allJobs = db.prepare('SELECT * FROM jobs').all();

      const profile = profileRow ? {
        education: JSON.parse(profileRow.education || "{}"),
        skills: JSON.parse(profileRow.skills || "[]"),
        projects: JSON.parse(profileRow.projects || "[]"),
        certifications: JSON.parse(profileRow.certifications || "[]"),
        interests: JSON.parse(profileRow.interests || "[]"),
        target_role: profileRow.target_role || "role-ai-ml"
      } : { skills: [], projects: [], certifications: [] };

      const careerRecs = computeCareerRecommendations(profile, roles);
      const jobMatches = computeJobMatches(profile, allJobs);
      const targetRoleEntity = db.prepare('SELECT * FROM roles_catalog WHERE id = ?').get(profile.target_role) || roles[0];
      const gapReport = analyzeSkillGap(profile, targetRoleEntity);

      return sendJson(200, {
        student_name: db.prepare('SELECT name FROM users WHERE id = ?').get(userId)?.name || "Student",
        skills_count: (profile.skills || []).length,
        projects_count: (profile.projects || []).length,
        certifications_count: (profile.certifications || []).length,
        top_career: careerRecs[0] || null,
        target_role_match: gapReport.match_score,
        suitable_internships_count: jobMatches.filter(j => j.match_score >= 60).length,
        missing_critical_skills: gapReport.missing_critical_count
      });
    }

    // ------------------------------------------
    // STATIC ASSETS SERVING
    // ------------------------------------------
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Route not found: ${pathname}` }));

  } catch (err) {
    console.error("Internal Server Error:", err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Internal Server Error", details: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` AI CareerMate Server running on http://localhost:${PORT}`);
  console.log(` SQLite Database: ${DB_PATH}`);
  console.log(`=======================================================`);
});
