export type Job = {
  id: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  visa_sponsorship: "confirmed" | "likely" | "unknown" | "not_available";
  source: string;
  apply_url: string;
  match_score: number;
  status: "discovered" | "shortlisted" | "approved" | "rejected" | "applied";
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_URL}/api/jobs`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return response.json();
  } catch {
    return [];
  }
}
