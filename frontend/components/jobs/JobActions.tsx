"use client";

import Link from "next/link";

type JobActionsJob = {
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

type JobActionsProps = {
  job: JobActionsJob;
  onSave: (job: JobActionsJob) => void;
  onGenerateCv: (job: JobActionsJob) => void;
};

export default function JobActions({
  job,
  onSave,
  onGenerateCv,
}: JobActionsProps) {
  const originalJobUrl =
    job.source.toLowerCase() === "remoteok"
      ? "https://remoteok.com"
      : `https://www.google.com/search?q=${encodeURIComponent(
          `${job.company} ${job.title}`,
        )}`;

  return (
    <div className="actionsRow">
      <button
        type="button"
        className="secondaryButton"
        onClick={() => onSave(job)}
      >
        {job.saved ? "Saved" : "Save Job"}
      </button>

      <a
        className="secondaryButton"
        href={originalJobUrl}
        target="_blank"
        rel="noreferrer"
      >
        View Original Job
      </a>

      <Link
        className="primaryButton"
        href="/cv-generator"
        onClick={() => onGenerateCv(job)}
      >
        Generate Tailored CV
      </Link>
    </div>
  );
}