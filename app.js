// AI CareerMate - Client-Side Orchestrator
let currentUserId = "demo-student-001";
let state = {
  user: null,
  profile: null,
  roles: [],
  recommendations: [],
  gapReport: null,
  jobs: [],
  roadmap: null
};

// UI Initialization
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigationTabs();
  setupEventListeners();
  await loadRolesCatalog();
  await loadStudentProfile();
  await loadDashboardAnalytics();
});

// Toast Notifications
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// Navigation Tabs
function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchTab(targetId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === tabId);
  });

  // Lazy trigger calculations upon switching to relevant tabs
  if (tabId === 'tab-recommendations' && state.recommendations.length === 0) {
    loadCareerRecommendations();
  } else if (tabId === 'tab-skillgap' && !state.gapReport) {
    runSkillGapAnalysis();
  } else if (tabId === 'tab-jobs' && state.jobs.length === 0) {
    loadJobMatches();
  } else if (tabId === 'tab-roadmap' && !state.roadmap) {
    generateRoadmap();
  } else if (tabId === 'tab-dashboard') {
    loadDashboardAnalytics();
  }
}

// Event Listeners
function setupEventListeners() {
  // Demo Reset
  document.getElementById('btnResetDemo').addEventListener('click', async () => {
    await loadStudentProfile();
    await loadDashboardAnalytics();
    showToast("Loaded Aarav Sharma demo profile!");
  });

  // Profile Save
  document.getElementById('btnSaveProfile').addEventListener('click', async (e) => {
    e.preventDefault();
    await saveProfileChanges();
  });

  // Add Skill
  document.getElementById('btnAddSkill').addEventListener('click', () => {
    const nameInput = document.getElementById('newSkillName');
    const levelSelect = document.getElementById('newSkillLevel');
    const name = nameInput.value.trim().toLowerCase();
    if (!name) return;

    if (!state.profile.skills) state.profile.skills = [];
    if (!state.profile.skills.some(s => s.name.toLowerCase() === name)) {
      const score = levelSelect.value === 'Advanced' ? 0.9 : levelSelect.value === 'Intermediate' ? 0.75 : 0.5;
      state.profile.skills.push({ name, level: levelSelect.value, score });
      renderSkillsBadges();
      nameInput.value = '';
      showToast(`Added skill: ${name}`);
    }
  });

  // Add Project
  document.getElementById('btnOpenAddProject').addEventListener('click', () => {
    const title = prompt("Enter Project Title:");
    if (!title) return;
    const tech = prompt("Enter Tech Stack (comma separated):", "Python, React, SQL");
    const desc = prompt("Enter Brief Description:", "Designed and deployed a full-stack solution.");

    state.profile.projects.push({
      title,
      tech: tech ? tech.split(',').map(t => t.trim().toLowerCase()) : [],
      description: desc || ""
    });
    renderProjectsList();
    showToast("Project added to profile!");
  });

  // Add Certification
  document.getElementById('btnOpenAddCert').addEventListener('click', () => {
    const title = prompt("Enter Certification Title:");
    if (!title) return;
    const issuer = prompt("Enter Issuing Organization (e.g. AWS, DeepLearning.AI):", "Coursera");
    const year = prompt("Year Acquired:", "2025");

    state.profile.certifications.push({
      title,
      issuer: issuer || "Accredited Provider",
      year: parseInt(year) || 2025
    });
    renderCertificationsList();
    showToast("Certification added to profile!");
  });

  // Resume Parse
  document.getElementById('btnParseResume').addEventListener('click', async () => {
    const text = document.getElementById('resumeInputText').value;
    if (!text.trim()) {
      alert("Please paste your resume text first.");
      return;
    }
    await parseResume(text);
  });

  // Insert Sample Resume
  document.getElementById('btnLoadSampleResume').addEventListener('click', () => {
    const sample = `Aarav Sharma
Email: aarav.sharma@example.edu | Phone: +91 9876543210
Education:
B.Tech in Computer Science and Engineering, National Institute of Technology (NIT)
Cumulative GPA: 8.4 / 10.0 (Graduation Year: 2026)

Technical Skills:
Programming Languages: Python, C++, SQL, JavaScript
Machine Learning & Data: Machine Learning, Scikit-Learn, Pandas, NumPy, Data Analysis
Core CS: Data Structures & Algorithms, Object-Oriented Programming (OOP)
Tools & Web: Git, GitHub, HTML, CSS, REST APIs

Projects:
1. Plant Leaf Disease Classifier (Python, OpenCV, Scikit-Learn, Pandas)
- Built automated image classifier processing 5,000 crop images with 92% accuracy.
2. E-Commerce Customer Churn Prediction (Python, Pandas, SQL)
- Analyzed 100,000 transaction records and trained random forest model.

Certifications:
- DeepLearning.AI Machine Learning Specialization (Coursera, 2025)
- Python for Data Science (Udemy, 2024)`;

    document.getElementById('resumeInputText').value = sample;
  });

  // Refresh Career Recommendations
  document.getElementById('btnRefreshRecs').addEventListener('click', () => {
    loadCareerRecommendations();
  });

  // Run Gap Analysis
  document.getElementById('btnRunGapAnalysis').addEventListener('click', () => {
    const roleId = document.getElementById('selectGapRole').value;
    runSkillGapAnalysis(roleId);
  });

  // Generate Roadmap
  document.getElementById('btnGenerateRoadmap').addEventListener('click', () => {
    const roleId = document.getElementById('selectRoadmapRole').value;
    generateRoadmap(roleId);
  });

  // Custom JD Form
  document.getElementById('customJdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitCustomJd();
  });

  // Filters for Jobs
  document.getElementById('filterJobDomain').addEventListener('change', () => filterJobs());
  document.getElementById('filterMinScore').addEventListener('change', () => filterJobs());
}

