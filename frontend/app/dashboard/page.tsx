"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const savedJobsKey = "careerpilot-saved-jobs-v1";
const profileKey = "careerpilot-profile-v1";
const jobsKey = "careerpilot-jobs-v1";

type ProfileData = {
  name: string;
  headline: string;
  about: string;
  country: string;
  preferredCountries: string[];
  education: string;
  certifications: string;
  skills: string[];
  portfolio: string[];
  targetRoles: string;
  salary: string;
  visaSponsorship: string;
  workPreferences: string[];
  profileImage: string | null;
};

type JobRecord = {
  id: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  visaSponsorship: string;
  source: string;
  salary: string;
  matchScore: number;
  description: string;
  saved: boolean;
};

const fallbackProfile: ProfileData = {
  name: "Prince Akpabio",
  headline: "AI Founder | AI Product Engineer | AI Governance & Automation | Business Development Strategist",
  about: "AI founder, product builder, and business development professional with a Bachelor of Engineering in Petroleum Engineering.",
  country: "Nigeria",
  preferredCountries: ["Nigeria", "United Kingdom", "Germany", "Switzerland", "Netherlands", "Ireland", "Sweden", "Norway", "Denmark", "Canada"],
  education: "Bachelor of Engineering (B.Eng.) in Petroleum Engineering — Madonna University, Nigeria",
  certifications: "- GitHub Foundations Certificate\n- Google AI Essentials\n- NVIDIA Generative AI Explained — NVIDIA Deep Learning Institute",
  skills: ["Artificial Intelligence", "AI Governance", "Prompt Engineering", "Workflow Automation", "Product Strategy", "Business Development"],
  portfolio: ["VeriEdit AI", "VeriTrade AI", "CallCatch", "CareerPilot AI"],
  targetRoles: "- AI Product Manager\n- Technical Product Manager\n- AI Governance Specialist",
  salary: "EUR 70,000–120,000, negotiable depending on role and location",
  visaSponsorship: "Yes for international relocation",
  workPreferences: ["Remote worldwide", "Hybrid after relocation", "Visa-sponsored relocation"],
  profileImage: null,
};

const initialJobs: JobRecord[] = [
  {
    id: "linkedin-ai-product-manager",
    company: "Northstar Labs",
    title: "AI Product Manager",
    location: "London, UK",
    remote: true,
    visaSponsorship: "Likely",
    source: "LinkedIn",
    salary: "£95,000 - £120,000",
    matchScore: 94,
    description: "Build AI product roadmaps, define governance standards, and work with engineering teams to ship trusted AI experiences.",
    saved: false,
  },
  {
    id: "greenhouse-ai-governance",
    company: "Aster AI",
    title: "AI Governance Specialist",
    location: "Berlin, Germany",
    remote: false,
    visaSponsorship: "Yes",
    source: "Greenhouse",
    salary: "€80,000 - €100,000",
    matchScore: 91,
    description: "Lead AI risk review, verification frameworks, and policy-aligned product delivery.",
    saved: false,
  },
  {
    id: "lever-technical-product",
    company: "Vertex Systems",
    title: "Technical Product Manager",
    location: "Remote - Europe",
    remote: true,
    visaSponsorship: "Likely",
    source: "Lever",
    salary: "€85,000 - €110,000",
    matchScore: 88,
    description: "Drive product strategy, cross-functional execution, and workflow automation for AI-enabled software.",
    saved: false,
  },
];

