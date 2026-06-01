export type SupervisorProject = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  budget?: string | number;
  currency?: string;
  address?: string | null;
  client?: { name?: string; email?: string };
  engineer?: { name?: string; email?: string } | null;
  milestones?: SupervisorMilestone[];
  projectMembers?: {
    id: string;
    role: string;
    status: string;
    user?: { name?: string; email?: string };
  }[];
  createdAt?: string;
};

export type SupervisorMilestone = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: string;
  order: number;
  budgetPercentage?: string | number;
  acceptanceCriteria?: string | null;
  project?: SupervisorProject;
  _count?: {
    inspections?: number;
    progressPhotos?: number;
  };
};

export type SupervisorInspection = {
  id: string;
  milestoneId: string;
  decision?: "approved" | "revision_required" | null;
  notes?: string | null;
  rating?: number | null;
  createdAt: string;
  milestone?: SupervisorMilestone;
};

export type SupervisorProgressPhoto = {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  cloudinaryUrl: string;
  caption?: string | null;
  isVideo: boolean;
  createdAt: string;
  project?: SupervisorProject;
  milestone?: SupervisorMilestone | null;
  uploadedBy?: {
    name?: string;
    role?: string;
  };
};
