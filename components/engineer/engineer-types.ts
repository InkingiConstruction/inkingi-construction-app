export type EngineerUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  image?: string | null;
};

export type EngineerAssignment = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  status: string;
  invitedAt?: string;
  acceptedAt?: string | null;
  removedAt?: string | null;
  project?: EngineerProject;
  user?: EngineerUser;
};

export type EngineerProject = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  budget?: string | number;
  currency?: string;
  address?: string | null;
  engineerId?: string | null;
  client?: EngineerUser;
  engineer?: EngineerUser | null;
  projectMembers?: EngineerAssignment[];
  milestones?: EngineerMilestone[];
  createdAt?: string;
};

export type EngineerMilestone = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: string;
  order: number;
  budgetPercentage?: string | number;
  durationDays?: number | null;
  acceptanceCriteria?: string | null;
  project?: EngineerProject;
  _count?: {
    boqItems?: number;
    inspections?: number;
    progressPhotos?: number;
    rfqs?: number;
  };
};

export type EngineerBoqItem = {
  id: string;
  milestoneId: string;
  category: string;
  name: string;
  quantity: string | number;
  unit: string;
  unitPrice: string | number;
  totalPrice: string | number;
  notes?: string | null;
  milestone?: EngineerMilestone;
};

export type EngineerRfq = {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  quantity: string | number;
  unit: string;
  deadline: string;
  status: string;
  project?: EngineerProject;
  milestone?: EngineerMilestone;
  quotes?: unknown[];
};

export type EngineerProgressPhoto = {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  cloudinaryUrl: string;
  caption?: string | null;
  isVideo: boolean;
  reviewStatus?: "pending" | "approved" | "rejected";
  supervisorComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  project?: EngineerProject;
  milestone?: EngineerMilestone | null;
};
