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
url?: string;
};

const fallbackProfile: ProfileData = {
name: "Prince Akpabio",
headline:
"AI Founder | AI Product Engineer | AI Governance & Automation | Business Development Strategist",
about:
"AI founder, product builder, and business development professional.",
country: "Nigeria",
preferredCountries: [
"Nigeria",
"United Kingdom",
"Germany",
"Switzerland",
],
education:
"Bachelor of Engineering in Petroleum Engineering — Madonna University",
certifications: "GitHub Foundations Certificate",
skills: [
"Artificial Intelligence",
"AI Governance",
"Product Strategy",
"Business Development",
],
portfolio: [],
targetRoles:
"AI Product Manager\nTechnical Product Manager\nAI Governance Specialist",
salary: "EUR 70,000–120,000",
visaSponsorship: "Yes for international relocation",
workPreferences: [
"Remote worldwide",
"Visa-sponsored relocation",
],
profileImage: null,
};

const initialJobs: JobRecord[] = [
{
id: "northstar-ai-product-manager",
company: "Northstar Labs",
title: "AI Product Manager",
location: "London, United Kingdom",
remote: true,
visaSponsorship: "Likely",
source: "Sample opportunity",
salary: "£95,000–£120,000",
matchScore: 94,
description:
"Build AI product roadmaps, define governance standards and work with engineering teams to ship trusted AI products.",
saved: false,
},
{
id: "aster-ai-governance",
company: "Aster AI",
title: "AI Governance Specialist",
location: "Berlin, Germany",
remote: false,
visaSponsorship: "Yes",
source: "Sample opportunity",
salary: "€80,000–€100,000",
matchScore: 91,
description:
"Lead AI risk reviews, verification frameworks and policy-aligned product delivery.",
saved: false,
},
{
id: "vertex-technical-product",
company: "Vertex Systems",
title: "Technical Product Manager",
location: "Remote — Europe",
remote: true,
visaSponsorship: "Likely",
source: "Sample opportunity",
salary: "€85,000–€110,000",
matchScore: 88,
description:
"Drive product strategy and cross-functional execution for AI-enabled software.",
saved: false,
},
];

function calculateProfileCompletion(profile: ProfileData) {
const values = [
profile.name,
profile.headline,
profile.about,
profile.country,
profile.education,
profile.certifications,
profile.skills.join(" "),
profile.targetRoles,
profile.salary,
profile.visaSponsorship,
profile.workPreferences.join(" "),
];

const completed = values.filter(
(value) => value && value.trim().length > 0
).length;

return Math.round((completed / values.length) * 100);
}

function getInitials(name: string) {
return (
name
.split(" ")
.filter(Boolean)
.slice(0, 2)
.map((part) => part[0])
.join("")
.toUpperCase() || "CP"
);
}

