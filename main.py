import Link from "next/link";

export default function HomePage() {
  return (
    <main className="hero">
      <div className="heroCard">
        <span className="eyebrow">CareerPilot AI</span>
        <h1>Your AI career agent for remote and visa-sponsored roles.</h1>
        <p>
          Discover opportunities, review tailored applications, and approve
          every submission before it is sent.
        </p>
        <Link className="button" href="/dashboard">
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