// 1. Roles Catalog API
async function loadRolesCatalog() {
  try {
    const res = await fetch('/api/roles');
    const data = await res.json();
    state.roles = data.roles || [];

    const targetSelect = document.getElementById('profTargetRole');
    const gapSelect = document.getElementById('selectGapRole');
    const roadSelect = document.getElementById('selectRoadmapRole');

    targetSelect.innerHTML = '';
    gapSelect.innerHTML = '';
    roadSelect.innerHTML = '';

    state.roles.forEach(role => {
      const opt1 = document.createElement('option');
      opt1.value = role.id;
      opt1.textContent = `${role.role_name} (${role.domain})`;
      targetSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = role.id;
      opt2.textContent = `${role.role_name} (${role.domain})`;
      gapSelect.appendChild(opt2);

      const opt3 = document.createElement('option');
      opt3.value = role.id;
      opt3.textContent = `${role.role_name} (${role.domain})`;
      roadSelect.appendChild(opt3);
    });
  } catch (err) {
    console.error("Failed to load roles catalog:", err);
  }
}

// 2. Student Profile API
async function loadStudentProfile() {
  try {
    const res = await fetch(`/api/profile?userId=${currentUserId}`);
    const data = await res.json();
    state.user = data.user;
    state.profile = data.profile;

    // Header Pill
    document.getElementById('activeStudentName').textContent = state.user.name;
    document.getElementById('activeStudentCgpa').textContent = `CGPA: ${state.profile.education?.cgpa || '7.5'}`;

    // Profile Form
    document.getElementById('profName').value = state.user.name || '';
    document.getElementById('profEmail').value = state.user.email || '';
    document.getElementById('profDegree').value = state.profile.education?.degree || '';
    document.getElementById('profInstitution').value = state.profile.education?.institution || '';
    document.getElementById('profCgpa').value = state.profile.education?.cgpa || 7.5;
    document.getElementById('profGradYear').value = state.profile.education?.gradYear || 2026;
    document.getElementById('profTargetRole').value = state.profile.target_role || 'role-ai-ml';
    document.getElementById('profInterests').value = (state.profile.interests || []).join(', ');

    if (state.profile.resume_text) {
      document.getElementById('resumeInputText').value = state.profile.resume_text;
    }

    renderSkillsBadges();
    renderProjectsList();
    renderCertificationsList();
  } catch (err) {
    console.error("Failed to load student profile:", err);
  }
}

