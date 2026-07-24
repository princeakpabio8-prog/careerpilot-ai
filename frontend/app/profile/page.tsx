"use client";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { getProfile, saveProfile } from "@/lib/api";

const storageKey = "careerpilot-profile-v1";

const portfolioOptions = [
  "VeriEdit AI",
  "VeriTrade AI",
  "CallCatch",
  "CareerPilot AI",
] as const;

const countryOptions = [
  "Nigeria",
  "United Kingdom",
  "Canada",
  "United States",
  "Germany",
  "United Arab Emirates",
  "Netherlands",
  "Ireland",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
] as const;

const workPreferenceOptions = [
  "Remote worldwide",
  "Nigeria-based opportunities",
  "Visa-sponsored relocation",
  "Hybrid after relocation",
] as const;

const portfolioDescriptions: Record<string, string> = {
  "VeriEdit AI": "Builds trust infrastructure that helps organisations verify, audit, reconstruct and control AI-influenced decisions.",
  "VeriTrade AI": "Combines market intelligence, trading analytics, opportunity detection, AI-assisted trade decisions and automated execution through exchange APIs.",
  CallCatch: "Analyses public business information, identifies evidence-based growth opportunities, qualifies prospects and prepares personalised outreach with human approval.",
  "CareerPilot AI": "Discovers remote and visa-sponsored jobs, matches opportunities, generates tailored CVs and cover letters, and prepares approval-first applications.",
};

