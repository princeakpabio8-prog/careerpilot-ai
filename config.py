import { getJobs } from "@/lib/api";

export default async function DashboardPage() {
  const jobs = await getJobs();

  const visaMatches = jobs.filter(
    (job) =>
      job.visa_sponsorship === "confirmed" ||
      job.visa_sponsorship === "likely"
  ).length;

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <span className="eyebrow">CareerPilot AI</span>
          <h1>Opportunity dashboard</h1>
        </div>
      </header>

      <section className="stats">
        <article className="card">
          <span>Jobs found</span>
          <strong>{jobs.length}</strong>
        </article>
        <article className="card">
          <span>Visa matches</span>
          <strong>{visaMatches}</strong>
        </article>
        <article className="card">
          <span>Ready for approval</span>
          <strong>0</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">New opportunities</span>
            <h2>Jobs awaiting review</h2>
          </div>
        </div>

        <div className="jobList">
          {jobs.map((job) => (
            <article className="jobRow" key={job.id}>
              <div>
                <h3>{job.title}</h3>
                <p>
                  {job.company} · {job.location}
                </p>
              </div>
              <div className="jobMeta">
                <span>{job.match_score}% match</span>
                <span>{job.visa_sponsorship}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
