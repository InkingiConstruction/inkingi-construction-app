export type ClientUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  image?: string | null;
  kycStatus?: string | null;
};

export type ClientAssignment = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  status: string;
  invitedAt?: string;
  user?: ClientUser;
};

export type ClientMilestone = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: string;
  order?: number;
  budgetPercentage?: string | number;
  paidAt?: string | null;
};

export type ClientEscrowAccount = {
  id: string;
  projectId: string;
  balance: string | number;
  lockedBalance: string | number;
  currency: string;
  project?: ClientProject;
  transactions?: ClientTransaction[];
};

export type ClientProject = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  budget: string | number;
  currency: string;
  address?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  engineerId?: string | null;
  engineer?: ClientUser | null;
  projectMembers?: ClientAssignment[];
  milestones?: ClientMilestone[];
  escrowAccount?: ClientEscrowAccount | null;
  sitePhotos?: { cloudinaryUrl?: string; publicId?: string }[];
};

export type ClientProgressPhoto = {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  cloudinaryUrl: string;
  caption?: string | null;
  isVideo?: boolean;
  reviewStatus?: "pending" | "approved" | "rejected";
  supervisorComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  project?: ClientProject;
  milestone?: ClientMilestone | null;
};

export type ClientInspection = {
  id: string;
  milestoneId: string;
  decision?: string | null;
  rating?: number | null;
  notes?: string | null;
  createdAt: string;
  milestone?: ClientMilestone;
};

export type ClientTransaction = {
  id: string;
  escrowAccountId: string;
  milestoneId?: string | null;
  type: string;
  method?: string | null;
  amount: string | number;
  status: string;
  reference?: string | null;
  createdAt: string;
  milestone?: ClientMilestone | null;
  escrowAccount?: ClientEscrowAccount;
};
