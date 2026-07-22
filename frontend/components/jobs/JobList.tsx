"use client";

import JobCard from "@/components/jobs/JobCard";

type JobListJob = {
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

type JobListProps = {
  jobs: JobListJob[];
  onSave: (job: JobListJob) => void;
  onGenerateCv: (job: JobListJob) => void;
};

export default function JobList({
  jobs,
  onSave,
  onGenerateCv,
}: JobListProps) {
  return (
    <div className="jobList">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onSave={onSave}
          onGenerateCv={onGenerateCv}
        />
      ))}
    </div>
  );
}