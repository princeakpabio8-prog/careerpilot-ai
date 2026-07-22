type MatchInsightsProps = {
  matchedSkills: string[];
  missingSkills: string[];
  remote: boolean;
  visaSponsorship: string;
};

function formatSkill(value: string) {
  return value
    .replace(/\bai\b/gi, "AI")
    .replace(/\bapi\b/gi, "API")
    .replace(/\bsaas\b/gi, "SaaS")
    .replace(/\bcrm\b/gi, "CRM")
    .replace(/\bllms?\b/gi, "LLM")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MatchInsights({
  matchedSkills,
  missingSkills,
  remote,
  visaSponsorship,
}: MatchInsightsProps) {
  const strengths = [
    ...matchedSkills.slice(0, 3).map(
      (skill) => `Your profile shows relevant ${formatSkill(skill)} experience.`,
    ),
    remote ? "This role aligns with your remote-work preference." : "",
    /yes|likely/i.test(visaSponsorship)
      ? "The sponsorship signal supports your relocation goals."
      : "",
  ].filter(Boolean);

  const gaps = missingSkills.slice(0, 2);

  return (
    <section className="matchInsights" aria-label="AI match intelligence">
      <div className="matchInsightsHeader">
        <div>
          <span className="insightEyebrow">AI Match Intelligence</span>
          <h4>Why this role fits you</h4>
        </div>
        <span className="insightStatus">
          {strengths.length >= 3 ? "Strong alignment" : "Potential fit"}
        </span>
      </div>

      <ul className="strengthList">
        {strengths.length > 0 ? (
          strengths.map((strength) => <li key={strength}>{strength}</li>)
        ) : (
          <li>Your broader product and commercial background may transfer well.</li>
        )}
      </ul>

      {gaps.length > 0 ? (
        <div className="skillGap">
          <span>Skills to strengthen</span>
          <div className="skillGapTags">
            {gaps.map((skill) => (
              <span key={skill}>{formatSkill(skill)}</span>
            ))}
          </div>
        </div>
      ) : (
        <p className="noGapMessage">
          No major skill gap was detected from the available job description.
        </p>
      )}
    </section>
  );
}