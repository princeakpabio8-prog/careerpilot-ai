type MatchInsightsProps = {
  matchScore: number;
  jobTitle: string;
  salary: string;
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

function readinessLabel(score: number) {
  if (score >= 80) return "Likely to shortlist";
  if (score >= 60) return "Competitive with tailoring";
  return "Needs stronger positioning";
}

function recommendation(score: number, missingSkills: string[]) {
  if (score >= 80) {
    return "Apply now. Tailor your CV around the strongest matched skills and prepare two clear achievement stories.";
  }

  if (score >= 60) {
    return `Apply after a quick CV refresh. Emphasize transferable wins${
      missingSkills.length ? ` and review ${formatSkill(missingSkills[0])}` : ""
    } before the interview.`;
  }

  return "Strengthen your positioning first. Update your CV with measurable outcomes and close one or two visible skill gaps.";
}

export default function MatchInsights({
  matchScore,
  jobTitle,
  salary,
  matchedSkills,
  missingSkills,
  remote,
  visaSponsorship,
}: MatchInsightsProps) {
  const readinessScore = Math.min(
    96,
    Math.max(
      35,
      matchScore +
        (remote ? 4 : 0) +
        (/yes|likely/i.test(visaSponsorship) ? 4 : 0),
    ),
  );

  const strengths = [
    ...matchedSkills.slice(0, 3).map(
      (skill) => `Relevant ${formatSkill(skill)} experience detected.`,
    ),
    remote ? "Remote-work preference aligns with this role." : "",
    /yes|likely/i.test(visaSponsorship)
      ? "Sponsorship signal supports your relocation goals."
      : "",
  ].filter(Boolean);

  const gaps = missingSkills.slice(0, 3);

  return (
    <section className="matchInsights" aria-label="AI match intelligence">
      <div className="matchInsightsHeader">
        <div>
          <span className="insightEyebrow">AI Match Intelligence</span>
          <h4>{jobTitle}</h4>
        </div>
        <span className="insightStatus">
          {matchScore >= 80 ? "Strong fit" : matchScore >= 60 ? "Good potential" : "Developing fit"}
        </span>
      </div>

      <div className="intelligenceGrid">
        <article className="scorePanel">
          <div className="scoreLabelRow">
            <span>Overall match</span>
            <strong>{matchScore}%</strong>
          </div>
          <div className="scoreTrack" aria-hidden="true">
            <span style={{ width: `${matchScore}%` }} />
          </div>
          <p>{matchScore >= 80 ? "High alignment with your current profile." : "Tailoring can improve your positioning."}</p>
        </article>

        <article className="scorePanel">
          <div className="scoreLabelRow">
            <span>Recruiter readiness</span>
            <strong>{readinessScore}%</strong>
          </div>
          <div className="scoreTrack recruiterTrack" aria-hidden="true">
            <span style={{ width: `${readinessScore}%` }} />
          </div>
          <p>{readinessLabel(readinessScore)}</p>
        </article>
      </div>

      <div className="insightColumns">
        <div>
          <span className="columnLabel">Why you match</span>
          <ul className="strengthList">
            {strengths.length > 0 ? (
              strengths.map((strength) => <li key={strength}>{strength}</li>)
            ) : (
              <li>Your broader product and commercial background may transfer well.</li>
            )}
          </ul>
        </div>

        <div>
          <span className="columnLabel">Learn next</span>
          {gaps.length > 0 ? (
            <div className="skillGapTags">
              {gaps.map((skill) => (
                <span key={skill}>{formatSkill(skill)}</span>
              ))}
            </div>
          ) : (
            <p className="noGapMessage">No major skill gap detected.</p>
          )}
        </div>
      </div>

      <div className="marketSignal">
        <div>
          <span>Salary signal</span>
          <strong>{salary || "Not disclosed"}</strong>
        </div>
        <div>
          <span>Relocation signal</span>
          <strong>{visaSponsorship}</strong>
        </div>
      </div>

      <div className="aiRecommendation">
        <span className="recommendationIcon" aria-hidden="true">✦</span>
        <div>
          <span className="columnLabel">AI recommendation</span>
          <p>{recommendation(matchScore, gaps)}</p>
        </div>
      </div>
    </section>
  );
}