export default function DashboardPage() {
const [profile, setProfile] =
useState<ProfileData>(fallbackProfile);
const [jobs, setJobs] = useState<JobRecord[]>(initialJobs);
const [savedJobs, setSavedJobs] = useState<string[]>([]);

useEffect(() => {
if (typeof window === "undefined") return;

try {
const storedProfile =
window.localStorage.getItem(profileKey);

if (storedProfile) {
const parsed = JSON.parse(
storedProfile
) as Partial<ProfileData>;

setProfile({
...fallbackProfile,
...parsed,
});
}

const storedSavedJobs =
window.localStorage.getItem(savedJobsKey);

if (storedSavedJobs) {
setSavedJobs(JSON.parse(storedSavedJobs));
}

const storedJobs =
window.localStorage.getItem(jobsKey);

if (storedJobs) {
setJobs(JSON.parse(storedJobs));
}
} catch {
setProfile(fallbackProfile);
setJobs(initialJobs);
}
}, []);

const completion = useMemo(
() => calculateProfileCompletion(profile),
[profile]
);

const highMatchJobs = useMemo(
() => jobs.filter((job) => job.matchScore >= 85),
[jobs]
);

const visaMatches = useMemo(
() =>
jobs.filter((job) =>
/yes|likely/i.test(job.visaSponsorship)
).length,
[jobs]
);

const firstName =
profile.name.split(" ").filter(Boolean)[0] || "there";

const toggleSavedJob = (jobId: string) => {
const nextSavedJobs = savedJobs.includes(jobId)
? savedJobs.filter((id) => id !== jobId)
: [...savedJobs, jobId];

setSavedJobs(nextSavedJobs);

window.localStorage.setItem(
savedJobsKey,
JSON.stringify(nextSavedJobs)
);
};

return (
<main className="premiumDashboard">
<header className="dashboardNavigation">
<Link href="/" className="dashboardBrand">
<span className="brandDot" />
CareerPilot
</Link>

<nav>
<Link href="/jobs">Jobs</Link>
<Link href="/saved">Saved</Link>
<Link href="/cv-generator">CV Generator</Link>
<Link href="/profile">Profile</Link>
</nav>

<Link href="/profile" className="dashboardAvatar">
{profile.profileImage ? (
// eslint-disable-next-line @next/next/no-img-element
<img
src={profile.profileImage}
alt={profile.name}
/>
) : (
<span>{getInitials(profile.name)}</span>
)}
</Link>
</header>

<section className="dashboardWelcome">
<div>
<p className="eyebrow">Your opportunity command centre</p>
<h1>Good to see you, {firstName}.</h1>
<p>
Review your strongest matches, complete your profile
and prepare your next application.
</p>
</div>

<div className="welcomeActions">
<Link href="/jobs" className="dashboardPrimaryButton">
Explore jobs
</Link>

<Link
href="/cv-generator"
className="dashboardSecondaryButton"
>
Generate CV
</Link>
</div>
</section>

<section className="dashboardStatsGrid">
<article className="premiumStatCard">
<span className="statIcon">⌕</span>
<div>
<p>Total opportunities</p>
<strong>{jobs.length}</strong>
</div>
</article>

<article className="premiumStatCard">
<span className="statIcon">★</span>
<div>
<p>Saved jobs</p>
<strong>{savedJobs.length}</strong>
</div>
</article>

<article className="premiumStatCard">
<span className="statIcon">↗</span>
<div>
<p>High matches</p>
<strong>{highMatchJobs.length}</strong>
</div>
</article>

<article className="premiumStatCard">
<span className="statIcon">◎</span>
<div>
<p>Visa signals</p>
<strong>{visaMatches}</strong>
</div>
</article>
</section>

<section className="dashboardMainGrid">
<article className="dashboardPanel profileProgressPanel">
<div className="dashboardPanelHeader">
<div>
<p className="eyebrow">Profile readiness</p>
<h2>Your career profile</h2>
</div>

<strong className="completionBadge">
{completion}%
</strong>
</div>

<div className="profileProgressTrack">
<span style={{ width: `${completion}%` }} />
</div>

<p>
Your profile gives CareerPilot the context needed to
rank opportunities and tailor your application
materials.
</p>

<Link href="/profile" className="panelTextLink">
Review profile →
</Link>
</article>

<article className="dashboardPanel">
<div className="dashboardPanelHeader">
<div>
<p className="eyebrow">Recent activity</p>
<h2>Your momentum</h2>
</div>
</div>

<div className="activityTimeline">
<div>
<span />
<section>
<strong>{jobs.length} opportunities discovered</strong>
<p>Available in your current job workspace.</p>
</section>
</div>

<div>
<span />
<section>
<strong>{savedJobs.length} jobs saved</strong>
<p>Roles you marked for closer review.</p>
</section>
</div>

<div>
<span />
<section>
<strong>Profile {completion}% complete</strong>
<p>Your profile data is ready for matching.</p>
</section>
</div>
</div>
</article>
</section>

<section className="dashboardPanel">
<div className="dashboardPanelHeader opportunitiesHeader">
<div>
<p className="eyebrow">Recommended for you</p>
<h2>High-match opportunities</h2>
</div>

<Link href="/jobs" className="panelTextLink">
View all jobs →
</Link>
</div>

<div className="premiumJobList">
{highMatchJobs.map((job) => (
<article className="premiumJobCard" key={job.id}>
<div className="companyLogo">
{getInitials(job.company)}
</div>

<div className="jobCardContent">
<div className="jobTitleRow">
<div>
<h3>{job.title}</h3>
<p>
{job.company} · {job.location}
</p>
</div>

<strong className="matchBadge">
{job.matchScore}% match
</strong>
</div>

<p className="jobDescription">
{job.description}
</p>

<div className="jobBadgeRow">
<span>{job.salary}</span>
<span>{job.remote ? "Remote-friendly" : "On-site"}</span>
<span>
Sponsorship: {job.visaSponsorship}
</span>
</div>

<div className="jobActions">
<Link
href={`/jobs?selected=${encodeURIComponent(
job.id
)}`}
className="jobPrimaryAction"
>
View opportunity
</Link>

<Link
href={`/cv-generator?job=${encodeURIComponent(
job.id
)}`}
className="jobSecondaryAction"
>
Generate CV
</Link>

<button
type="button"
className="saveJobButton"
onClick={() => toggleSavedJob(job.id)}
>
{savedJobs.includes(job.id)
? "Saved"
: "Save job"}
</button>
</div>
</div>
</article>
))}
</div>
</section>

<section className="quickActionsSection">
<div className="dashboardPanelHeader">
<div>
<p className="eyebrow">Career tools</p>
<h2>Prepare your next move</h2>
</div>
</div>

<div className="quickActionsGrid">
<Link href="/cv-generator" className="quickActionCard">
<span>CV</span>
<h3>Tailored CV</h3>
<p>
Generate a truthful CV aligned with a selected role.
</p>
</Link>

<Link href="/cv-generator" className="quickActionCard">
<span>CL</span>
<h3>Cover letter</h3>
<p>
Prepare a role-specific and natural cover letter.
</p>
</Link>

<Link href="/profile" className="quickActionCard">
<span>AI</span>
<h3>Career profile</h3>
<p>
Keep your experience, skills and ambitions current.
</p>
</Link>

<Link href="/jobs" className="quickActionCard">
<span>↗</span>
<h3>Job matching</h3>
<p>
Discover opportunities aligned with your preferences.
</p>
</Link>
</div>
</section>

<style jsx global>{`
.premiumDashboard {
min-height: 100vh;
padding: 24px;
background:
radial-gradient(
circle at 10% 0%,
rgba(107, 183, 255, 0.17),
transparent 31%
),
linear-gradient(145deg, #06101d, #0b1b31 55%, #07111f);
}

.dashboardNavigation {
width: min(1280px, 100%);
margin: 0 auto 24px;
display: flex;
align-items: center;
justify-content: space-between;
gap: 22px;
padding: 13px 18px;
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 999px;
background: rgba(9, 23, 41, 0.76);
backdrop-filter: blur(18px);
}

.dashboardBrand {
display: inline-flex;
align-items: center;
gap: 10px;
font-weight: 800;
}

.dashboardNavigation nav {
display: flex;
gap: 20px;
color: rgba(246, 248, 252, 0.71);
font-size: 0.9rem;
}

.dashboardAvatar {
width: 40px;
height: 40px;
display: grid;
place-items: center;
overflow: hidden;
border-radius: 50%;
background: linear-gradient(135deg, #6bb7ff, #8d7bff);
color: white;
font-size: 0.78rem;
font-weight: 800;
}

.dashboardAvatar img {
width: 100%;
height: 100%;
object-fit: cover;
}

.dashboardWelcome,
.dashboardPanel,
.premiumStatCard,
.quickActionCard {
border: 1px solid rgba(255, 255, 255, 0.09);
background: rgba(9, 23, 41, 0.84);
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
}

.dashboardWelcome {
width: min(1280px, 100%);
margin: 0 auto 18px;
padding: 32px;
display: flex;
align-items: center;
justify-content: space-between;
gap: 26px;
border-radius: 26px;
}

.dashboardWelcome h1 {
margin-bottom: 10px;
font-size: clamp(2rem, 4vw, 3.5rem);
letter-spacing: -0.05em;
}

.dashboardWelcome > div > p:last-child {
max-width: 700px;
color: rgba(246, 248, 252, 0.67);
line-height: 1.65;
}

.welcomeActions {
display: flex;
gap: 10px;
flex-wrap: wrap;
}

.dashboardPrimaryButton,
.dashboardSecondaryButton {
display: inline-flex;
min-height: 46px;
align-items: center;
justify-content: center;
padding: 0 18px;
border-radius: 999px;
font-weight: 800;
}

.dashboardPrimaryButton {
background: linear-gradient(135deg, #6bb7ff, #8d7bff);
color: white;
}

.dashboardSecondaryButton {
border: 1px solid rgba(255, 255, 255, 0.11);
background: rgba(255, 255, 255, 0.045);
}

.dashboardStatsGrid {
width: min(1280px, 100%);
margin: 0 auto 18px;
display: grid;
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 14px;
}

.premiumStatCard {
padding: 19px;
display: flex;
align-items: center;
gap: 14px;
border-radius: 20px;
}

.statIcon {
width: 44px;
height: 44px;
display: grid;
place-items: center;
flex-shrink: 0;
border-radius: 14px;
background: rgba(107, 183, 255, 0.13);
color: #bde6ff;
font-size: 1.1rem;
font-weight: 800;
}

.premiumStatCard p {
margin-bottom: 5px;
color: rgba(246, 248, 252, 0.59);
font-size: 0.83rem;
}

.premiumStatCard strong {
font-size: 1.65rem;
}

.dashboardMainGrid {
width: min(1280px, 100%);
margin: 0 auto 18px;
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 16px;
}

.dashboardPanel {
width: min(1280px, 100%);
margin: 0 auto 18px;
padding: 24px;
border-radius: 24px;
}

.dashboardMainGrid .dashboardPanel {
margin-bottom: 0;
}

.dashboardPanelHeader {
display: flex;
align-items: center;
justify-content: space-between;
gap: 18px;
margin-bottom: 18px;
}

.dashboardPanelHeader h2 {
margin-bottom: 0;
font-size: 1.25rem;
}

.completionBadge,
.matchBadge {
padding: 8px 11px;
border-radius: 999px;
background: rgba(107, 183, 255, 0.15);
color: #dff3ff;
font-size: 0.82rem;
}

.profileProgressTrack {
height: 10px;
overflow: hidden;
margin-bottom: 18px;
border-radius: 999px;
background: rgba(255, 255, 255, 0.07);
}

.profileProgressTrack span {
display: block;
height: 100%;
border-radius: inherit;
background: linear-gradient(90deg, #6bb7ff, #8d7bff);
}

.profileProgressPanel > p {
color: rgba(246, 248, 252, 0.64);
line-height: 1.65;
}

.panelTextLink {
color: #bde6ff;
font-size: 0.87rem;
font-weight: 800;
}

.activityTimeline {
display: grid;
gap: 16px;
}

.activityTimeline > div {
display: grid;
grid-template-columns: auto 1fr;
gap: 12px;
}

.activityTimeline > div > span {
width: 10px;
height: 10px;
margin-top: 6px;
border-radius: 50%;
background: #7ec7ff;
box-shadow: 0 0 12px rgba(126, 199, 255, 0.62);
}

.activityTimeline strong {
display: block;
margin-bottom: 4px;
}

.activityTimeline p {
margin: 0;
color: rgba(246, 248, 252, 0.56);
font-size: 0.86rem;
}

.premiumJobList {
display: grid;
gap: 13px;
}

.premiumJobCard {
display: grid;
grid-template-columns: auto minmax(0, 1fr);
gap: 16px;
padding: 18px;
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: 18px;
background: rgba(255, 255, 255, 0.032);
}

.companyLogo {
width: 48px;
height: 48px;
display: grid;
place-items: center;
border-radius: 15px;
background: rgba(107, 183, 255, 0.13);
color: #dff3ff;
font-size: 0.76rem;
font-weight: 900;
}

.jobTitleRow {
display: flex;
justify-content: space-between;
gap: 14px;
}

.jobTitleRow h3 {
margin-bottom: 5px;
}

.jobTitleRow p,
.jobDescription {
color: rgba(246, 248, 252, 0.6);
}

.jobDescription {
max-width: 900px;
line-height: 1.55;
}

.jobBadgeRow,
.jobActions {
display: flex;
flex-wrap: wrap;
gap: 9px;
}

.jobBadgeRow {
margin-bottom: 15px;
}

.jobBadgeRow span {
padding: 7px 10px;
border-radius: 999px;
background: rgba(255, 255, 255, 0.045);
color: rgba(246, 248, 252, 0.68);
font-size: 0.78rem;
}

.jobPrimaryAction,
.jobSecondaryAction,
.saveJobButton {
min-height: 39px;
display: inline-flex;
align-items: center;
justify-content: center;
padding: 0 13px;
border-radius: 999px;
font: inherit;
font-size: 0.8rem;
font-weight: 800;
}

.jobPrimaryAction {
background: #f6f8fc;
color: #07111f;
}

.jobSecondaryAction,
.saveJobButton {
border: 1px solid rgba(255, 255, 255, 0.1);
background: rgba(255, 255, 255, 0.045);
color: #dce9ff;
}

.saveJobButton {
cursor: pointer;
}

.quickActionsSection {
width: min(1280px, 100%);
margin: 0 auto;
}

.quickActionsGrid {
display: grid;
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 14px;
}

.quickActionCard {
padding: 21px;
border-radius: 20px;
transition: transform 160ms ease;
}

.quickActionCard:hover {
transform: translateY(-3px);
}

.quickActionCard > span {
width: 42px;
height: 42px;
display: grid;
place-items: center;
margin-bottom: 18px;
border-radius: 13px;
background: rgba(107, 183, 255, 0.14);
color: #dff3ff;
font-weight: 900;
}

.quickActionCard h3 {
margin-bottom: 8px;
}

.quickActionCard p {
margin-bottom: 0;
color: rgba(246, 248, 252, 0.57);
line-height: 1.55;
font-size: 0.86rem;
}

@media (max-width: 940px) {
.dashboardStatsGrid,
.quickActionsGrid {
grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dashboardMainGrid {
grid-template-columns: 1fr;
}

.dashboardNavigation nav {
display: none;
}
}

@media (max-width: 640px) {
.premiumDashboard {
padding: 14px;
}

.dashboardNavigation {
border-radius: 22px;
}

.dashboardWelcome {
padding: 22px;
align-items: flex-start;
flex-direction: column;
}

.dashboardStatsGrid,
.quickActionsGrid {
grid-template-columns: 1fr;
}

.dashboardPanel {
padding: 19px;
}

.premiumJobCard {
grid-template-columns: 1fr;
}

.jobTitleRow {
flex-direction: column;
}

.companyLogo {
width: 43px;
height: 43px;
}
}
`}</style>
</main>
);
}