function renderSkillsBadges() {
  const container = document.getElementById('skillsBadgesContainer');
  container.innerHTML = '';
  const skills = state.profile.skills || [];

  if (skills.length === 0) {
    container.innerHTML = `<p class="text-muted">No skills added yet. Add via the input above or extract from your resume!</p>`;
    return;
  }

  skills.forEach((skill, idx) => {
    const chip = document.createElement('div');
    chip.className = 'skill-chip';
    chip.innerHTML = `
      <span>${skill.name}</span>
      <span class="level-badge">${skill.level || 'Intermediate'}</span>
      <button class="remove-btn" title="Remove skill">&times;</button>
    `;
    chip.querySelector('.remove-btn').addEventListener('click', () => {
      state.profile.skills.splice(idx, 1);
      renderSkillsBadges();
    });
    container.appendChild(chip);
  });
}

function renderProjectsList() {
  const container = document.getElementById('projectsListContainer');
  container.innerHTML = '';
  const projects = state.profile.projects || [];

  if (projects.length === 0) {
    container.innerHTML = `<p class="text-muted">No projects recorded yet. Click "+ New Project" to add your portfolio accomplishments.</p>`;
    return;
  }

  projects.forEach((proj, idx) => {
    const div = document.createElement('div');
    div.className = 'project-item';
    const tagsHtml = (proj.tech || []).map(t => `<span class="tech-tag">${t}</span>`).join('');
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>${proj.title}</h4>
        <button class="btn-link" style="color:#ef4444; font-size:0.8rem;" onclick="removeProject(${idx})">Delete</button>
      </div>
      <p>${proj.description}</p>
      <div class="tech-tags-row">${tagsHtml}</div>
    `;
    container.appendChild(div);
  });
}

window.removeProject = (idx) => {
  state.profile.projects.splice(idx, 1);
  renderProjectsList();
};

function renderCertificationsList() {
  const container = document.getElementById('certificationsListContainer');
  container.innerHTML = '';
  const certs = state.profile.certifications || [];

  if (certs.length === 0) {
    container.innerHTML = `<p class="text-muted">No certifications recorded yet. Click "+ Add Certification" to record certificates.</p>`;
    return;
  }

  certs.forEach((cert, idx) => {
    const div = document.createElement('div');
    div.className = 'cert-item';
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>${cert.title}</h4>
        <button class="btn-link" style="color:#ef4444; font-size:0.8rem;" onclick="removeCert(${idx})">Delete</button>
      </div>
      <p>${cert.issuer} • Issued: ${cert.year || '2025'}</p>
    `;
    container.appendChild(div);
  });
}

window.removeCert = (idx) => {
  state.profile.certifications.splice(idx, 1);
  renderCertificationsList();
};

async function saveProfileChanges() {
  const payload = {
    userId: currentUserId,
    education: {
      degree: document.getElementById('profDegree').value,
      institution: document.getElementById('profInstitution').value,
      cgpa: parseFloat(document.getElementById('profCgpa').value) || 7.5,
      gradYear: parseInt(document.getElementById('profGradYear').value) || 2026
    },
    skills: state.profile.skills || [],
    projects: state.profile.projects || [],
    certifications: state.profile.certifications || [],
    interests: document.getElementById('profInterests').value.split(',').map(s => s.trim()).filter(Boolean),
    target_role: document.getElementById('profTargetRole').value,
    resume_text: document.getElementById('resumeInputText').value
  };

  try {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast("Profile saved successfully!");
      await loadStudentProfile();
      await loadDashboardAnalytics();
    }
  } catch (err) {
    console.error("Save profile error:", err);
    showToast("Error saving profile.");
  }
}

