"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveProfile } from "@/lib/api";

const profileKey = "careerpilot-profile-v1";

const countries = [
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
];

const roleOptions = [
"AI Product Manager",
"Technical Product Manager",
"AI Solutions Engineer",
"AI Governance Specialist",
"Solutions Consultant",
"Business Development Manager",
"Growth and Partnerships Manager",
"Technical Account Manager",
"Product Operations",
"Founder in Residence",
];

const workOptions = [
"Remote worldwide",
"Nigeria-based opportunities",
"Visa-sponsored relocation",
"Hybrid after relocation",
];

type OnboardingData = {
name: string;
headline: string;
about: string;
country: string;
education: string;
certifications: string;
skills: string[];
preferredCountries: string[];
targetRoles: string[];
salary: string;
visaSponsorship: string;
workPreferences: string[];
};

const initialData: OnboardingData = {
name: "",
headline: "",
about: "",
country: "Nigeria",
education: "",
certifications: "",
skills: [],
preferredCountries: [],
targetRoles: [],
salary: "",
visaSponsorship: "Yes for international relocation",
workPreferences: ["Remote worldwide"],
};

export default function OnboardingPage() {
const router = useRouter();

const [step, setStep] = useState(1);
const [data, setData] = useState<OnboardingData>(initialData);
const [skillInput, setSkillInput] = useState("");
const [saving, setSaving] = useState(false);

const totalSteps = 4;

const progress = useMemo(
() => Math.round((step / totalSteps) * 100),
[step]
);

const updateField = <K extends keyof OnboardingData>(
key: K,
value: OnboardingData[K]
) => {
setData((current) => ({
...current,
[key]: value,
}));
};

const toggleValue = (
key: "preferredCountries" | "targetRoles" | "workPreferences",
value: string
) => {
setData((current) => {
const currentValues = current[key];

return {
...current,
[key]: currentValues.includes(value)
? currentValues.filter((item) => item !== value)
: [...currentValues, value],
};
});
};

const addSkill = () => {
const value = skillInput.trim();

if (!value || data.skills.includes(value)) return;

updateField("skills", [...data.skills, value]);
setSkillInput("");
};

const removeSkill = (skill: string) => {
updateField(
"skills",
data.skills.filter((item) => item !== skill)
);
};

const canContinue = () => {
if (step === 1) {
return Boolean(
data.name.trim() &&
data.headline.trim() &&
data.about.trim()
);
}

if (step === 2) {
return Boolean(data.education.trim() && data.skills.length > 0);
}

if (step === 3) {
return (
data.preferredCountries.length > 0 &&
data.targetRoles.length > 0
);
}

if (step === 4) {
return Boolean(
data.salary.trim() && data.workPreferences.length > 0
);
}

return false;
};

const finishOnboarding = async () => {
if (!canContinue()) return;

setSaving(true);

const profileData = {
name: data.name,
headline: data.headline,
about: data.about,
country: data.country,
preferredCountries: data.preferredCountries,
education: data.education,
certifications: data.certifications,
skills: data.skills,
portfolio: [],
targetRoles: data.targetRoles.join("\n"),
salary: data.salary,
visaSponsorship: data.visaSponsorship,
workPreferences: data.workPreferences,
profileImage: null,
};

window.localStorage.setItem(
profileKey,
JSON.stringify(profileData)
);

window.localStorage.setItem(
"careerpilot-onboarding-complete",
"true"
);

try {
await saveProfile({
full_name: data.name,
professional_headline: data.headline,
about: data.about,
current_country: data.country,
preferred_countries: data.preferredCountries,
education: data.education,
certifications: data.certifications,
skills: data.skills,
portfolio: "",
target_roles: data.targetRoles,
work_preferences: data.workPreferences,
salary_expectation: data.salary,
visa_sponsorship: data.visaSponsorship,
profile_image: null,
});
} catch {
// The local profile still works if the backend is unavailable.
}

router.push("/dashboard");
};

return (
<main className="onboardingPage">
<header className="onboardingTopbar">
<Link href="/" className="onboardingBrand">
<span className="brandDot" />
CareerPilot
</Link>

<span>
Step {step} of {totalSteps}
</span>
</header>

<section className="onboardingLayout">
<aside className="onboardingSidebar">
<p className="eyebrow">CareerPilot setup</p>

<h1>Build one profile. Unlock better opportunities.</h1>

<p className="onboardingDescription">
Tell CareerPilot what you have done, where you want to
work, and which opportunities matter to you.
</p>

<div className="onboardingProgress">
<div className="progressText">
<span>Profile setup</span>
<strong>{progress}%</strong>
</div>

<div className="progressTrack">
<span style={{ width: `${progress}%` }} />
</div>
</div>

<div className="onboardingSteps">
{[
"About you",
"Experience and skills",
"Countries and roles",
"Opportunity preferences",
].map((label, index) => {
const number = index + 1;

return (
<div
key={label}
className={`onboardingStepItem ${
number === step ? "active" : ""
} ${number < step ? "complete" : ""}`}
>
<span>{number < step ? "✓" : number}</span>
<p>{label}</p>
</div>
);
})}
</div>
</aside>

<section className="onboardingCard">
{step === 1 && (
<div className="onboardingForm">
<div className="onboardingHeading">
<p className="eyebrow">Step one</p>
<h2>Tell us about yourself</h2>
<p>
This information becomes the foundation of your
professional profile.
</p>
</div>

<label>
Full name
<input
value={data.name}
onChange={(event) =>
updateField("name", event.target.value)
}
placeholder="Your full name"
/>
</label>

<label>
Professional headline
<input
value={data.headline}
onChange={(event) =>
updateField("headline", event.target.value)
}
placeholder="AI Product Manager, Growth Strategist..."
/>
</label>

<label>
About you
<textarea
rows={6}
value={data.about}
onChange={(event) =>
updateField("about", event.target.value)
}
placeholder="Describe your experience, strengths, and ambitions."
/>
</label>

<label>
Current country
<select
value={data.country}
onChange={(event) =>
updateField("country", event.target.value)
}
>
{countries.map((country) => (
<option key={country} value={country}>
{country}
</option>
))}
</select>
</label>
</div>
)}

{step === 2 && (
<div className="onboardingForm">
<div className="onboardingHeading">
<p className="eyebrow">Step two</p>
<h2>Add your experience and strengths</h2>
<p>
CareerPilot uses this information when assessing job
fit.
</p>
</div>

<label>
Education
<textarea
rows={4}
value={data.education}
onChange={(event) =>
updateField("education", event.target.value)
}
placeholder="Degree, school, subject, and location"
/>
</label>

<label>
Certifications
<textarea
rows={4}
value={data.certifications}
onChange={(event) =>
updateField("certifications", event.target.value)
}
placeholder="List your certifications"
/>
</label>

<div>
<span className="fieldLabel">Skills</span>

<div className="onboardingSkillRow">
<input
value={skillInput}
onChange={(event) =>
setSkillInput(event.target.value)
}
onKeyDown={(event) => {
if (event.key === "Enter") {
event.preventDefault();
addSkill();
}
}}
placeholder="Add a skill"
/>

<button type="button" onClick={addSkill}>
Add
</button>
</div>

<div className="onboardingChoices">
{data.skills.map((skill) => (
<button
key={skill}
type="button"
className="onboardingChoice selected"
onClick={() => removeSkill(skill)}
>
{skill} ×
</button>
))}
</div>
</div>
</div>
)}

{step === 3 && (
<div className="onboardingForm">
<div className="onboardingHeading">
<p className="eyebrow">Step three</p>
<h2>Choose where and how you want to grow</h2>
<p>
Select the countries and roles that genuinely interest
you.
</p>
</div>

<div>
<span className="fieldLabel">Preferred countries</span>

<div className="onboardingChoices">
{countries.map((country) => (
<button
key={country}
type="button"
className={`onboardingChoice ${
data.preferredCountries.includes(country)
? "selected"
: ""
}`}
onClick={() =>
toggleValue("preferredCountries", country)
}
>
{country}
</button>
))}
</div>
</div>

<div>
<span className="fieldLabel">Target roles</span>

<div className="onboardingChoices">
{roleOptions.map((role) => (
<button
key={role}
type="button"
className={`onboardingChoice ${
data.targetRoles.includes(role)
? "selected"
: ""
}`}
onClick={() =>
toggleValue("targetRoles", role)
}
>
{role}
</button>
))}
</div>
</div>
</div>
)}

{step === 4 && (
<div className="onboardingForm">
<div className="onboardingHeading">
<p className="eyebrow">Final step</p>
<h2>Set your opportunity preferences</h2>
<p>
These preferences help CareerPilot prioritise stronger
matches.
</p>
</div>

<label>
Salary expectation
<input
value={data.salary}
onChange={(event) =>
updateField("salary", event.target.value)
}
placeholder="EUR 70,000–100,000"
/>
</label>

<label>
Visa sponsorship
<select
value={data.visaSponsorship}
onChange={(event) =>
updateField(
"visaSponsorship",
event.target.value
)
}
>
<option>Yes for international relocation</option>
<option>Preferred but not required</option>
<option>Not required</option>
</select>
</label>

<div>
<span className="fieldLabel">Work preferences</span>

<div className="onboardingChoices">
{workOptions.map((option) => (
<button
key={option}
type="button"
className={`onboardingChoice ${
data.workPreferences.includes(option)
? "selected"
: ""
}`}
onClick={() =>
toggleValue("workPreferences", option)
}
>
{option}
</button>
))}
</div>
</div>
</div>
)}

<footer className="onboardingActions">
<button
type="button"
className="onboardingBack"
disabled={step === 1}
onClick={() =>
setStep((current) => Math.max(1, current - 1))
}
>
Back
</button>

{step < totalSteps ? (
<button
type="button"
className="onboardingNext"
disabled={!canContinue()}
onClick={() => {
setStep((current) =>
Math.min(totalSteps, current + 1)
);
}}
>
Continue
</button>
) : (
<button
type="button"
className="onboardingNext"
disabled={!canContinue() || saving}
onClick={finishOnboarding}
>
{saving ? "Creating profile..." : "Finish setup"}
</button>
)}
</footer>
</section>
</section>
</main>
);
}