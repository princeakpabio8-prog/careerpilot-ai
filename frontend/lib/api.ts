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

const API_URL = "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export type ProfilePayload = {
  full_name: string;
  professional_headline: string;
  about: string;
  current_country: string;
  preferred_countries: string[];
  education: string;
  certifications: string;
  skills: string[];
  portfolio: string;
  target_roles: string[];
  work_preferences: string[];
  salary_expectation: string;
  visa_sponsorship: string;
  profile_image?: string | null;
};

export type GeneratedCvPayload = {
  profile_id?: number | null;
  job_title: string;
  company_name: string;
  job_description: string;
  match_percentage: number;
  matched_keywords: string[];
  missing_keywords: string[];
  generated_cv: string;
};

export type SavedJobPayload = {
  profile_id?: number | null;
  external_id: string;
  company: string;
  job_title: string;
  location: string;
  remote_type: string;
  visa_sponsorship: string;
  salary: string;
  source: string;
  source_url: string;
  job_description: string;
  match_score: number;
  published_at: string;
};

export async function getJobs(): Promise<Job[]> {
  try {
    return await request<Job[]>("/api/jobs");
  } catch {
    return [];
  }
}

export async function getProfile(): Promise<ProfilePayload | null> {
  try {
    return await request<ProfilePayload | null>("/api/profile");
  } catch {
    return null;
  }
}

export async function saveProfile(payload: ProfilePayload): Promise<ProfilePayload> {
  return request<ProfilePayload>("/api/profile", { method: "POST", body: JSON.stringify(payload) });
}

export async function getGeneratedCvs(): Promise<GeneratedCvPayload[]> {
  try {
    return await request<GeneratedCvPayload[]>("/api/cvs");
  } catch {
    return [];
  }
}

export async function saveGeneratedCv(payload: GeneratedCvPayload): Promise<GeneratedCvPayload> {
  return request<GeneratedCvPayload>("/api/cvs", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteGeneratedCv(id: number): Promise<void> {
  await request<void>(`/api/cvs/${id}`, { method: "DELETE" });
}

export async function getSavedJobs(): Promise<SavedJobPayload[]> {
  try {
    return await request<SavedJobPayload[]>("/api/saved-jobs");
  } catch {
    return [];
  }
}

export async function saveSavedJob(payload: SavedJobPayload): Promise<SavedJobPayload> {
  return request<SavedJobPayload>("/api/saved-jobs", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteSavedJob(id: number): Promise<void> {
  await request<void>(`/api/saved-jobs/${id}`, { method: "DELETE" });
}

export async function searchJobs(params: Record<string, string | number | boolean | undefined>): Promise<{ results: Array<any>; sources: string[]; errors: string[] }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  try {
    return await request<{ results: Array<any>; sources: string[]; errors: string[] }>(`/api/job-search?${query.toString()}`);
  } catch {
    return { results: [], sources: [], errors: ["Search service is currently unavailable."] };
  }
}
