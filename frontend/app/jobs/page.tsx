"use client";

import Link from "next/link";
import SearchBar from "@/components/jobs/SearchBar";
import JobList from "@/components/jobs/JobList";
import LoadingState from "@/components/jobs/LoadingState";
import EmptyState from "@/components/jobs/EmptyState";
import { useEffect, useMemo, useState } from "react";
import { getProfile, saveSavedJob, searchJobs } from "@/lib/api";

const storageKey = "careerpilot-profile-v1";
const savedJobsKey = "careerpilot-saved-jobs-v1";
const cvSeedKey = "careerpilot-cv-seed-v1";

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
  matchedSkills?: string[];
  missingSkills?: string[];
};

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

const fallbackProfile: ProfileData = {
  name: "Prince Akpabio",
  headline:
    "AI Founder | AI Product Engineer | AI Governance & Automation | Business Development Strategist",
  about:
    "AI founder, product builder, and business development professional with a Bachelor of Engineering in Petroleum Engineering. I build practical AI-powered products across AI governance, market intelligence, sales automation, fintech, and career technology. My work combines engineering thinking, product strategy, workflow automation, APIs, and commercial growth.",
  country: "Nigeria",
  preferredCountries: [
    "Nigeria",
    "United Kingdom",
    "Germany",
    "Switzerland",
    "Netherlands",
    "Ireland",
    "Sweden",
    "Norway",
    "Denmark",
    "Canada",
  ],
  education:
    "Bachelor of Engineering (B.Eng.) in Petroleum Engineering — Madonna University, Nigeria",
  certifications:
    "- GitHub Foundations Certificate\n- Google AI Essentials\n- NVIDIA Generative AI Explained — NVIDIA Deep Learning Institute",
  skills: [
    "Artificial Intelligence",
    "AI Agents",
    "AI Governance",
    "AI Verification",
    "Prompt Engineering",
    "Workflow Automation",
    "Product Strategy",
    "Business Development",
    "Python",
    "FastAPI",
    "Next.js",
    "TypeScript",
    "Git",
    "GitHub",
    "REST APIs",
    "LLMs",
    "CRM Automation",
    "SaaS Development",
  ],
  portfolio: ["VeriEdit AI", "VeriTrade AI", "CallCatch", "CareerPilot AI"],
  targetRoles:
    "- AI Product Manager\n- Technical Product Manager\n- AI Solutions Engineer\n- AI Governance Specialist\n- Solutions Consultant\n- Business Development Manager\n- Growth and Partnerships Manager\n- Technical Account Manager\n- Product Operations\n- Founder in Residence",
  salary: "EUR 70,000–120,000, negotiable depending on role and location",
  visaSponsorship: "Yes for international relocation",
  workPreferences: [
    "Remote worldwide",
    "Nigeria-based opportunities",
    "Visa-sponsored relocation",
    "Hybrid after relocation",
  ],
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
    description:
      "Build AI product roadmaps, define governance standards, and work with engineering teams to ship trusted AI experiences.",
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
    description:
      "Lead AI risk review, verification frameworks, and policy-aligned product delivery.",
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
    description:
      "Drive product strategy, cross-functional execution, and workflow automation for AI-enabled software.",
    saved: false,
  },
  {
    id: "ashby-solutions-consultant",
    company: "Mosaic Intelligence",
    title: "Solutions Consultant",
    location: "Amsterdam, Netherlands",
    remote: true,
    visaSponsorship: "Yes",
    source: "Ashby",
    salary: "€75,000 - €95,000",
    matchScore: 86,
    description:
      "Work with customers to position AI governance, automation, and product strategy solutions.",
    saved: false,
  },
  {
    id: "wellfound-growth-partnerships",
    company: "Crest AI",
    title: "Growth and Partnerships Manager",
    location: "Remote - Global",
    remote: true,
    visaSponsorship: "Likely",
    source: "Wellfound",
    salary: "$100,000 - $130,000",
    matchScore: 84,
    description:
      "Own partnerships, growth strategy, and commercial expansion for AI product platforms.",
    saved: false,
  },
  {
    id: "remoteok-ai-solutions-engineer",
    company: "Signal Forge",
    title: "AI Solutions Engineer",
    location: "Remote - US",
    remote: true,
    visaSponsorship: "Possible",
    source: "RemoteOK",
    salary: "$110,000 - $140,000",
    matchScore: 82,
    description:
      "Design and deliver AI-enabled solutions with strong product and technical communication.",
    saved: false,
  },
];