function normalizeKeyword(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function calculateProfileCompletion(profile: ProfileData) {
  const values = [
    profile.name,
    profile.headline,
    profile.about,
    profile.country,
    profile.education,
    profile.certifications,
    profile.skills.join(" "),
    profile.portfolio.join(" "),
    profile.targetRoles,
    profile.salary,
    profile.visaSponsorship,
    profile.workPreferences.join(" "),
  ];
  const filled = values.filter((value) => value && value.trim().length > 0).length;
  return Math.round((filled / values.length) * 100);
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileData>(fallbackProfile);
  const [jobs, setJobs] = useState<JobRecord[]>(initialJobs);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedProfile = window.localStorage.getItem(profileKey);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as Partial<ProfileData>;
        setProfile({ ...fallbackProfile, ...parsed });
      }

      const savedJobIds = window.localStorage.getItem(savedJobsKey);
      if (savedJobIds) {
        const parsedIds = JSON.parse(savedJobIds) as string[];
        setSavedJobs(parsedIds);
      }

      const persistedJobs = window.localStorage.getItem(jobsKey);
      if (persistedJobs) {
        const parsedJobs = JSON.parse(persistedJobs) as JobRecord[];
        setJobs(parsedJobs);
      }
    } catch {
      setProfile(fallbackProfile);
    }
  }, []);

  const profileCompletion = useMemo(() => calculateProfileCompletion(profile), [profile]);
  const highMatchJobs = useMemo(() => jobs.filter((job) => job.matchScore >= 85).length, [jobs]);
  const visaMatches = useMemo(() => jobs.filter((job) => /likely|yes/i.test(job.visaSponsorship)).length, [jobs]);
  const recentActivity = useMemo(() => {
    const items = [
      `${jobs.length} jobs discovered`,
      `${savedJobs.length} jobs saved`,
      `Profile ${profileCompletion}% complete`,
    ];
    return items;
  }, [jobs.length, savedJobs.length, profileCompletion]);

  return (
    <main className="dashboardPage">
      <section className="dashboardHero">
        <div className="dashboardHeroContent">
          <div>
            <p className="eyebrow">CareerPilot AI</p>
            <h1>Opportunity dashboard</h1>
            <p>Monitor high-match roles, saved opportunities, and your profile readiness in one place.</p>
          </div>
          <div className="heroActions">
            <Link className="backButton" href="/jobs">Open jobs</Link>
            <Link className="backButton alt" href="/cv-generator">Open CV generator</Link>
          </div>
        </div>
      </section>

      <section className="dashboardCard">
        <div className="statsGrid">
          <article className="statCard">
            <span>Total jobs found</span>
            <strong>{jobs.length}</strong>
          </article>
          <article className="statCard">
            <span>Saved jobs</span>
            <strong>{savedJobs.length}</strong>
          </article>
          <article className="statCard">
            <span>High match jobs</span>
            <strong>{highMatchJobs}</strong>
          </article>
          <article className="statCard">
            <span>Applications ready</span>
            <strong>{highMatchJobs}</strong>
          </article>
        </div>

        <div className="gridTwo">
          <section className="panel">
            <div className="panelHeader">
              <h2>Profile completion</h2>
              <span className="pill">{profileCompletion}%</span>
            </div>
            <p>{profile.name} has a strong foundation across product, AI, and growth-related experience.</p>
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h2>Recent activity</h2>
            </div>
            <ul className="activityList">
              {recentActivity.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel">
          <div className="panelHeader">
            <h2>High match opportunities</h2>
          </div>
          <div className="jobList">
            {jobs.map((job) => (
              <article className="jobRow" key={job.id}>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.location}</p>
                </div>
                <div className="jobMeta">
                  <span>{job.matchScore}% match</span>
                  <span>{job.visaSponsorship}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <style jsx global>{`
        :root { color-scheme: dark; }
        body { margin: 0; background: linear-gradient(135deg, #07111f 0%, #0f203a 100%); color: #f3f7ff; }
        .dashboardPage { min-height: 100vh; padding: 24px; background: linear-gradient(135deg, #07111f 0%, #0f203a 100%); }
        .dashboardHero { max-width: 1280px; margin: 0 auto 24px; padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(7,17,31,0.82); box-shadow: 0 22px 60px rgba(1,6,15,0.35); }
        .dashboardHeroContent { display: flex; justify-content: space-between; gap: 20px; align-items: center; flex-wrap: wrap; }
        .eyebrow { display: inline-block; margin-bottom: 8px; color: #6bb7ff; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; }
        .dashboardHero h1 { margin: 0 0 10px; font-size: clamp(1.8rem, 3vw, 2.4rem); }
        .dashboardHero p { margin: 0; color: #9eb0c9; max-width: 760px; line-height: 1.65; }
        .heroActions { display: flex; gap: 10px; flex-wrap: wrap; }
        .backButton { display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 999px; background: #f3f7ff; color: #07111f; font-weight: 700; text-decoration: none; }
        .backButton.alt { background: rgba(255,255,255,0.08); color: #dce9ff; }
        .dashboardCard { max-width: 1280px; margin: 0 auto; padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(13,27,45,0.92); box-shadow: 0 24px 70px rgba(0,0,0,0.28); }
        .statsGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
        .statCard { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
        .statCard span { display: block; color: #9eb0c9; margin-bottom: 8px; }
        .statCard strong { font-size: 1.6rem; }
        .gridTwo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .panel { padding: 18px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .panelHeader { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
        .panel h2 { margin: 0; font-size: 1.05rem; }
        .pill { padding: 8px 12px; border-radius: 999px; background: rgba(107,183,255,0.16); color: #dff0ff; font-weight: 700; }
        .activityList { margin: 0; padding-left: 18px; color: #dce9ff; line-height: 1.7; }
        .jobList { display: grid; gap: 12px; }
        .jobRow { display: flex; justify-content: space-between; gap: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.04); }
        .jobRow h3 { margin: 0 0 6px; }
        .jobRow p { margin: 0; color: #9eb0c9; }
        .jobMeta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .jobMeta span { padding: 8px 10px; border-radius: 999px; background: rgba(107,183,255,0.16); color: #dff0ff; font-size: 0.9rem; }
        @media (max-width: 900px) { .statsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .gridTwo { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .dashboardPage { padding: 14px; } .dashboardHero, .dashboardCard { padding: 18px; } .statsGrid { grid-template-columns: 1fr; } .jobRow { flex-direction: column; } }
      `}</style>
    </main>
  );
}
