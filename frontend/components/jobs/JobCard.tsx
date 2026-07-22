"use client";

import JobActions from "@/components/jobs/JobActions";
import MatchInsights from "@/components/jobs/MatchInsights";

type JobCardJob = {
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
  matchedSkills: string[];
  missingSkills: string[];
};

type JobCardProps = {
  job: JobCardJob;
  onSave: (job: JobCardJob) => void;
  onGenerateCv: (job: JobCardJob) => void;
};

export default function JobCard({
  job,
  onSave,
  onGenerateCv,
}: JobCardProps) {
  return (
    <article className="jobCard">
      <div className="jobTop">
        <div>
          <p className="sourceLabel">{job.source}</p>
          <h3>{job.title}</h3>
          <p className="companyLine">
            {job.company} Â· {job.location}
          </p>
        </div>

        <div className="matchBadge">{job.matchScore}% match</div>
      </div>

      <p className="jobDescription">{job.description}</p>

      <div className="metaRow">
        <span>{job.remote ? "Remote / Hybrid" : "Hybrid"}</span>
        <span>Visa: {job.visaSponsorship}</span>
        <span>{job.salary}</span>
      </div>

      <MatchInsights
        matchedSkills={job.matchedSkills}
        missingSkills={job.missingSkills}
        remote={job.remote}
        visaSponsorship={job.visaSponsorship}
      />

      <JobActions
        job={job}
        onSave={onSave}
        onGenerateCv={onGenerateCv}
      />
    </article>
  );
}