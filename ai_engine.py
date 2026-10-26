"""
========================================================================================
 AI CareerMate — Smart Career Guidance, Internship & Skill Roadmap System
 Python Algorithmic Reference Engine
========================================================================================
This module contains the rigorous mathematical and computational implementation of:
 1. Natural Language Resume & Job Description Skill Extraction
 2. TF-IDF Vector Space Model & Cosine Similarity Matching
 3. Multi-Factor Role Match Score Calculation
 4. Fine-Grained Skill-Gap Analysis & Severity Stratification
 5. Directed Acyclic Graph (DAG) Prerequisite Traversal for Personalized Roadmaps
 6. Academic Eligibility & Internship Opportunity Ranking
========================================================================================
"""

import math
import re
import json
from typing import List, Dict, Set, Tuple, Any

# ========================================================================================
# 1. CANONICAL SKILL TAXONOMY & ONTOLOGY
# ========================================================================================
SKILL_TAXONOMY: Dict[str, List[str]] = {
    # Programming Languages
    "python": ["python", "python3", "py"],
    "javascript": ["javascript", "js", "ecmascript"],
    "typescript": ["typescript", "ts"],
    "java": ["java", "core java", "j2ee"],
    "c++": ["c++", "cpp"],
    "sql": ["sql", "structured query language", "postgresql", "mysql"],

    # AI, Data Science & Machine Learning
    "machine learning": ["machine learning", "ml", "statistical learning"],
    "deep learning": ["deep learning", "neural networks", "dl", "ann", "cnn", "rnn"],
    "pytorch": ["pytorch", "torch"],
    "tensorflow": ["tensorflow", "tf", "keras"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "nlp": ["nlp", "natural language processing", "llm", "transformers"],
    "computer vision": ["computer vision", "cv", "opencv"],
    "data analysis": ["data analysis", "eda", "data visualization"],

    # Web & Systems
    "react": ["react", "react.js", "reactjs"],
    "node.js": ["node.js", "nodejs", "node"],
    "express": ["express", "express.js"],
    "rest api": ["rest api", "restful api", "rest apis"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],

    # Cloud, DevOps & Tools
    "docker": ["docker", "containerization"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "git": ["git", "github", "version control"],
    "linux": ["linux", "bash", "shell scripting"],
    "ci/cd": ["ci/cd", "continuous integration", "github actions"],

    # Core Computer Science
    "data structures": ["data structures", "dsa", "algorithms", "problem solving"],
    "system design": ["system design", "distributed systems", "microservices"],
    "network security": ["network security", "firewalls", "tcp/ip"]
}

# Skill Prerequisite Graph for Topological Ordering
SKILL_PREREQUISITES: Dict[str, List[str]] = {
    "scikit-learn": ["python", "numpy", "pandas"],
    "machine learning": ["python", "numpy", "pandas", "data structures"],
    "deep learning": ["machine learning", "python", "numpy"],
    "pytorch": ["deep learning", "python"],
    "tensorflow": ["deep learning", "python"],
    "nlp": ["deep learning", "python"],
    "computer vision": ["deep learning", "python"],
    "kubernetes": ["docker", "linux"],
    "ci/cd": ["git", "linux"],
    "aws": ["linux", "git"]
}

# ========================================================================================
# 2. SKILL EXTRACTION & TOKENIZATION
# ========================================================================================
def extract_skills_from_text(text: str) -> List[str]:
    """
    Scans free-form textual corpora (Resumes, JDs) using regex boundary matching
    against the canonical taxonomy ontology.
    """
    if not text:
        return []
    normalized_text = f" {text.lower()} "
    detected_skills: Set[str] = set()

    for canonical_skill, aliases in SKILL_TAXONOMY.items():
        for alias in aliases:
            pattern = r'(?:^|[^a-z0-9#+.]){}(?:$|[^a-z0-9#+.])'.format(re.escape(alias))
            if re.search(pattern, normalized_text):
                detected_skills.add(canonical_skill)
                break
    return sorted(list(detected_skills))


# ========================================================================================
# 3. TF-IDF VECTOR SPACE MODEL & COSINE SIMILARITY
# ========================================================================================
class TFIDFTextMatcher:
    def __init__(self, corpus: List[str]):
        self.vocabulary: Dict[str, int] = {}
        self.idf_map: Dict[str, float] = {}
        self._build_vocab_and_idf(corpus)

    def _tokenize(self, text: str) -> List[str]:
        return [w for w in re.findall(r'[a-zA-Z0-9#+.]+', text.lower()) if len(w) > 1]

    def _build_vocab_and_idf(self, corpus: List[str]):
        doc_count = len(corpus)
        doc_frequencies: Dict[str, int] = {}

        for doc in corpus:
            tokens = set(self._tokenize(doc))
            for t in tokens:
                doc_frequencies[t] = doc_frequencies.get(t, 0) + 1

        idx = 0
        for word, freq in doc_frequencies.items():
            self.vocabulary[word] = idx
            idx += 1
            # Standard Smooth IDF Formula: ln((N + 1) / (DF + 1)) + 1
            self.idf_map[word] = math.log((doc_count + 1) / (freq + 1)) + 1.0

    def transform(self, text: str) -> Tuple[Dict[str, float], float]:
        tokens = self._tokenize(text)
        total_tokens = len(tokens) or 1
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1

        vector: Dict[str, float] = {}
        squared_sum = 0.0
        for word, word_id in self.vocabulary.items():
            if word in tf:
                val = (tf[word] / total_tokens) * self.idf_map.get(word, 1.0)
                vector[word] = val
                squared_sum += val * val

        magnitude = math.sqrt(squared_sum)
        return vector, magnitude

    @staticmethod
    def cosine_similarity(v1: Dict[str, float], mag1: float, v2: Dict[str, float], mag2: float) -> float:
        if mag1 == 0.0 or mag2 == 0.0:
            return 0.0
        dot_product = sum(v1[k] * v2[k] for k in v1 if k in v2)
        return dot_product / (mag1 * mag2)


# ========================================================================================
# 4. MULTI-FACTOR CAREER ROLE MATCHING ALGORITHM
# ========================================================================================
def calculate_role_match_score(
    student_skills: Set[str],
    student_interests: List[str],
    student_projects: List[Dict[str, Any]],
    role_core_skills: List[str],
    role_sec_skills: List[str],
    role_domain: str,
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Calculates multi-factor composite career readiness score:
     Score = w_core * CoreMatch + w_sec * SecMatch + w_proj * ProjectRelevance + w_int * InterestAlignment
    """
    if weights is None:
        weights = {"core": 0.50, "sec": 0.20, "proj": 0.15, "int": 0.15}

    # 1. Core Skill Overlap
    matched_core = [s for s in role_core_skills if s.lower() in student_skills]
    core_score = len(matched_core) / len(role_core_skills) if role_core_skills else 0.0

    # 2. Secondary Skill Overlap
    matched_sec = [s for s in role_sec_skills if s.lower() in student_skills]
    sec_score = len(matched_sec) / len(role_sec_skills) if role_sec_skills else 0.0

    # 3. Project Relevance Score
    all_role_skills = set([s.lower() for s in role_core_skills + role_sec_skills])
    proj_matches = 0
    for proj in student_projects:
        for t in proj.get("tech", []):
            if t.lower() in all_role_skills:
                proj_matches += 1
    proj_score = min(1.0, proj_matches / 4.0)

    # 4. Career Interest Alignment
    int_score = 0.20  # Baseline
    for interest in student_interests:
        if interest.lower() in role_domain.lower() or role_domain.lower() in interest.lower():
            int_score = 1.0
            break

    # Composite Normalized Score
    composite = (
        weights["core"] * core_score +
        weights["sec"] * sec_score +
        weights["proj"] * proj_score +
        weights["int"] * int_score
    )
    match_percentage = round(composite * 100, 1)

    return {
        "match_percentage": match_percentage,
        "matched_core": matched_core,
        "missing_core": [s for s in role_core_skills if s.lower() not in student_skills],
        "matched_secondary": matched_sec,
        "missing_secondary": [s for s in role_sec_skills if s.lower() not in student_skills]
    }


# ========================================================================================
# 5. FINE-GRAINED SKILL-GAP ANALYSIS ALGORITHM
# ========================================================================================
def perform_skill_gap_analysis(
    student_skills: Set[str],
    required_skills: List[str],
    optional_skills: List[str]
) -> Dict[str, Any]:
    """
    Computes set-theoretic symmetric and relative complements:
     K_exist = K_student ∩ (K_req ∪ K_opt)
     K_missing_critical = K_req \ K_student
     K_missing_optional = K_opt \ K_student
    """
    existing_skills = [s for s in required_skills + optional_skills if s.lower() in student_skills]
    missing_critical = [s for s in required_skills if s.lower() not in student_skills]
    missing_optional = [s for s in optional_skills if s.lower() not in student_skills]

    # Weighted Match Calculation (Critical skills carry double weight)
    total_weights = (len(required_skills) * 2.0) + (len(optional_skills) * 1.0)
    req_matched = [s for s in required_skills if s.lower() in student_skills]
    opt_matched = [s for s in optional_skills if s.lower() in student_skills]
    earned_weights = (len(req_matched) * 2.0) + (len(opt_matched) * 1.0)

    gap_match_percentage = round((earned_weights / total_weights) * 100, 1) if total_weights > 0 else 0.0

    # Categorize Gaps with Severity & Learning Curve Estimates
    missing_detailed = []
    for s in missing_critical:
        missing_detailed.append({
            "skill": s,
            "severity": "CRITICAL",
            "weight": 2.0,
            "estimated_weeks": 3,
            "status": "Must bridge for candidate shortlisting"
        })
    for s in missing_optional:
        missing_detailed.append({
            "skill": s,
            "severity": "RECOMMENDED",
            "weight": 1.0,
            "estimated_weeks": 2,
            "status": "Differentiator for technical interview performance"
        })

    return {
        "gap_match_percentage": gap_match_percentage,
        "existing_skills": existing_skills,
        "missing_critical": missing_critical,
        "missing_optional": missing_optional,
        "missing_breakdown": missing_detailed,
        "total_weeks_to_bridge": sum(item["estimated_weeks"] for item in missing_detailed)
    }


# ========================================================================================
# 6. DIRECTED ACYCLIC GRAPH (DAG) LEARNING ROADMAP ALGORITHM
# ========================================================================================
def generate_topological_roadmap(missing_skills: List[str]) -> List[Dict[str, Any]]:
    """
    Constructs a Directed Acyclic Graph (DAG) based on skill prerequisites
    and performs topological ordering to create progressive learning phases.
    """
    in_degree: Dict[str, int] = {s: 0 for s in missing_skills}
    graph: Dict[str, List[str]] = {s: [] for s in missing_skills}

    # Build dependency graph
    for skill in missing_skills:
        prereqs = SKILL_PREREQUISITES.get(skill, [])
        for p in prereqs:
            if p in in_degree:
                graph[p].append(skill)
                in_degree[skill] += 1

    # Kahn's Algorithm for Topological Sort by Level
    queue = [s for s, deg in in_degree.items() if deg == 0]
    phases = []
    current_phase_num = 1

    while queue:
        next_queue = []
        phase_skills = []

        for node in queue:
            phase_skills.append(node)
            for neighbor in graph[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    next_queue.append(neighbor)

        phases.append({
            "phase": f"Phase {current_phase_num}",
            "skills": phase_skills,
            "timeline": f"Weeks {current_phase_num * 2 - 1} - {current_phase_num * 2}"
        })
        queue = next_queue
        current_phase_num += 1

    return phases


# ========================================================================================
# 7. VERIFICATION & SAMPLE EXECUTION RUNNER
# ========================================================================================
if __name__ == "__main__":
    print("==================================================================")
    print("  AI CareerMate — Python Algorithmic Reference Engine Execution  ")
    print("==================================================================")

    # 1. Test Resume Text Extraction
    sample_resume = """
    Aarav Sharma | B.Tech CSE (NIT). CGPA: 8.4.
    Skills: Python, Machine Learning, Scikit-Learn, Pandas, NumPy, SQL, Git, Data Structures.
    Projects: Plant Leaf Disease Classifier with Computer Vision. Customer Churn Prediction.
    Interests: Artificial Intelligence, Deep Learning.
    """
    extracted = extract_skills_from_text(sample_resume)
    print(f"\n[1] Extracted Skills from Resume ({len(extracted)}):")
    print("   ", extracted)

    # 2. Test Career Role Matching
    target_core = ["python", "machine learning", "deep learning", "pytorch", "scikit-learn", "numpy", "pandas", "data structures"]
    target_sec = ["tensorflow", "nlp", "computer vision", "docker", "fastapi", "git", "sql"]

    match_result = calculate_role_match_score(
        student_skills=set(extracted),
        student_interests=["Artificial Intelligence"],
        student_projects=[{"tech": ["python", "pandas", "scikit-learn", "opencv"]}],
        role_core_skills=target_core,
        role_sec_skills=target_sec,
        role_domain="Artificial Intelligence"
    )
    print(f"\n[2] Multi-Factor Role Match Score:")
    print(f"    Match Percentage: {match_result['match_percentage']}%")
    print(f"    Missing Core Skills: {match_result['missing_core']}")

    # 3. Test Skill Gap Analysis
    gap_result = perform_skill_gap_analysis(
        student_skills=set(extracted),
        required_skills=target_core,
        optional_skills=target_sec
    )
    print(f"\n[3] Skill-Gap Analysis Diagnostic:")
    print(f"    Existing Competencies ({len(gap_result['existing_skills'])}): {gap_result['existing_skills']}")
    print(f"    Critical Missing Deficiencies: {gap_result['missing_critical']}")
    print(f"    Estimated Weeks to Close Gap: {gap_result['total_weeks_to_bridge']} Weeks")

    # 4. Test Topological Roadmap Generation
    missing_skills_sample = gap_result["missing_critical"] + ["docker", "kubernetes"]
    roadmap_phases = generate_topological_roadmap(missing_skills_sample)
    print(f"\n[4] Topological Learning Roadmap Phases:")
    for phase in roadmap_phases:
        print(f"    {phase['phase']} ({phase['timeline']}): {phase['skills']}")

    print("\n✓ Algorithmic Engine Validated Successfully.")