// 3. Resume Parser API
async function parseResume(text) {
  try {
    const res = await fetch('/api/resume/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId: currentUserId })
    });
    const result = await res.json();
    if (result.success) {
      const data = result.data;
      const resultBox = document.getElementById('resumeParseResult');
      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:1rem; border-radius:8px; margin-top:1rem;">
          <h4 style="color:#065f46; margin-bottom:0.4rem;">AI Extraction Summary</h4>
          <p style="font-size:0.88rem; color:#047857; margin-bottom:0.6rem;">${data.summary}</p>
          <div style="font-size:0.82rem; color:#065f46;">
            <strong>Detected Skills (${data.raw_skills_list.length}):</strong> 
            ${data.raw_skills_list.map(s => `<span class="badge badge-green" style="margin:2px;">${s}</span>`).join(' ')}
          </div>
        </div>
      `;
      showToast("Resume parsed & skills synced to profile!");
      await loadStudentProfile();
      await loadDashboardAnalytics();
    }
  } catch (err) {
    console.error("Parse resume error:", err);
    showToast("Error parsing resume.");
  }
}

// 4. AI Career Recommendations API
async function loadCareerRecommendations() {
  try {
    const res = await fetch('/api/analyze/career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    });
    const data = await res.json();
    state.recommendations = data.recommendations || [];

    const container = document.getElementById('careerRolesContainer');
    container.innerHTML = '';

    state.recommendations.forEach(role => {
      const card = document.createElement('div');
      card.className = 'role-card';
      card.innerHTML = `
        <div>
          <div class="role-top-row">
            <div>
              <h3 class="role-title">${role.role_name}</h3>
              <div class="role-domain">${role.domain}</div>
            </div>
            <div class="match-ring" style="--percent: ${role.match_score}">
              <span class="match-ring-text">${role.match_score}%</span>
            </div>
          </div>
          <p class="role-desc">${role.description}</p>
          <div class="role-meta-grid">
            <div><strong>Avg Salary:</strong> ${role.avg_salary}</div>
            <div><strong>Outlook:</strong> ${role.outlook}</div>
          </div>
          <div class="role-skills-preview">
            <h5>Matched Skills (${role.matched_core_skills.length})</h5>
            <div>
              ${role.matched_core_skills.length > 0 ? role.matched_core_skills.map(s => `<span class="badge badge-green" style="margin:2px;">${s}</span>`).join(' ') : '<span class="text-muted" style="font-size:0.75rem;">None</span>'}
            </div>
          </div>
          <div class="role-skills-preview">
            <h5>Missing Core Skills (${role.missing_core_skills.length})</h5>
            <div>
              ${role.missing_core_skills.length > 0 ? role.missing_core_skills.map(s => `<span class="badge badge-red" style="margin:2px;">${s}</span>`).join(' ') : '<span class="badge badge-green">Zero Core Gaps!</span>'}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; margin-top:1.25rem;">
          <button class="btn btn-primary btn-sm" style="flex:1;" onclick="viewRoleGap('${role.role_id}')">Analyze Skill Gap</button>
          <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="viewRoleRoadmap('${role.role_id}')">View Roadmap</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Career recs error:", err);
  }
}

window.viewRoleGap = (roleId) => {
  document.getElementById('selectGapRole').value = roleId;
  switchTab('tab-skillgap');
  runSkillGapAnalysis(roleId);
};

window.viewRoleRoadmap = (roleId) => {
  document.getElementById('selectRoadmapRole').value = roleId;
  switchTab('tab-roadmap');
  generateRoadmap(roleId);
};

// 5. Skill Gap Analysis API
async function runSkillGapAnalysis(targetRoleId) {
  const roleId = targetRoleId || document.getElementById('selectGapRole').value;
  try {
    const res = await fetch('/api/analyze/skill-gap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, target_role_id: roleId })
    });
    const data = await res.json();
    state.gapReport = data.report;
    renderSkillGapReport(data.report);
  } catch (err) {
    console.error("Skill gap error:", err);
  }
}