export default function ProfilePage() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("Prince Akpabio");
  const [headline, setHeadline] = useState(
    "AI Founder | AI Product Engineer | AI Governance & Automation | Business Development Strategist"
  );
  const [about, setAbout] = useState(
    "AI founder, product builder, and business development professional with a Bachelor of Engineering in Petroleum Engineering. I build practical AI-powered products across AI governance, market intelligence, sales automation, fintech, and career technology. My work combines engineering thinking, product strategy, workflow automation, APIs, and commercial growth."
  );
  const [country, setCountry] = useState("Nigeria");
  const [preferredCountries, setPreferredCountries] = useState<string[]>([
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
  ]);
  const [education, setEducation] = useState(
    "Bachelor of Engineering (B.Eng.) in Petroleum Engineering — Madonna University, Nigeria"
  );
  const [certifications, setCertifications] = useState(
    "- GitHub Foundations Certificate\n- Google AI Essentials\n- NVIDIA Generative AI Explained — NVIDIA Deep Learning Institute"
  );
  const [skills, setSkills] = useState<string[]>([
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
  ]);
  const [skillInput, setSkillInput] = useState("");
  const [portfolio, setPortfolio] = useState<string[]>([...portfolioOptions]);
  const [targetRoles, setTargetRoles] = useState(
    "- AI Product Manager\n- Technical Product Manager\n- AI Solutions Engineer\n- AI Governance Specialist\n- Solutions Consultant\n- Business Development Manager\n- Growth and Partnerships Manager\n- Technical Account Manager\n- Product Operations\n- Founder in Residence"
  );
  const [salary, setSalary] = useState("EUR 70,000–120,000, negotiable depending on role and location");
  const [visaSponsorship, setVisaSponsorship] = useState("Yes for international relocation");
  const [workPreferences, setWorkPreferences] = useState<string[]>([
    "Remote worldwide",
    "Nigeria-based opportunities",
    "Visa-sponsored relocation",
    "Hybrid after relocation",
  ]);
  const [saved, setSaved] = useState(false);

  const selectedCountryCount = useMemo(() => preferredCountries.length, [preferredCountries]);

  useEffect(() => {
    const applyLocalProfile = (parsed: {
      name?: string;
      headline?: string;
      about?: string;
      country?: string;
      preferredCountries?: string[];
      education?: string;
      certifications?: string;
      skills?: string[];
      portfolio?: string[];
      targetRoles?: string;
      salary?: string;
      visaSponsorship?: string;
      workPreferences?: string[];
      profileImage?: string | null;
    }) => {
      if (parsed.name) setName(parsed.name);
      if (parsed.headline) setHeadline(parsed.headline);
      if (parsed.about) setAbout(parsed.about);
      if (parsed.country) setCountry(parsed.country);
      if (parsed.preferredCountries) setPreferredCountries(parsed.preferredCountries);
      if (parsed.education) setEducation(parsed.education);
      if (parsed.certifications) setCertifications(parsed.certifications);
      if (parsed.skills) setSkills(parsed.skills);
      if (parsed.portfolio) setPortfolio(parsed.portfolio);
      if (parsed.targetRoles) setTargetRoles(parsed.targetRoles);
      if (parsed.salary) setSalary(parsed.salary);
      if (parsed.visaSponsorship) setVisaSponsorship(parsed.visaSponsorship);
      if (parsed.workPreferences) setWorkPreferences(parsed.workPreferences);
      if (parsed.profileImage !== undefined) setProfileImage(parsed.profileImage);
    };

    const syncProfile = async (profileData: {
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
    }) => {
      await saveProfile({
        full_name: profileData.name,
        professional_headline: profileData.headline,
        about: profileData.about,
        current_country: profileData.country,
        preferred_countries: profileData.preferredCountries,
        education: profileData.education,
        certifications: profileData.certifications,
        skills: profileData.skills,
        portfolio: profileData.portfolio.join("\n"),
        target_roles: profileData.targetRoles
          .split(/\n|;/)
          .map((item) => item.replace(/^-\s*/, "").trim())
          .filter(Boolean),
        work_preferences: profileData.workPreferences,
        salary_expectation: profileData.salary,
        visa_sponsorship: profileData.visaSponsorship,
        profile_image: profileData.profileImage,
      });
    };

    const hydrateProfile = async () => {
      if (typeof window === "undefined") return;

      const localValue = window.localStorage.getItem(storageKey);

      if (localValue) {
        try {
          const parsed = JSON.parse(localValue);
          applyLocalProfile(parsed);

          // The browser profile is the user's most recent explicit profile.
          // Sync it to the backend so the CV generator receives the same data.
          await syncProfile({
            name: parsed.name || name,
            headline: parsed.headline || headline,
            about: parsed.about || about,
            country: parsed.country || country,
            preferredCountries: parsed.preferredCountries || preferredCountries,
            education: parsed.education || education,
            certifications: parsed.certifications || certifications,
            skills: parsed.skills || skills,
            portfolio: parsed.portfolio || portfolio,
            targetRoles: parsed.targetRoles || targetRoles,
            salary: parsed.salary || salary,
            visaSponsorship: parsed.visaSponsorship || visaSponsorship,
            workPreferences: parsed.workPreferences || workPreferences,
            profileImage: parsed.profileImage ?? profileImage,
          });
          return;
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      try {
        const remoteProfile = await getProfile();
        const isDemoProfile =
          remoteProfile?.full_name?.trim().toLowerCase() === "ada lovelace" ||
          remoteProfile?.portfolio?.toLowerCase().includes("example.com");

        if (remoteProfile && !isDemoProfile) {
          const remoteData = {
            name: remoteProfile.full_name || name,
            headline: remoteProfile.professional_headline || headline,
            about: remoteProfile.about || about,
            country: remoteProfile.current_country || country,
            preferredCountries: remoteProfile.preferred_countries || preferredCountries,
            education: remoteProfile.education || education,
            certifications: remoteProfile.certifications || certifications,
            skills: remoteProfile.skills || skills,
            portfolio: remoteProfile.portfolio
              ? remoteProfile.portfolio.split("\n").filter(Boolean)
              : portfolio,
            targetRoles: remoteProfile.target_roles?.join("\n") || targetRoles,
            salary: remoteProfile.salary_expectation || salary,
            visaSponsorship: remoteProfile.visa_sponsorship || visaSponsorship,
            workPreferences: remoteProfile.work_preferences || workPreferences,
            profileImage: remoteProfile.profile_image || null,
          };

          applyLocalProfile(remoteData);
          window.localStorage.setItem(storageKey, JSON.stringify(remoteData));
          return;
        }
      } catch {
        // The defaults below remain available if the backend is temporarily unavailable.
      }

      const defaultData = {
        name,
        headline,
        about,
        country,
        preferredCountries,
        education,
        certifications,
        skills,
        portfolio,
        targetRoles,
        salary,
        visaSponsorship,
        workPreferences,
        profileImage,
      };

      window.localStorage.setItem(storageKey, JSON.stringify(defaultData));

      try {
        await syncProfile(defaultData);
      } catch {
        // Local storage remains the source of truth until the backend is available.
      }
    };

    void hydrateProfile();
    // Initial values are intentional defaults for first-time users.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleCountry = (value: string) => {
    setPreferredCountries((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills((current) => [...current, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (value: string) => {
    setSkills((current) => current.filter((skill) => skill !== value));
  };

  const togglePortfolio = (value: string) => {
    setPortfolio((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const toggleWorkPreference = (value: string) => {
    setWorkPreferences((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleSave = async () => {
    if (typeof window === "undefined") return;

    const profileData = {
      name,
      headline,
      about,
      country,
      preferredCountries,
      education,
      certifications,
      skills,
      portfolio,
      targetRoles,
      salary,
      visaSponsorship,
      workPreferences,
      profileImage,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(profileData));

    try {
      await saveProfile({
        full_name: name,
        professional_headline: headline,
        about,
        current_country: country,
        preferred_countries: preferredCountries,
        education,
        certifications,
        skills,
        portfolio: portfolio.join("\n"),
        target_roles: targetRoles.split(/\n|;/).map((item) => item.replace(/^-\s*/, "").trim()).filter(Boolean),
        work_preferences: workPreferences,
        salary_expectation: salary,
        visa_sponsorship: visaSponsorship,
        profile_image: profileImage,
      });
    } catch {
      // Keep local persistence even if the API is unavailable.
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <main className="profilePage">
      <section className="profileHero">
        <div className="profileHeroContent">
          <div>
            <p className="eyebrow">CareerPilot AI Profile</p>
            <h1>Shape a standout professional profile</h1>
            <p>
              Keep your experience, portfolio, and ambitions aligned with high-impact opportunities across the AI economy.
            </p>
          </div>
          <div className="heroBadge">Ready for the next move</div>
        </div>
      </section>

      <section className="profileCard">
        <div className="profileHeader">
          <div className="avatarWrap">
            <div className="avatarPreview" aria-label="Profile preview">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile preview"
                  width={122}
                  height={122}
                  unoptimized
                />
              ) : (
                <span>PA</span>
              )}
            </div>
            <label className="uploadButton" htmlFor="profileImage">
              Upload photo
            </label>
            <input id="profileImage" type="file" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="profileHeadlineBlock">
            <h2>{name || "Your full name"}</h2>
            <p>{headline || "Add your professional headline"}</p>
            <div className="pillRow">
              <span className="pill">{country}</span>
              <span className="pill">{selectedCountryCount} preferred countries</span>
              <span className="pill">{portfolio.length} portfolio products</span>
            </div>
          </div>
        </div>

        <div className="formGrid">
          <div className="formSection">
            <h3>Personal Details</h3>

            <label>
              Full Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
            </label>

            <label>
              Professional Headline
              <textarea
                rows={3}
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="AI Founder, Product Engineer, Strategist"
              />
            </label>

            <label>
              About Me
              <textarea
                rows={5}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                placeholder="Tell employers about your background and strengths"
              />
            </label>

            <label>
              Current Country
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                {countryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="fieldLabel">Preferred Countries</span>
              <div className="chipGrid">
                {countryOptions.map((option) => {
                  const active = preferredCountries.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`chipButton ${active ? "active" : ""}`}
                      onClick={() => toggleCountry(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="fieldLabel">Work Preferences</span>
              <div className="chipGrid">
                {workPreferenceOptions.map((option) => {
                  const active = workPreferences.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`chipButton ${active ? "active" : ""}`}
                      onClick={() => toggleWorkPreference(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="formSection">
            <h3>Experience & Credentials</h3>

            <label>
              Education
              <textarea
                rows={3}
                value={education}
                onChange={(event) => setEducation(event.target.value)}
                placeholder="Degree or institution"
              />
            </label>

            <label>
              Certifications
              <textarea
                rows={4}
                value={certifications}
                onChange={(event) => setCertifications(event.target.value)}
                placeholder="Certifications and credentials"
              />
            </label>

            <div>
              <span className="fieldLabel">Skills</span>
              <div className="tagRow">
                {skills.map((skill) => (
                  <span key={skill} className="tag">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="inlineInput">
                <input
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addSkill())}
                  placeholder="Add a skill"
                />
                <button type="button" onClick={addSkill}>
                  Add
                </button>
              </div>
            </div>

            <div>
              <span className="fieldLabel">AI Product Portfolio</span>
              <div className="chipGrid">
                {portfolioOptions.map((option) => {
                  const active = portfolio.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`chipButton ${active ? "active" : ""}`}
                      onClick={() => togglePortfolio(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="portfolioList">
                {portfolioOptions
                  .filter((option) => portfolio.includes(option))
                  .map((option) => (
                    <div key={option} className="portfolioItem">
                      <strong>{option}</strong>
                      <p>{portfolioDescriptions[option]}</p>
                    </div>
                  ))}
              </div>
            </div>

            <label>
              Target Roles
              <textarea
                rows={4}
                value={targetRoles}
                onChange={(event) => setTargetRoles(event.target.value)}
                placeholder="Target roles"
              />
            </label>

            <label>
              Salary Expectation
              <input value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="Annual salary or range" />
            </label>

            <label>
              Visa Sponsorship Required
              <select value={visaSponsorship} onChange={(event) => setVisaSponsorship(event.target.value)}>
                <option value="Yes for international relocation">Yes for international relocation</option>
                <option value="No">No</option>
              </select>
            </label>
          </div>
        </div>

        <div className="actions">
          <button type="button" className="primaryButton" onClick={handleSave}>
            Save Profile
          </button>
          <Link className="secondaryAction" href="/cv-generator">
            Open AI CV Generator
          </Link>
          {saved ? <span className="saveMessage">Profile saved successfully.</span> : null}
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

        .profilePage {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(135deg, #07111f 0%, #0f203a 100%);
        }

        .profileHero {
          max-width: 1200px;
          margin: 0 auto 24px;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(7, 17, 31, 0.82);
          box-shadow: 0 22px 60px rgba(1, 6, 15, 0.35);
        }

        .profileHeroContent {
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

        .profileHero h1 {
          margin: 0 0 10px;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
        }

        .profileHero p {
          margin: 0;
          color: #9eb0c9;
          max-width: 680px;
          line-height: 1.65;
        }

        .heroBadge {
          padding: 12px 16px;
          border-radius: 999px;
          background: rgba(107, 183, 255, 0.16);
          color: #d9ebff;
          border: 1px solid rgba(107, 183, 255, 0.24);
          font-weight: 700;
        }

        .profileCard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(13, 27, 45, 0.92);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
        }

        .profileHeader {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .avatarWrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .avatarPreview {
          width: 122px;
          height: 122px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.16);
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #1d428a, #2f7de3);
          color: #fff;
          font-size: 2rem;
          font-weight: 700;
        }

        .avatarPreview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .uploadButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 999px;
          background: #f3f7ff;
          color: #07111f;
          font-weight: 700;
          cursor: pointer;
        }

        .avatarWrap input {
          display: none;
        }

        .profileHeadlineBlock {
          flex: 1;
          min-width: 260px;
        }

        .profileHeadlineBlock h2 {
          margin: 0 0 8px;
          font-size: 1.65rem;
        }

        .profileHeadlineBlock p {
          margin: 0 0 12px;
          color: #9eb0c9;
          line-height: 1.6;
        }

        .pillRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: #dce9ff;
          font-size: 0.9rem;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .formSection {
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .formSection h3 {
          margin: 0 0 2px;
          font-size: 1.05rem;
        }

        label {
          display: grid;
          gap: 8px;
          font-weight: 600;
          color: #eef4ff;
        }

        .fieldLabel {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #eef4ff;
        }

        input,
        select,
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
          min-height: 100px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid rgba(107, 183, 255, 0.4);
          border-color: #6bb7ff;
        }

        .chipGrid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .portfolioList {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }

        .portfolioItem {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .portfolioItem strong {
          display: block;
          margin-bottom: 6px;
          color: #dff0ff;
        }

        .portfolioItem p {
          margin: 0;
          color: #9eb0c9;
          line-height: 1.5;
        }

        .chipButton {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.04);
          color: #dce9ff;
          cursor: pointer;
        }

        .chipButton.active {
          background: linear-gradient(135deg, #2563eb, #2f7de3);
          border-color: transparent;
          color: white;
        }

        .tagRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(107, 183, 255, 0.14);
          color: #dff0ff;
        }

        .tag button {
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
        }

        .inlineInput {
          display: flex;
          gap: 10px;
        }

        .inlineInput button {
          border: none;
          border-radius: 12px;
          padding: 0 14px;
          background: #2563eb;
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .primaryButton {
          border: none;
          border-radius: 999px;
          padding: 12px 22px;
          background: linear-gradient(135deg, #2563eb, #2f7de3);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .secondaryAction {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #dce9ff;
          font-weight: 700;
          text-decoration: none;
        }

        .saveMessage {
          color: #86efac;
          font-weight: 600;
        }

        @media (max-width: 860px) {
          .formGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .profilePage {
            padding: 14px;
          }

          .profileHero,
          .profileCard {
            padding: 18px;
          }

          .inlineInput {
            flex-direction: column;
          }

          .inlineInput button {
            min-height: 44px;
          }
        }
      `}</style>
    </main>
  );
}