function normalizeKeyword(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function calculateMatch(profile: ProfileData, description: string) {
  const keywords = normalizeKeyword(description).split(/\s+/).filter(Boolean);
  const profileText = [
    profile.headline,
    profile.about,
    profile.education,
    profile.certifications,
    profile.targetRoles,
    ...profile.skills,
    ...profile.portfolio,
  ]
    .join(" ")
    .toLowerCase();

  const matched = keywords.filter((keyword) => keyword.length > 2 && profileText.includes(keyword));
  const missing = keywords.filter((keyword) => keyword.length > 2 && !profileText.includes(keyword));
  const score = keywords.length ? Math.min(95, Math.round((matched.length / keywords.length) * 100)) : 0;
  return { score, matched: matched.slice(0, 6), missing: missing.slice(0, 6) };
}

export default function JobsPage() {
  const [profile, setProfile] = useState<ProfileData>(fallbackProfile);
  const [jobs, setJobs] = useState<JobRecord[]>(initialJobs);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [visaOnly, setVisaOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sortOrder, setSortOrder] = useState("match");

  useEffect(() => {
    const hydrate = async () => {
      if (typeof window === "undefined") return;

      try {
        const remoteProfile = await getProfile();
        if (remoteProfile) {
          setProfile({
            ...fallbackProfile,
            name: remoteProfile.full_name || fallbackProfile.name,
            headline: remoteProfile.professional_headline || fallbackProfile.headline,
            about: remoteProfile.about || fallbackProfile.about,
            country: remoteProfile.current_country || fallbackProfile.country,
            preferredCountries: remoteProfile.preferred_countries || fallbackProfile.preferredCountries,
            education: remoteProfile.education || fallbackProfile.education,
            certifications: remoteProfile.certifications || fallbackProfile.certifications,
            skills: remoteProfile.skills || fallbackProfile.skills,
            portfolio: remoteProfile.portfolio ? remoteProfile.portfolio.split("\n") : fallbackProfile.portfolio,
            targetRoles: remoteProfile.target_roles.join("\n") || fallbackProfile.targetRoles,
            salary: remoteProfile.salary_expectation || fallbackProfile.salary,
            visaSponsorship: remoteProfile.visa_sponsorship || fallbackProfile.visaSponsorship,
            workPreferences: remoteProfile.work_preferences || fallbackProfile.workPreferences,
            profileImage: remoteProfile.profile_image || fallbackProfile.profileImage,
          });
        }
      } catch {
        // ignore
      }

      try {
        const savedJobIds = window.localStorage.getItem(savedJobsKey);
        if (savedJobIds) {
          const parsedIds = JSON.parse(savedJobIds) as string[];
          setSavedJobs(parsedIds);
        }

        const storedJobs = window.localStorage.getItem("careerpilot-jobs-v1");
        if (storedJobs) {
          const parsedJobs = JSON.parse(storedJobs) as JobRecord[];
          setJobs(parsedJobs);
        }
      } catch {
        setProfile(fallbackProfile);
      }
    };

    void hydrate();
  }, []);

  const enrichedJobs = useMemo(() => {
    const sorted = [...jobs].sort((left, right) => {
      if (sortOrder === "newest") return (right.location?.length || 0) - (left.location?.length || 0);
      return right.matchScore - left.matchScore;
    });

    return sorted.map((job) => {
      const match = calculateMatch(
        profile,
        `${job.title} ${job.description}`,
      );

      return {
        ...job,
        matchScore: match.score,
        matchedSkills: match.matched,
        missingSkills: match.missing,
        saved: savedJobs.includes(job.id),
      };
    });
  }, [jobs, profile, savedJobs, sortOrder]);

  const handleSearch = async () => {
    setLoading(true);
    setSearchError("");
    try {
      const result = await searchJobs({ query, location, remote_only: remoteOnly, visa_sponsorship: visaOnly, page: 1, limit: 12 });
      const mapped = result.results.map((job: any, index: number) => ({
        id: `${job.source}-${job.external_id || index}`,
        company: job.company,
        title: job.title,
        location: job.location,
        remote: job.remote_type === "remote",
        visaSponsorship: job.visa_sponsorship,
        source: job.source,
        salary: job.salary || "",
        matchScore: job.match_score || 0,
        description: job.description,
        saved: false,
      }));
      setJobs(mapped.length ? mapped : initialJobs);
      setSearchError(result.errors.join(" "));
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
      setJobs(initialJobs);
    } finally {
      setLoading(false);
    }
  };

  const saveJob = async (job: JobRecord) => {
    const nextSaved = savedJobs.includes(job.id) ? savedJobs : [...savedJobs, job.id];
    setSavedJobs(nextSaved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(savedJobsKey, JSON.stringify(nextSaved));
    }

    try {
      await saveSavedJob({
        external_id: job.id,
        company: job.company,
        job_title: job.title,
        location: job.location,
        remote_type: job.remote ? "remote" : "hybrid",
        visa_sponsorship: job.visaSponsorship,
        salary: job.salary,
        source: job.source,
        source_url: `https://example.com/${job.source.toLowerCase()}/${job.id}`,
        job_description: job.description,
        match_score: job.matchScore,
        published_at: new Date().toISOString(),
      });
    } catch {
      // Keep the client-side persistence even if the API call fails.
    }
  };

  const seedCv = (job: JobRecord) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(cvSeedKey, JSON.stringify({ jobTitle: job.title, companyName: job.company, jobDescription: `${job.title} — ${job.description}` }));
  };

  const highMatchJobs = enrichedJobs.filter((job) => job.matchScore >= 85).length;
  const applicationsReady = enrichedJobs.filter((job) => job.matchScore >= 85).length;

  return (
    <main className="jobsPage">
      <section className="jobsHero">
        <div className="jobsHeroContent">
          <div>
            <p className="eyebrow">CareerPilot AI</p>
            <h1>Job discovery</h1>
            <p>Discover opportunities from LinkedIn, Greenhouse, Lever, Ashby, Wellfound, and RemoteOK with a local-first match engine.</p>
          </div>
          <div className="heroActions">
            <Link className="backButton" href="/dashboard">
              Back to dashboard
            </Link>
            <Link className="backButton alt" href="/cv-generator">
              Open CV Generator
            </Link>
          </div>
        </div>
      </section>

      <section className="jobsCard">
        <div className="statsGrid">
          <article className="statCard">
            <span>Total jobs found</span>
            <strong>{enrichedJobs.length}</strong>
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
            <strong>{applicationsReady}</strong>
          </article>
        </div>

        <SearchBar
          query={query}
          location={location}
          remoteOnly={remoteOnly}
          visaOnly={visaOnly}
          sortOrder={sortOrder}
          loading={loading}
          onQueryChange={setQuery}
          onLocationChange={setLocation}
          onRemoteToggle={() => setRemoteOnly((value) => !value)}
          onVisaToggle={() => setVisaOnly((value) => !value)}
          onSortChange={setSortOrder}
          onSearch={() => void handleSearch()}
        />

        {searchError ? <p className="notice">{searchError}</p> : null}

        {loading ? <LoadingState /> : null}

        {!loading && enrichedJobs.length === 0 ? <EmptyState /> : null}

        {!loading && enrichedJobs.length > 0 ? (
          <JobList
            jobs={enrichedJobs}
            onSave={(selectedJob) => void saveJob(selectedJob)}
            onGenerateCv={seedCv}
          />
        ) : null}
      </section>

      <style jsx global>{`
        :root { color-scheme: dark; }
        body { margin: 0; background: linear-gradient(135deg, #07111f 0%, #0f203a 100%); color: #f3f7ff; }
        .jobsPage { min-height: 100vh; padding: 24px; background: linear-gradient(135deg, #07111f 0%, #0f203a 100%); }
        .jobsHero { max-width: 1280px; margin: 0 auto 24px; padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(7,17,31,0.82); box-shadow: 0 22px 60px rgba(1,6,15,0.35); }
        .jobsHeroContent { display: flex; justify-content: space-between; gap: 20px; align-items: center; flex-wrap: wrap; }
        .eyebrow { display: inline-block; margin-bottom: 8px; color: #6bb7ff; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; }
        .jobsHero h1 { margin: 0 0 10px; font-size: clamp(1.8rem, 3vw, 2.4rem); }
        .jobsHero p { margin: 0; color: #9eb0c9; max-width: 760px; line-height: 1.65; }
        .heroActions { display: flex; gap: 10px; flex-wrap: wrap; }
        .backButton, .primaryButton, .secondaryButton { display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 999px; padding: 10px 16px; text-decoration: none; font-weight: 700; cursor: pointer; }
        .backButton { background: #f3f7ff; color: #07111f; }
        .backButton.alt { background: rgba(255,255,255,0.08); color: #dce9ff; }
        .primaryButton { background: linear-gradient(135deg, #2563eb, #2f7de3); color: white; }
        .secondaryButton { background: rgba(255,255,255,0.08); color: #dce9ff; }
        .jobsCard { max-width: 1280px; margin: 0 auto; padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(13,27,45,0.92); box-shadow: 0 24px 70px rgba(0,0,0,0.28); }
        .statsGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
        .statCard { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
        .searchPanel { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 16px; align-items: center; }
        .searchPanel input, .searchPanel select { width: 100%; border: 1px solid rgba(255,255,255,0.13); border-radius: 12px; padding: 10px 12px; background: rgba(7,17,31,0.75); color: #f3f7ff; }
        .filterToggle { display: flex; align-items: center; gap: 8px; color: #dce9ff; }
        .notice { margin: 0 0 14px; color: #fda4af; }
        .emptyState, .loadingState { padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.04); color: #9eb0c9; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.07); }
        .emptyState strong, .loadingState strong { display: block; color: #f3f7ff; margin-bottom: 6px; }
        .emptyState p, .loadingState p { margin: 0; line-height: 1.55; }
        .loadingState { display: flex; align-items: center; gap: 14px; }
        .loadingSpinner { width: 22px; height: 22px; flex: 0 0 auto; border-radius: 999px; border: 3px solid rgba(107,183,255,0.22); border-top-color: #6bb7ff; animation: careerpilot-spin 0.8s linear infinite; }
        @keyframes careerpilot-spin { to { transform: rotate(360deg); } }
        .statCard span { display: block; color: #9eb0c9; margin-bottom: 8px; }
        .statCard strong { font-size: 1.6rem; }
        .jobList { display: grid; gap: 14px; }
        .jobCard { padding: 18px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .jobTop { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
        .sourceLabel { margin: 0 0 6px; color: #6bb7ff; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.16em; }
        .jobCard h3 { margin: 0 0 6px; font-size: 1.1rem; }
        .companyLine { margin: 0; color: #9eb0c9; }
        .matchBadge { min-width: 74px; padding: 10px 14px; border-radius: 16px; background: linear-gradient(145deg, rgba(107,183,255,0.22), rgba(37,99,235,0.16)); border: 1px solid rgba(107,183,255,0.26); color: #dff0ff; text-align: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08); }
        .matchBadge span { display: block; font-size: 1.15rem; font-weight: 850; line-height: 1; }
        .matchBadge small { display: block; margin-top: 4px; color: #9ecdf7; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; }
        .jobDescription { margin: 12px 0; color: #dce9ff; line-height: 1.6; }
        .metaRow { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .metaRow span { padding: 8px 10px; border-radius: 999px; background: rgba(255,255,255,0.06); color: #dce9ff; font-size: 0.92rem; }
        .matchInsights { margin: 6px 0 18px; padding: 18px; border-radius: 20px; background: radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 34%), linear-gradient(145deg, rgba(17,35,58,0.96), rgba(9,22,39,0.96)); border: 1px solid rgba(107,183,255,0.2); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(0,0,0,0.18); }
        .matchInsightsHeader { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 16px; }
        .insightEyebrow { display: block; color: #6bb7ff; font-size: 0.7rem; font-weight: 850; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 5px; }
        .matchInsights h4 { margin: 0; font-size: 1.05rem; color: #f8fbff; }
        .insightStatus { flex: 0 0 auto; padding: 7px 11px; border-radius: 999px; background: rgba(74,222,128,0.12); color: #bbf7d0; border: 1px solid rgba(74,222,128,0.16); font-size: 0.76rem; font-weight: 800; }
        .intelligenceGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
        .scorePanel { padding: 14px; border-radius: 16px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.07); }
        .scoreLabelRow { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 9px; }
        .scoreLabelRow span { color: #9eb0c9; font-size: 0.82rem; }
        .scoreLabelRow strong { color: #f5f9ff; font-size: 1rem; }
        .scoreTrack { height: 8px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,0.07); }
        .scoreTrack span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2563eb, #6bb7ff); transition: width 0.45s ease; }
        .recruiterTrack span { background: linear-gradient(90deg, #0f9f6e, #63e6be); }
        .scorePanel p { margin: 9px 0 0; color: #b8c7da; font-size: 0.78rem; line-height: 1.45; }
        .insightColumns { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.65fr); gap: 16px; padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .columnLabel { display: block; color: #9eb0c9; font-size: 0.74rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 9px; }
        .strengthList { margin: 0; padding-left: 19px; color: #dce9ff; line-height: 1.55; font-size: 0.9rem; }
        .strengthList li + li { margin-top: 5px; }
        .skillGapTags { display: flex; gap: 7px; flex-wrap: wrap; }
        .skillGapTags span { padding: 7px 10px; border-radius: 999px; background: rgba(251,191,36,0.1); color: #fde68a; border: 1px solid rgba(251,191,36,0.16); font-size: 0.8rem; font-weight: 700; }
        .noGapMessage { margin: 0; color: #bbf7d0; font-size: 0.85rem; }
        .marketSignal { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
        .marketSignal div { padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .marketSignal span { display: block; color: #8ea2bb; font-size: 0.72rem; margin-bottom: 5px; }
        .marketSignal strong { color: #eef6ff; font-size: 0.86rem; }
        .aiRecommendation { display: flex; gap: 11px; align-items: flex-start; margin-top: 14px; padding: 14px; border-radius: 16px; background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.09)); border: 1px solid rgba(167,139,250,0.18); }
        .recommendationIcon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 10px; background: rgba(167,139,250,0.16); color: #ddd6fe; }
        .aiRecommendation p { margin: 0; color: #dce9ff; line-height: 1.55; font-size: 0.88rem; }
        .actionsRow { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 900px) { .statsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .searchPanel { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 700px) { .intelligenceGrid, .insightColumns, .marketSignal { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .jobsPage { padding: 14px; } .jobsHero, .jobsCard { padding: 18px; } .statsGrid { grid-template-columns: 1fr; } .jobTop { flex-direction: column; } .searchPanel { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}