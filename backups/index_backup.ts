import { Candidate } from "../types";

export const NAVIGATION_ITEMS = [
  { name: "Dashboard", href: "/", icon: "LayoutDashboard", isPage: true },
  { name: "Candidates", href: "/candidates", icon: "Users", isPage: true },
  { name: "Upload Resume", href: "/upload", icon: "UploadCloud", isPage: true },
  { name: "Assignments", href: "/assignments", icon: "FileSpreadsheet", isPage: false },
  { name: "Communication", href: "/communication", icon: "MessageSquare", isPage: false },
  { name: "Reports", href: "/reports", icon: "BarChart3", isPage: false },
  { name: "Settings", href: "/settings", icon: "Settings", isPage: false },
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "cand_1",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 123-4567",
    linkedin_url: "https://linkedin.com/in/alex-rivera-tech",
    github_url: "https://github.com/alexriveradev",
    status: "selected",
    skills: ["React", "TypeScript", "Next.js", "Node.js", "GraphQL", "Tailwind CSS"],
    education: ["B.S. in Computer Science - UT Austin"],
    experience: ["Senior Frontend Engineer at TechCorp (3 years)", "Software Engineer at DevStudio (2 years)"],
    certifications: ["AWS Certified Solutions Architect", "Next.js Certified Professional"],
    created_at: "2026-05-20T10:30:00Z"
  },
  {
    id: "cand_2",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 (555) 987-6543",
    linkedin_url: "https://linkedin.com/in/sarah-chen-codes",
    github_url: "https://github.com/schen-codes",
    status: "in_progress",
    skills: ["Python", "FastAPI", "Docker", "PostgreSQL", "Machine Learning", "PyTorch"],
    education: ["M.S. in Software Engineering - Stanford University"],
    experience: ["Backend Tech Lead at AI Labs (4 years)", "Data Engineer at CloudSolutions (2 years)"],
    certifications: ["TensorFlow Developer Certificate"],
    created_at: "2026-05-22T14:45:00Z"
  },
  {
    id: "cand_3",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    phone: "+1 (555) 246-8101",
    linkedin_url: "https://linkedin.com/in/marcus-vance-ops",
    github_url: "https://github.com/mvance-devops",
    status: "rejected",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Bash", "Python"],
    education: ["B.S. in Information Technology - Penn State"],
    experience: ["DevOps Architect at GlobalBank (5 years)", "Systems Administrator at EnterpriseIT (3 years)"],
    certifications: ["Certified Kubernetes Administrator (CKA)", "HashiCorp Certified Terraform Associate"],
    created_at: "2026-05-24T09:15:00Z"
  },
  {
    id: "cand_4",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    phone: "+1 (555) 369-1215",
    linkedin_url: "https://linkedin.com/in/elena-rostova-frontend",
    github_url: "https://github.com/erostova",
    status: "in_progress",
    skills: ["Vue.js", "JavaScript", "CSS3", "Sass", "Webpack", "State Management", "Jest"],
    education: ["B.A. in Web Design - London Academy of Arts"],
    experience: ["UI Developer at CreativeWeb (2 years)", "Junior Frontend Developer at AgencyX (1 year)"],
    certifications: ["Scrum Alliance Certified Product Owner"],
    created_at: "2026-05-25T16:20:00Z"
  }
];
