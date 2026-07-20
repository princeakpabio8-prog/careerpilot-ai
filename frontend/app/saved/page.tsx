"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteGeneratedCv, deleteSavedJob, getGeneratedCvs, getSavedJobs, saveGeneratedCv } from "@/lib/api";

export default function SavedPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [generatedCvs, setGeneratedCvs] = useState<any[]>([]);

  const refresh = async () => {
    const [jobs, cvs] = await Promise.all([getSavedJobs(), getGeneratedCvs()]);
    setSavedJobs(jobs);
    setGeneratedCvs(cvs);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleDeleteJob = async (id: number) => {
    await deleteSavedJob(id);
    await refresh();
  };

  const handleDeleteCv = async (id: number) => {
    await deleteGeneratedCv(id);
    await refresh();
  };

  return (
    <main className="savedPage">
      <section className="savedHero">
        <div>
          <p className="eyebrow">CareerPilot AI</p>
          <h1>Saved jobs and generated CVs</h1>
          <p>Keep track of opportunities you want to revisit and the CV drafts you have already prepared.</p>
        </div>
        <Link className="backButton" href="/jobs">Back to jobs</Link>
      </section>

      <section className="savedCard">
        <div className="sectionBlock">
          <h2>Saved jobs</h2>
          {savedJobs.length === 0 ? (
            <p className="emptyState">No saved jobs yet. Save an opportunity from the jobs page.</p>
          ) : (
            <div className="itemList">
              {savedJobs.map((job) => (
                <article key={job.id} className="itemCard">
                  <div>
                    <h3>{job.job_title}</h3>
                    <p>{job.company} · {job.location}</p>
                  </div>
                  <div className="actionsRow">
                    <a className="secondaryButton" href={job.source_url || "/jobs"} target="_blank" rel="noreferrer">Open</a>
                    <button type="button" className="secondaryButton" onClick={() => void handleDeleteJob(job.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="sectionBlock">
          <h2>Generated CVs</h2>
          {generatedCvs.length === 0 ? (
            <p className="emptyState">No generated CVs yet. Generate one from the CV page.</p>
          ) : (
            <div className="itemList">
              {generatedCvs.map((cv) => (
                <article key={cv.id} className="itemCard">
                  <div>
                    <h3>{cv.job_title}</h3>
                    <p>{cv.company_name}</p>
                  </div>
                  <div className="actionsRow">
                    <button type="button" className="secondaryButton" onClick={() => navigator.clipboard?.writeText(cv.generated_cv)}>Copy</button>
                    <button type="button" className="secondaryButton" onClick={() => void handleDeleteCv(cv.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        :root { color-scheme: dark; }
        body { margin: 0; background: linear-gradient(135deg, #07111f 0%, #0f203a 100%); color: #f3f7ff; }
        .savedPage { min-height: 100vh; padding: 24px; background: linear-gradient(135deg, #07111f 0%, #0f203a 100%); }
        .savedHero { max-width: 1280px; margin: 0 auto 24px; padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(7,17,31,0.82); box-shadow: 0 22px 60px rgba(1,6,15,0.35); display: flex; justify-content: space-between; gap: 20px; align-items: center; flex-wrap: wrap; }
        .eyebrow { display: inline-block; margin-bottom: 8px; color: #6bb7ff; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; }
        .savedCard { max-width: 1280px; margin: 0 auto; padding: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); background: rgba(13,27,45,0.92); box-shadow: 0 24px 70px rgba(0,0,0,0.28); display: grid; gap: 20px; }
        .sectionBlock { padding: 18px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .itemList { display: grid; gap: 12px; }
        .itemCard { display: flex; justify-content: space-between; gap: 12px; padding: 14px; border-radius: 14px; background: rgba(255,255,255,0.04); }
        .actionsRow { display: flex; gap: 8px; align-items: center; }
        .secondaryButton, .backButton { display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 999px; padding: 10px 16px; text-decoration: none; font-weight: 700; cursor: pointer; background: rgba(255,255,255,0.08); color: #dce9ff; }
        .backButton { background: #f3f7ff; color: #07111f; }
        .emptyState { color: #9eb0c9; }
        @media (max-width: 640px) { .savedPage { padding: 14px; } .savedHero, .savedCard { padding: 18px; } .itemCard { flex-direction: column; } }
      `}</style>
    </main>
  );
}
