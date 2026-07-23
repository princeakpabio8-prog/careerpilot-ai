import Link from "next/link";

const logos = ["Notion", "Linear", "Stripe", "Remote OK", "Workday"];

const features = [
  {
    title: "AI Job Matching",
    description: "Surface the roles that best fit your profile and goals with warm, human-first relevance.",
  },
  {
    title: "Visa Sponsorship Search",
    description: "Filter opportunities with clear visa support signals before you invest your time.",
  },
  {
    title: "CV Generator",
    description: "Generate tailored CVs quickly with your profile and target job context in one place.",
  },
  {
    title: "Cover Letter Generator",
    description: "Shape polished, role-specific letters that feel thoughtful and intentional.",
  },
  {
    title: "Career Dashboard",
    description: "Track saved roles, match quality, and your momentum from a calm, premium workspace.",
  },
];

const steps = [
  {
    title: "Create your profile",
    description: "Add your background, priorities, and preferred locations in minutes.",
  },
  {
    title: "Discover high-fit roles",
    description: "Search remote and visa-supported opportunities with match insights.",
  },
  {
    title: "Generate tailored applications",
    description: "Turn strong matches into polished CVs and cover letters instantly.",
  },
];

const testimonials = [
  {
    quote: "The experience feels calm, modern, and genuinely useful. I found a role that matched my background within days.",
    author: "Mina, Product Designer",
  },
  {
    quote: "It helped me refine my profile and present myself clearly for international roles without the usual noise.",
    author: "Luca, AI Engineer",
  },
];

const plans = [
  { name: "Starter", price: "Free", points: ["Core profile", "Basic job search", "Limited CV drafts"] },
  { name: "Growth", price: "$19/mo", points: ["Advanced matching", "Unlimited CV generation", "Saved roles workspace"] },
];

export default function HomePage() {
  return (
    <main className="landingPage">
      <section className="heroSection">
        <nav className="topNav" aria-label="Primary navigation">
          <Link href="/" className="brandMark">
            <span className="brandDot" />
            CareerPilot
          </Link>
          <div className="navLinks">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <Link href="/jobs">Jobs</Link>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="navActions">
            <Link href="/dashboard" className="textLink">
              Sign In
            </Link>
            <Link href="/onboarding" className="primaryButton">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="heroContent">
          <div className="heroCopy">
            <p className="eyebrow">Premium career discovery</p>
            <h1>Your next opportunity is closer than you think.</h1>
            <p className="heroText">
              CareerPilot helps professionals discover remote and visa-sponsored opportunities, match jobs to their experience, and generate tailored CVs and cover letters.
            </p>
            <div className="heroButtons">
              <Link href="/onboarding" className="primaryButton large">
                Get Started
              </Link>
              <a href="#how-it-works" className="secondaryButton large">
                Watch Demo
              </a>
            </div>
            <div className="heroStats">
              <div>
                <strong>4.9/5</strong>
                <span>Founder rating</span>
              </div>
              <div>
                <strong>70+</strong>
                <span>Countries covered</span>
              </div>
            </div>
          </div>

          <div className="heroPanel" aria-label="CareerPilot preview card">
            <div className="panelGlow" />
            <p className="panelLabel">Opportunity Pulse</p>
            <h2>High-fit roles, tailored instantly.</h2>
            <ul>
              <li>Remote-first roles</li>
              <li>Visa support signals</li>
              <li>Tailored CV drafting</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="logoStrip" aria-label="Trusted companies">
        <p>Trusted by ambitious teams and professionals</p>
        <div className="logoRow">
          {logos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section id="features" className="sectionBlock">
        <div className="sectionHeading">
          <p className="eyebrow">Features</p>
          <h2>Everything you need to move with clarity.</h2>
        </div>
        <div className="cardGrid">
          {features.map((feature) => (
            <article key={feature.title} className="featureCard">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="sectionBlock alt">
        <div className="sectionHeading">
          <p className="eyebrow">How it works</p>
          <h2>A calm path from profile to opportunity.</h2>
        </div>
        <div className="cardGrid stepsGrid">
          {steps.map((step, index) => (
            <article key={step.title} className="featureCard stepCard">
              <span className="stepIndex">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <p className="eyebrow">Testimonials</p>
          <h2>Professionals use CareerPilot to move with intention.</h2>
        </div>
        <div className="cardGrid testimonialGrid">
          {testimonials.map((item) => (
            <article key={item.author} className="testimonialCard">
              <p>“{item.quote}”</p>
              <span>{item.author}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="sectionBlock alt">
        <div className="sectionHeading">
          <p className="eyebrow">Pricing preview</p>
          <h2>Simple plans built for momentum.</h2>
        </div>
        <div className="cardGrid pricingGrid">
          {plans.map((plan) => (
            <article key={plan.name} className="pricingCard">
              <h3>{plan.name}</h3>
              <p className="price">{plan.price}</p>
              <ul>
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link href="/onboarding" className="secondaryButton">
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="finalCta">
        <h2>Ready to find your next move?</h2>
        <p>Create your profile, discover stronger matches, and generate applications with confidence.</p>
        <Link href="/onboarding" className="primaryButton large">
          Get Started
        </Link>
      </section>

      <footer className="footer">
        <p>© 2026 CareerPilot AI</p>
        <div>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/jobs">Jobs</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </footer>
    </main>
  );
}