function renderSkillGapReport(report) {
  const container = document.getElementById('skillGapReportContent');
  container.innerHTML = `
    <div class="gap-score-overview">
      <div class="gap-meter-box">
        <div class="big-percentage">${report.match_score}%</div>
        <div>
          <h3 style="font-size:1.2rem; font-weight:800;">Role Readiness Benchmark</h3>
          <p class="text-muted">Target: ${report.target_title}</p>
          <p style="font-size:0.85rem; font-weight:600; color:var(--primary); margin-top:0.25rem;">
            Estimated time to achieve 100% readiness: <strong>${report.estimated_weeks_to_close_gap} Weeks</strong>
          </p>
        </div>
      </div>
      <div class="gap-pills-row">
        <div class="gap-pill-stat exist">
          <span class="num">${report.existing_skills_count}</span>
          <span class="lbl">Existing Skills</span>
        </div>
        <div class="gap-pill-stat crit">
          <span class="num">${report.missing_critical_count}</span>
          <span class="lbl">Critical Gaps</span>
        </div>
        <div class="gap-pill-stat opt">
          <span class="num">${report.missing_optional_count}</span>
          <span class="lbl">Good-to-Have Gaps</span>
        </div>
      </div>
    </div>

    <div class="gap-tables-grid">
      <!-- Existing Competencies Table -->
      <div class="card">
        <div class="card-header">
          <h3>Existing Competencies (${report.existing_skills.length})</h3>
          <span class="badge badge-green">Verified</span>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="gap-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Type</th>
                <th>Proficiency</th>
              </tr>
            </thead>
            <tbody>
              ${report.existing_skills.map(s => `
                <tr>
                  <td><strong>${s.name}</strong></td>
                  <td><span class="badge ${s.type.includes('Critical') ? 'badge-blue' : 'badge-gray'}">${s.type}</span></td>
                  <td>${s.student_level} (${Math.round(s.proficiency_score * 100)}%)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Missing Skills Diagnostic Table -->
      <div class="card">
        <div class="card-header">
          <h3>Missing Skill Deficiencies</h3>
          <span class="badge badge-red">Attention Required</span>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="gap-table">
            <thead>
              <tr>
                <th>Deficient Skill</th>
                <th>Severity</th>
                <th>Est. Time</th>
              </tr>
            </thead>
            <tbody>
              ${report.missing_critical.map(m => `
                <tr>
                  <td>
                    <strong>${m.name}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${m.category}</div>
                  </td>
                  <td><span class="badge badge-red">${m.severity}</span></td>
                  <td>${m.estimated_weeks} Weeks</td>
                </tr>
              `).join('')}
              ${report.missing_optional.map(m => `
                <tr>
                  <td>
                    <strong>${m.name}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${m.category}</div>
                  </td>
                  <td><span class="badge badge-amber">${m.severity}</span></td>
                  <td>${m.estimated_weeks} Weeks</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div style="margin-top:1.5rem; text-align:center;">
      <button class="btn btn-primary" onclick="viewRoleRoadmap('${document.getElementById('selectGapRole').value}')">
        🚀 Generate Dynamic Learning Roadmap for this Gap
      </button>
    </div>
  `;
}

// 6. Internship Matching API
async function loadJobMatches() {
  try {
    const res = await fetch('/api/analyze/internships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    });
    const data = await res.json();
    state.jobs = data.matches || [];
    filterJobs();
  } catch (err) {
    console.error("Job matches error:", err);
  }
}

function filterJobs() {
  const domain = document.getElementById('filterJobDomain').value;
  const minScore = parseInt(document.getElementById('filterMinScore').value) || 0;

  const filtered = state.jobs.filter(job => {
    const domainMatch = domain === 'All' || job.domain === domain;
    const scoreMatch = job.match_score >= minScore;
    return domainMatch && scoreMatch;
  });

  const container = document.getElementById('jobsContainer');
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding:2rem;">No internships match the selected filter criteria.</p>`;
    return;
  }

  filtered.forEach(job => {
    const badgeClass = job.match_score >= 80 ? 'high' : job.match_score >= 60 ? 'med' : 'low';
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-main-info">
        <div class="job-company-row">
          <span class="job-company-name">${job.company}</span>
          <span class="job-location">📍 ${job.location}</span>
          <span class="badge badge-purple">${job.type}</span>
          ${job.cgpa_eligible ? '<span class="badge badge-green">✓ CGPA Eligible</span>' : '<span class="badge badge-amber">CGPA Below Benchmark</span>'}
        </div>
        <h3 class="job-card-title">${job.title}</h3>
        <p class="job-desc-snippet">${job.description}</p>
        <div class="job-skills-overlap">
          <strong style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); margin-right:0.3rem;">Skills Matched:</strong>
          ${job.matched_skills.map(s => `<span class="badge badge-green" style="margin:2px;">${s}</span>`).join(' ')}
          ${job.missing_skills.length > 0 ? `<strong style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); margin:0 0.3rem 0 0.6rem;">Missing:</strong> ${job.missing_skills.map(s => `<span class="badge badge-red" style="margin:2px;">${s}</span>`).join(' ')}` : ''}
        </div>
      </div>
      <div class="job-side-actions">
        <div class="job-match-badge ${badgeClass}">
          <span>${job.match_score}%</span> Match
        </div>
        <button class="btn btn-primary btn-sm" onclick="sprintRoadmapForJob('${job.id}')">Bridging Sprint</button>
        <a href="${job.apply_url}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none;">View Posting &rarr;</a>
      </div>
    `;
    container.appendChild(card);
  });
}

window.sprintRoadmapForJob = (jobId) => {
  switchTab('tab-roadmap');
  generateRoadmap(null, jobId);
};

// 7. Dynamic Personalized Roadmap API
async function generateRoadmap(targetRoleId, customJobId) {
  const roleId = targetRoleId || document.getElementById('selectRoadmapRole').value;
  try {
    const res = await fetch('/api/analyze/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, target_role_id: roleId, job_id: customJobId })
    });
    const data = await res.json();
    state.roadmap = data.roadmap;
    renderRoadmap(data.roadmap);
  } catch (err) {
    console.error("Roadmap generation error:", err);
  }
}

function renderRoadmap(roadmap) {
  const container = document.getElementById('roadmapContentContainer');
  let phasesHtml = '';

  roadmap.phases.forEach(phase => {
    let contentHtml = '';

    if (phase.skills && phase.skills.length > 0) {
      contentHtml = `
        <div class="roadmap-skills-grid">
          ${phase.skills.map(s => `
            <div class="roadmap-skill-item">
              <div class="skill-header-row">
                <h5>${s.skill}</h5>
                <span class="badge badge-purple">${s.duration}</span>
              </div>
              <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.5rem;">
                <strong>Category:</strong> ${s.category || 'Core Skill'} • <strong>Difficulty:</strong> ${s.difficulty || 'Intermediate'}
              </p>
              <div style="margin-bottom:0.6rem;">
                <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Curated Learning Resources:</div>
                ${(s.resources || []).map(r => `
                  <div>
                    <a href="${r.url}" target="_blank" class="roadmap-resource-link">
                      ↗ ${r.name} <span class="badge badge-gray" style="font-size:0.65rem;">${r.type}</span>
                    </a>
                  </div>
                `).join('')}
              </div>
              <div style="background:#f8fafc; padding:0.5rem; border-radius:4px; font-size:0.8rem; margin-top:0.4rem;">
                <strong>Hands-on Project:</strong> ${s.hands_on_project || 'Build end-to-end implementation.'}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (phase.portfolio_projects) {
      contentHtml += `
        <h5 style="margin-top:1.25rem; font-size:0.95rem; font-weight:800;">Recommended Capstone Showcase Projects:</h5>
        <div class="grid-2col" style="margin-top:0.5rem;">
          ${phase.portfolio_projects.map(p => `
            <div class="project-item">
              <h4>${p.title}</h4>
              <p>${p.description}</p>
              <div style="font-size:0.8rem; color:var(--primary); font-weight:600;">Deliverables:</div>
              <ul style="font-size:0.78rem; color:var(--text-muted); margin-left:1.25rem;">
                ${p.deliverables.map(d => `<li>${d}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>

        <h5 style="margin-top:1.25rem; font-size:0.95rem; font-weight:800;">Recommended Industry Certifications:</h5>
        <div class="grid-2col" style="margin-top:0.5rem;">
          ${phase.certifications.map(c => `
            <div class="cert-item">
              <h4>${c.name}</h4>
              <p><strong>Provider:</strong> ${c.provider} • <strong>Prep Time:</strong> ${c.preparation_time}</p>
              <p style="font-size:0.8rem; color:var(--text-muted);">${c.strategic_value}</p>
            </div>
          `).join('')}
        </div>

        <h5 style="margin-top:1.25rem; font-size:0.95rem; font-weight:800;">Placement Action Checklist:</h5>
        <ul style="font-size:0.85rem; color:var(--text-main); margin-left:1.25rem; margin-top:0.35rem;">
          ${phase.action_checklist.map(item => `<li style="margin-bottom:0.35rem;">${item}</li>`).join('')}
        </ul>
      `;
    }

    phasesHtml += `
      <div class="roadmap-phase-card">
        <div class="phase-header">
          <div class="phase-title-group">
            <h4>${phase.title}</h4>
          </div>
          <span class="phase-timeline-badge">${phase.timeline}</span>
        </div>
        <div class="phase-body">
          <p class="phase-objective">${phase.objective}</p>
          ${contentHtml}
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="gap-score-overview" style="margin-bottom:1.5rem;">
      <div>
        <h3 style="font-size:1.3rem; font-weight:800;">Personalized Career Sprint for ${roadmap.target_role_title}</h3>
        <p class="text-muted">Total Roadmap Horizon: <strong>${roadmap.total_estimated_weeks} Weeks</strong> • Current Readiness: <strong>${roadmap.current_match_score}%</strong></p>
      </div>
      <div>
        <span class="badge badge-purple" style="font-size:0.9rem; padding:0.5rem 1rem;">
          ${roadmap.skill_gap_summary.missing_critical} Critical Skills to Bridge
        </span>
      </div>
    </div>
    <div class="roadmap-timeline">
      ${phasesHtml}
    </div>
  `;
}

// 8. Custom JD Submission API
async function submitCustomJd() {
  const payload = {
    title: document.getElementById('jdTitle').value,
    company: document.getElementById('jdCompany').value,
    location: document.getElementById('jdLocation').value,
    type: document.getElementById('jdType').value,
    min_cgpa: document.getElementById('jdMinCgpa').value,
    jd_text: document.getElementById('jdRawText').value
  };

  try {
    const res = await fetch('/api/jobs/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      const resultBox = document.getElementById('customJdResult');
      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:1.25rem; border-radius:8px;">
          <h4 style="color:#065f46; margin-bottom:0.4rem;">✓ Job Description Analyzed & Ingested!</h4>
          <p style="font-size:0.88rem; color:#047857; margin-bottom:0.6rem;">
            Extracted <strong>${data.extracted_skills.length} technical skills</strong> from this custom posting.
          </p>
          <div style="margin-bottom:0.85rem;">
            ${data.extracted_skills.map(s => `<span class="badge badge-green" style="margin:2px;">${s}</span>`).join(' ')}
          </div>
          <button class="btn btn-primary btn-sm" onclick="switchTab('tab-jobs')">View in Internship Matcher &rarr;</button>
        </div>
      `;
      showToast("Custom JD ingested successfully!");
      document.getElementById('customJdForm').reset();
    }
  } catch (err) {
    console.error("Custom JD error:", err);
    showToast("Error processing custom JD.");
  }
}

// 9. Dashboard Analytics Summary API
async function loadDashboardAnalytics() {
  try {
    const res = await fetch(`/api/analytics/summary?userId=${currentUserId}`);
    const data = await res.json();

    document.getElementById('kpiMatchScore').textContent = `${data.target_role_match}%`;
    document.getElementById('kpiTopRoleName').textContent = data.top_career ? data.top_career.role_name : 'AI / ML Engineer';
    document.getElementById('kpiSkillsCount').textContent = data.skills_count;
    document.getElementById('kpiMissingGaps').textContent = data.missing_critical_skills;
    document.getElementById('kpiJobsCount').textContent = data.suitable_internships_count;

    document.getElementById('dashTargetRole').textContent = data.top_career ? data.top_career.role_name : 'AI / ML Engineer';
    document.getElementById('dashMatchPercent').textContent = `${data.target_role_match}%`;

    // Preview lists
    const previewContainer = document.getElementById('dashTopRolesList');
    if (data.top_career) {
      previewContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem; background:#f8fafc; border-radius:8px; border:1px solid var(--border);">
          <div>
            <h4 style="font-size:1.05rem; font-weight:800;">${data.top_career.role_name}</h4>
            <div style="font-size:0.8rem; color:var(--text-muted);">${data.top_career.domain} • ${data.top_career.avg_salary}</div>
          </div>
          <div style="font-size:1.35rem; font-weight:800; color:var(--primary);">${data.top_career.match_score}%</div>
        </div>
      `;
    }

    const gapPreview = document.getElementById('dashSkillGapPreview');
    gapPreview.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.6rem;">
        <p style="font-size:0.88rem; color:var(--text-muted);">
          Your profile matches <strong>${data.target_role_match}%</strong> of standard requirements for <strong>${data.top_career ? data.top_career.role_name : 'your target role'}</strong>.
        </p>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge badge-red">${data.missing_critical_skills} Critical Skills Missing</span>
          <span class="badge badge-green">${data.skills_count} Existing Strengths</span>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Dashboard analytics error:", err);
  }
}
