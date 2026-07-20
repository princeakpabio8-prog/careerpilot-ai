"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getGeneratedCvs, getProfile, saveGeneratedCv } from "@/lib/api";

const storageKey = "careerpilot-profile-v1";
const cvSeedKey = "careerpilot-cv-seed-v1";

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

const portfolioDescriptions: Record<string, string> = {
  "VeriEdit AI":
    "Builds trust infrastructure that helps organisations verify, audit, reconstruct and control AI-influenced decisions.",
  "VeriTrade AI":
    "Combines market intelligence, trading analytics, opportunity detection, AI-assisted trade decisions and automated execution through exchange APIs.",
  CallCatch:
    "Analyses public business information, identifies evidence-based growth opportunities, qualifies prospects and prepares personalised outreach with human approval.",
  "CareerPilot AI":
    "Discovers remote and visa-sponsored jobs, matches opportunities, generates tailored CVs and cover letters, and prepares approval-first applications.",
};

function normalizeKeyword(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractKeywords(text: string) {
  const words = normalizeKeyword(text).split(/\s+/).filter(Boolean);
  return Array.from(new Set(words.filter((word) => word.length > 2)));
}

function tailorDescription(description: string, keywords: string[], roleHint: string) {
  const intro = keywords.slice(0, 4).join(", ");
  if (!intro) return description;

  return `${description} Reframed for ${roleHint} responsibilities with emphasis on ${intro}.`;
}

export default function CvGeneratorPage() {
  const [profile, setProfile] = useState<ProfileData>(fallbackProfile);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [generatedCv, setGeneratedCv] = useState("");
  const [matchSummary, setMatchSummary] = useState({ percentage: 0, matched: [] as string[], missing: [] as string[] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedCvCount, setSavedCvCount] = useState(0);

  useEffect(() => {
    const hydrateProfile = async () => {
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
          return;
        }
      } catch {
        // fall back to local storage
      }

      try {
        const savedProfile = window.localStorage.getItem(storageKey);
        if (!savedProfile) {
          setProfile(fallbackProfile);
          return;
        }

        const parsed = JSON.parse(savedProfile) as Partial<ProfileData>;
        setProfile({
          ...fallbackProfile,
          ...parsed,
          preferredCountries: parsed.preferredCountries ?? fallbackProfile.preferredCountries,
          skills: parsed.skills ?? fallbackProfile.skills,
          portfolio: parsed.portfolio ?? fallbackProfile.portfolio,
          workPreferences: parsed.workPreferences ?? fallbackProfile.workPreferences,
        });
      } catch {
        setProfile(fallbackProfile);
      }
    };

    void hydrateProfile();

    if (typeof window !== "undefined") {
      const seed = window.localStorage.getItem(cvSeedKey);
      if (seed) {
        const parsed = JSON.parse(seed) as { jobTitle?: string; companyName?: string; jobDescription?: string };
        if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
      }
    }

    void getGeneratedCvs().then((cvs) => setSavedCvCount(cvs.length));
  }, []);

  const handleGenerate = () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      setGeneratedCv("");
      setMatchSummary({ percentage: 0, matched: [], missing: [] });
      return;
    }

    setError("");
    setIsGenerating(true);
    setCopied(false);

    window.setTimeout(() => {
      const keywords = extractKeywords(jobDescription);
      const profileText = [
        profile.headline,
        profile.about,
        profile.education,
        profile.certifications,
        profile.targetRoles,
        ...profile.skills,
        ...profile.portfolio.map((item) => portfolioDescriptions[item] ?? ""),
      ].join(" ");
      const normalizedProfile = normalizeKeyword(profileText);

      const matchedKeywords = keywords.filter((keyword) => normalizedProfile.includes(keyword));
      const missingKeywords = keywords.filter((keyword) => !normalizedProfile.includes(keyword));
      const matchScore = keywords.length
        ? Math.min(95, Math.round((matchedKeywords.length / keywords.length) * 100))
        : 0;

      const prioritizedSkills = profile.skills.filter((skill) => {
        const normalizedSkill = normalizeKeyword(skill);
        return keywords.some((keyword) => normalizedSkill.includes(keyword) || keyword.includes(normalizedSkill));
      });

      const selectedSkills = prioritizedSkills.length > 0 ? prioritizedSkills : profile.skills.slice(0, 8);

      const roleHint = jobTitle.trim() || "the target role";
      const tailoredProductPortfolio = profile.portfolio
        .filter((item) => Boolean(portfolioDescriptions[item]))
        .map((item) => {
          const description = portfolioDescriptions[item] ?? "";
          return `- ${item}: ${tailorDescription(description, keywords, roleHint)}`;
        })
        .join("\n");

      const summary = [
        "# Professional Summary",
        `${profile.name} is an AI founder, product builder, and business development professional with a strong record of aligning AI governance, product strategy, workflow automation, APIs, and commercial growth with practical delivery. This CV is tailored for ${roleHint} responsibilities and highlights relevant experience in ${companyName.trim() || "the target organisation"}.`,
      ].join("\n");

      const cv = [
        `# Full Name`,
        profile.name,
        "",
        `# Professional Headline`,
        profile.headline,
        "",
        summary,
        "",
        `# Core Skills`,
        selectedSkills.map((skill) => `- ${skill}`).join("\n"),
        "",
        `# Professional Experience`,
        `- VeriEdit AI: ${tailorDescription(portfolioDescriptions["VeriEdit AI"] ?? "", keywords, roleHint)}`,
        `- VeriTrade AI: ${tailorDescription(portfolioDescriptions["VeriTrade AI"] ?? "", keywords, roleHint)}`,
        `- CallCatch: ${tailorDescription(portfolioDescriptions.CallCatch ?? "", keywords, roleHint)}`,
        `- CareerPilot AI: ${tailorDescription(portfolioDescriptions["CareerPilot AI"] ?? "", keywords, roleHint)}`,
        "",
        `# Education`,
        profile.education,
        "",
        `# Certifications`,
        profile.certifications,
        "",
        `# Preferred Work Arrangement`,
        profile.workPreferences.join("; "),
        "",
        `# Relocation / Visa Sponsorship`,
        profile.visaSponsorship,
        "",
        `Tailored for ${roleHint}${companyName.trim() ? ` at ${companyName.trim()}` : ""}`,
      ].join("\n");

      setGeneratedCv(cv);
      setMatchSummary({
        percentage: matchScore,
        matched: matchedKeywords.slice(0, 8),
        missing: missingKeywords.slice(0, 8),
      });
      setIsGenerating(false);
      void saveGeneratedCv({
        job_title: jobTitle.trim() || roleHint,
        company_name: companyName.trim() || "Target company",
        job_description: jobDescription,
        match_percentage: matchScore,
        matched_keywords: matchedKeywords.slice(0, 8),
        missing_keywords: missingKeywords.slice(0, 8),
        generated_cv: cv,
      }).then(() => getGeneratedCvs().then((cvs) => setSavedCvCount(cvs.length))).catch(() => undefined);
    }, 700);
  };

  const handleClear = () => {
    setJobDescription("");
    setJobTitle("");
    setCompanyName("");
    setGeneratedCv("");
    setError("");
    setCopied(false);
    setMatchSummary({ percentage: 0, matched: [], missing: [] });
  };

  const handleCopy = async () => {
    if (!generatedCv) return;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(generatedCv);
    }
    setCopied(true);
  };

  const handleDownload = () => {
    if (!generatedCv) return;

    const blob = new Blob([generatedCv], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, "-").toLowerCase()}-cv.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const matchLabel = useMemo(() => {
    const prefix = matchSummary.percentage >= 70 ? "Strong" : matchSummary.percentage >= 45 ? "Moderate" : "Early";
    return `${prefix} estimated profile match`;
  }, [matchSummary.percentage]);

  return (
    <main className="cvPage">
      <section className="cvHero">
        <div className="cvHeroContent">
          <div>
            <p className="eyebrow">CareerPilot AI</p>
            <h1>AI CV Generator</h1>
            <p>
              CareerPilot tailors a CV using your Master Career Profile and a target job description so your experience is presented with relevance and clarity.
            </p>
          </div>
          <Link className="backButton" href="/profile">
            Back to Profile
          </Link>
        </div>
      </section>

      <section className="cvCard">
        <div className="formGrid">
          <div className="formSection">
            <label>
              Job Description
              <textarea
                rows={10}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the target job description here"
              />
            </label>

            <label>
              Job Title
              <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. AI Product Manager" />
            </label>

            <label>
              Company Name
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Acme AI" />
            </label>

            <div className="buttonRow">
              <button type="button" className="primaryButton" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Tailored CV"}
              </button>
              <button type="button" className="secondaryButton" onClick={handleClear}>
                Clear
              </button>
            </div>

            {error ? <div className="errorBox">{error}</div> : null}
          </div>

          <div className="previewSection">
            <div className="matchCard">
              <h3>Profile Match Summary</h3>
              <p className="matchLabel">Estimated profile match: {matchSummary.percentage}%</p>
              <p>{matchLabel}</p>
              <p className="savedInfo">Saved CVs: {savedCvCount}</p>
              <div className="matchList">
                <div>
                  <strong>Matched keywords</strong>
                  <p>{matchSummary.matched.length ? matchSummary.matched.join(", ") : "Add a job description to compare keywords."}</p>
                </div>
                <div>
                  <strong>Missing keywords</strong>
                  <p>{matchSummary.missing.length ? matchSummary.missing.join(", ") : "No missing keywords detected."}</p>
                </div>
              </div>
            </div>

            <div className="previewCard">
              <div className="previewHeader">
                <h3>Generated CV Preview</h3>
                <div className="buttonRow compact">
                  <button type="button" className="secondaryButton" onClick={handleCopy} disabled={!generatedCv}>
                    {copied ? "Copied" : "Copy CV"}
                  </button>
                  <button type="button" className="secondaryButton" onClick={handleDownload} disabled={!generatedCv}>
                    Download as text file
                  </button>
                </div>
              </div>
              <div className="previewBody">
                {generatedCv ? <pre>{generatedCv}</pre> : <p className="emptyState">Generate a tailored CV to preview it here.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        :root {
          color-scheme: dark;
        }

        body {
          margin: 0;
          background: linear-gradient(135deg, #07111f 0%, #0f203a 100%);
          color: #f3f7ff;
        }

        .cvPage {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(135deg, #07111f 0%, #0f203a 100%);
        }

        .cvHero {
          max-width: 1280px;
          margin: 0 auto 24px;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(7, 17, 31, 0.82);
          box-shadow: 0 22px 60px rgba(1, 6, 15, 0.35);
        }

        .cvHeroContent {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 8px;
          color: #6bb7ff;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .cvHero h1 {
          margin: 0 0 10px;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
        }

        .cvHero p {
          margin: 0;
          color: #9eb0c9;
          max-width: 760px;
          line-height: 1.65;
        }

        .backButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-radius: 999px;
          background: #f3f7ff;
          color: #07111f;
          font-weight: 700;
          text-decoration: none;
        }

        .cvCard {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(13, 27, 45, 0.92);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .formSection,
        .previewSection {
          display: grid;
          gap: 16px;
        }

        .formSection {
          padding: 20px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        label {
          display: grid;
          gap: 8px;
          font-weight: 600;
          color: #eef4ff;
        }

        input,
        textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 12px;
          padding: 12px 14px;
          background: rgba(7, 17, 31, 0.75);
          color: #f3f7ff;
          font: inherit;
        }

        textarea {
          resize: vertical;
          min-height: 160px;
        }

        input:focus,
        textarea:focus {
          outline: 2px solid rgba(107, 183, 255, 0.4);
          border-color: #6bb7ff;
        }

        .buttonRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .buttonRow.compact {
          margin-left: auto;
        }

        .primaryButton,
        .secondaryButton {
          border: none;
          border-radius: 999px;
          padding: 10px 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .primaryButton {
          background: linear-gradient(135deg, #2563eb, #2f7de3);
          color: white;
        }

        .secondaryButton {
          background: rgba(255, 255, 255, 0.08);
          color: #dce9ff;
        }

        .primaryButton:disabled,
        .secondaryButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .errorBox {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(220, 38, 38, 0.16);
          color: #fecaca;
          border: 1px solid rgba(248, 113, 113, 0.3);
        }

        .matchCard,
        .previewCard {
          padding: 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .matchCard h3,
        .previewCard h3 {
          margin: 0 0 8px;
        }

        .matchLabel {
          margin: 0 0 8px;
          font-weight: 700;
          color: #dff0ff;
        }

        .savedInfo {
          margin: 8px 0 0;
          color: #9eb0c9;
          font-size: 0.95rem;
        }

        .matchList {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }

        .matchList p {
          margin: 4px 0 0;
          color: #9eb0c9;
          line-height: 1.5;
        }

        .previewHeader {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .previewBody {
          border-radius: 14px;
          padding: 16px;
          background: rgba(7, 17, 31, 0.7);
          min-height: 280px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .previewBody pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: inherit;
          line-height: 1.6;
          color: #f3f7ff;
        }

        .emptyState {
          margin: 0;
          color: #9eb0c9;
        }

        @media (max-width: 940px) {
          .formGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .cvPage {
            padding: 14px;
          }

          .cvHero,
          .cvCard {
            padding: 18px;
          }

          .previewHeader {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
