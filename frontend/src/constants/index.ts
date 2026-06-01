import { Candidate } from "../types";

export const NAVIGATION_ITEMS = [
  { name: "Dashboard", href: "/", icon: "LayoutDashboard", isPage: true },
  { name: "Candidates", href: "/candidates", icon: "Users", isPage: true },
  { name: "Job Openings", href: "/jobs", icon: "Briefcase", isPage: true },
  { name: "Upload Resume", href: "/upload", icon: "UploadCloud", isPage: true },
  { name: "Reminders", href: "/reminders", icon: "CalendarClock", isPage: true },
  { name: "Reports", href: "/reports", icon: "BarChart3", isPage: false },
  { name: "Settings", href: "/settings", icon: "Settings", isPage: false },
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "c0a80101-0000-0000-0000-000000000001",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 123-4567",
    linkedin_url: "https://linkedin.com/in/alex-rivera-tech",
    github_url: "https://github.com/alexriveradev",
    status: "selected",
    skills: ["React", "TypeScript", "Next.js", "Node.js", "GraphQL", "Tailwind CSS"],
    education: [
      { degree: "B.S. in Computer Science - UT Austin", level: "UG" }
    ],
    experience: [
      { company: "TechCorp", role: "Senior Frontend Engineer", years: "3" },
      { company: "DevStudio", role: "Software Engineer", years: "2" }
    ],
    certifications: ["AWS Certified Solutions Architect", "Next.js Certified Professional"],
    created_at: "2026-05-20T10:30:00Z"
  },
  {
    id: "c0a80101-0000-0000-0000-000000000002",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 (555) 987-6543",
    linkedin_url: "https://linkedin.com/in/sarah-chen-codes",
    github_url: "https://github.com/schen-codes",
    status: "in_progress",
    skills: ["Python", "FastAPI", "Docker", "PostgreSQL", "Machine Learning", "PyTorch"],
    education: [
      { degree: "M.S. in Software Engineering - Stanford University", level: "PG" }
    ],
    experience: [
      { company: "AI Labs", role: "Backend Tech Lead", years: "4" },
      { company: "CloudSolutions", role: "Data Engineer", years: "2" }
    ],
    certifications: ["TensorFlow Developer Certificate"],
    created_at: "2026-05-22T14:45:00Z"
  },
  {
    id: "c0a80101-0000-0000-0000-000000000003",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    phone: "+1 (555) 246-8101",
    linkedin_url: "https://linkedin.com/in/marcus-vance-ops",
    github_url: "https://github.com/mvance-devops",
    status: "rejected",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Bash", "Python"],
    education: [
      { degree: "B.S. in Information Technology - Penn State", level: "UG" }
    ],
    experience: [
      { company: "GlobalBank", role: "DevOps Architect", years: "5" },
      { company: "EnterpriseIT", role: "Systems Administrator", years: "3" }
    ],
    certifications: ["HashiCorp Certified Terraform Associate", "Certified Kubernetes Administrator (CKA)"],
    created_at: "2026-05-24T09:15:00Z"
  },
  {
    id: "c0a80101-0000-0000-0000-000000000004",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    phone: "+1 (555) 369-1215",
    linkedin_url: "https://linkedin.com/in/elena-rostova-frontend",
    github_url: "https://github.com/erostova",
    status: "in_progress",
    skills: ["Vue.js", "JavaScript", "CSS3", "Sass", "Webpack", "State Management", "Jest"],
    education: [
      { degree: "B.A. in Web Design - London Academy of Arts", level: "UG" }
    ],
    experience: [
      { company: "CreativeWeb", role: "UI Developer", years: "2" },
      { company: "AgencyX", role: "Junior Frontend Developer", years: "1" }
    ],
    certifications: ["Scrum Alliance Certified Product Owner"],
    created_at: "2026-05-25T16:20:00Z"
  }
];
