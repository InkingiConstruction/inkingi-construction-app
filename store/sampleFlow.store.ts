import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addFunds, ensureProjectFund } from "@/utils/projectFunds";

export interface MockEngineer {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  kycStatus: "approved" | "pending" | "rejected";
  bio: string;
  specialty: string;
  completedJobsCount: number;
  certifications: string[];
  avatar?: string;
  gallery?: string[];
  recentJobs: Array<{
    id: string;
    title: string;
    clientName: string;
    rating: number;
    completionDate: string;
    feedback: string;
  }>;
}

export interface MockInvitation {
  id: string;
  projectId: string;
  projectName: string;
  engineerId?: string;
  engineerName?: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  sentAt: string;
}

export interface MockMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: "pending" | "active" | "awaiting_client_payment" | "completed" | "revision_required";
  budgetAmount: number;
  budgetPercentage: number;
  checklist: Array<{ id: string; task: string; completed: boolean }>;
  completionPhotos: string[];
  revisionNotes?: string;
  disputeId?: string;
}

export interface MockDispute {
  id: string;
  milestoneId: string;
  projectId: string;
  projectName: string;
  milestoneName: string;
  category: "Quality" | "Timeline" | "Cost" | "Other";
  description: string;
  evidence: string[];
  status: "open" | "resolved";
  mediatorName: string;
  resolutionEta: string;
  lockedAmount: number;
  timeline: Array<{ date: string; title: string; desc: string }>;
}

export interface BankAccount {
  type: "bk" | "momo";
  accountName: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  linked: boolean;
}

export interface MockTransaction {
  id: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  type: "deposit" | "withdraw" | "release" | "dispute_refund";
  method: "bk" | "momo";
  description: string;
  timestamp: string;
}

interface SampleFlowState {
  engineers: MockEngineer[];
  invitations: MockInvitation[];
  milestones: MockMilestone[];
  disputes: MockDispute[];
  bankAccounts: BankAccount[];
  transactions: MockTransaction[];
  
  // Actions
  inviteEngineer: (projectId: string, projectName: string, engineerIdOrEmail: string) => Promise<void>;
  removeInvitation: (invitationId: string) => void;
  acceptInvitation: (invitationId: string) => Promise<void>;
  updateMilestoneStatus: (
    milestoneId: string, 
    status: MockMilestone["status"], 
    extra?: { revisionNotes?: string; disputeId?: string }
  ) => void;
  createDispute: (data: {
    milestoneId: string;
    projectId: string;
    projectName: string;
    milestoneName: string;
    category: MockDispute["category"];
    description: string;
    evidence: string[];
    lockedAmount: number;
  }) => string;
  linkBankAccount: (type: "bk" | "momo", details: { accountName: string; accountNumber: string }) => void;
  unlinkBankAccount: (type: "bk" | "momo") => void;
  fundProjectFromBank: (projectId: string, projectName: string, amount: number, type: "bk" | "momo") => Promise<boolean>;
  resetStore: () => void;
}

const INITIAL_ENGINEERS: MockEngineer[] = [
  {
    id: "eng-1",
    name: "Eng. Jean Bosco Niyonisenga",
    email: "jean.bosco@inkingi.gov.rw",
    phone: "+250 788 123 456",
    rating: 4.8,
    kycStatus: "approved",
    bio: "Senior Civil Engineer with 12+ years of experience in structural design and commercial project management in Kigali. Certified by the Institute of Engineers Rwanda (IER).",
    specialty: "Structural & High-Rise Buildings",
    completedJobsCount: 24,
    certifications: ["IER Professional License #1092", "PMP Certified Professional", "Autodesk Certified Revit Professional"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=80"
    ],
    recentJobs: [
      { id: "job-1", title: "Kigali Heights Plaza Extension", clientName: "CHIC Ltd", rating: 4.9, completionDate: "2025-11-10", feedback: "Excellent supervision. Delivered ahead of time with zero structural audit remarks." },
      { id: "job-2", title: "Gahanga Warehouse Complex", clientName: "Bakhresa Group", rating: 4.7, completionDate: "2025-05-04", feedback: "Highly professional and handles subcontractors with strict quality compliance." }
    ]
  },
  {
    id: "eng-2",
    name: "Eng. Alice Mutoni",
    email: "alice.mutoni@inkingipro.com",
    phone: "+250 789 987 654",
    rating: 4.95,
    kycStatus: "approved",
    bio: "Green architecture and structural specialist. 8+ years focused on eco-friendly residential designs, smart foundations, and cost-efficient building workflows.",
    specialty: "Sustainable Residential & Masonry",
    completedJobsCount: 15,
    certifications: ["IER License #2204", "LEED Green Associate", "RDB Approved Assessor"],
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503387762-592dec5804fc?w=500&auto=format&fit=crop&q=80"
    ],
    recentJobs: [
      { id: "job-3", title: "Vision City Smart Villa", clientName: "RSSB", rating: 5.0, completionDate: "2026-02-18", feedback: "Alice has an outstanding eye for modern design. The milestone reports were extremely detailed." }
    ]
  },
  {
    id: "eng-3",
    name: "Eng. Eric Gakire",
    email: "eric.gakire@civilworks.rw",
    phone: "+250 782 555 111",
    rating: 4.6,
    kycStatus: "approved",
    bio: "Earthworks and infrastructure expert. Focuses on heavy foundation works, retaining walls, grading, and drainage systems in hilly terrains.",
    specialty: "Foundations & Hillside Construction",
    completedJobsCount: 31,
    certifications: ["IER License #0894", "OSHA Safety Certified Manager"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=80"
    ],
    recentJobs: [
      { id: "job-4", title: "Rebero Hillside Retaining System", clientName: "Rebero Estates", rating: 4.8, completionDate: "2025-08-30", feedback: "Resolved complex drainage issues that had stalled the project for months. Outstanding engineer." }
    ]
  }
];

const INITIAL_MILESTONES = (projectId: string): MockMilestone[] => [
  {
    id: `m1-${projectId}`,
    projectId,
    name: "Milestone 1: Excavation & Footings",
    description: "Clearing site, excavation to stable soil layer, pouring reinforced concrete footings and laying plinth masonry.",
    status: "completed",
    budgetAmount: 3000000,
    budgetPercentage: 25,
    checklist: [
      { id: "t1-1", task: "Site clearing and leveling", completed: true },
      { id: "t1-2", task: "Excavation of foundation trenches", completed: true },
      { id: "t1-3", task: "Pouring concrete footings", completed: true },
      { id: "t1-4", task: "Laying foundation wall masonry", completed: true }
    ],
    completionPhotos: [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=60"
    ]
  },
  {
    id: `m2-${projectId}`,
    projectId,
    name: "Milestone 2: Superstructure Concrete & Brickwork",
    description: "Casting columns, ring beam, floor slabs and rising load-bearing brick walls to roof height.",
    status: "awaiting_client_payment",
    budgetAmount: 4500000,
    budgetPercentage: 35,
    checklist: [
      { id: "t2-1", task: "Formwork and rebar installation for columns", completed: true },
      { id: "t2-2", task: "Casting pillars and beams", completed: true },
      { id: "t2-3", task: "Rising perimeter and partition wall masonry", completed: true },
      { id: "t2-4", task: "Curing slab structure for 14 days", completed: true }
    ],
    completionPhotos: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=60"
    ]
  },
  {
    id: `m3-${projectId}`,
    projectId,
    name: "Milestone 3: Roofing & Exterior Plastering",
    description: "Installing timber truss structures, roofing sheet cladding, and plastering outer surfaces for water protection.",
    status: "active",
    budgetAmount: 2500000,
    budgetPercentage: 20,
    checklist: [
      { id: "t3-1", task: "Truss assembly and mounting", completed: false },
      { id: "t3-2", task: "Roof sheet installation with insulation", completed: false },
      { id: "t3-3", task: "External wall preparation and plastering", completed: false }
    ],
    completionPhotos: []
  },
  {
    id: `m4-${projectId}`,
    projectId,
    name: "Milestone 4: Finishes, Plumbing & Electrical",
    description: "Laying tiles, installing doors/windows, running conduit wires, piping for kitchen/bathrooms, and painting.",
    status: "pending",
    budgetAmount: 2000000,
    budgetPercentage: 20,
    checklist: [
      { id: "t4-1", task: "Electrical wiring and panel mounting", completed: false },
      { id: "t4-2", task: "Plumbing pipes and drainage links", completed: false },
      { id: "t4-3", task: "Tile laying and window frame fitting", completed: false },
      { id: "t4-4", task: "Final painting coat", completed: false }
    ],
    completionPhotos: []
  }
];

export const useSampleFlowStore = create<SampleFlowState>()(
  persist(
    (set, get) => ({
      engineers: INITIAL_ENGINEERS,
      invitations: [],
      milestones: [],
      disputes: [],
      transactions: [],
      bankAccounts: [
        {
          type: "bk",
          accountName: "Client Account - BK",
          accountNumber: "00010-09876543-21",
          bankName: "Bank of Kigali",
          balance: 15500000, // 15.5M RWF
          linked: true
        },
        {
          type: "momo",
          accountName: "MTN Wallet",
          accountNumber: "+250788102030",
          bankName: "MTN Mobile Money",
          balance: 3200000, // 3.2M RWF
          linked: true
        }
      ],

      inviteEngineer: async (projectId: string, projectName: string, engineerIdOrEmail: string) => {
        const eng = get().engineers.find(
          e => e.id === engineerIdOrEmail || e.email.toLowerCase() === engineerIdOrEmail.toLowerCase()
        );

        const newInv: MockInvitation = {
          id: `inv-${Date.now()}`,
          projectId,
          projectName,
          engineerId: eng?.id,
          engineerName: eng?.name,
          email: eng ? eng.email : engineerIdOrEmail,
          status: "pending",
          sentAt: new Date().toISOString()
        };

        set(state => ({
          invitations: [newInv, ...state.invitations]
        }));

        // Mock Nodemailer sending in background/toast visual info later
        console.log(`Mock Nodemailer: Sent invitation to ${newInv.email} for Project ${projectName}`);
      },

      removeInvitation: (invitationId: string) => {
        set(state => ({
          invitations: state.invitations.filter(inv => inv.id !== invitationId)
        }));
      },

      acceptInvitation: async (invitationId: string) => {
        set(state => ({
          invitations: state.invitations.map(inv => 
            inv.id === invitationId ? { ...inv, status: "accepted" as const } : inv
          )
        }));
      },

      updateMilestoneStatus: (milestoneId, status, extra) => {
        set(state => {
          const updatedMilestones = state.milestones.map(ms => {
            if (ms.id === milestoneId) {
              return {
                ...ms,
                status,
                ...extra
              };
            }
            return ms;
          });

          let updatedTxs = state.transactions;
          if (status === "completed") {
            const milestone = state.milestones.find(m => m.id === milestoneId);
            if (milestone) {
              const newTx: MockTransaction = {
                id: `tx-${Date.now()}`,
                projectId: milestone.projectId,
                amount: milestone.budgetAmount,
                type: "release",
                method: "bk",
                description: `Released ${milestone.budgetAmount.toLocaleString()} RWF from escrow to Engineer for milestone: "${milestone.name}"`,
                timestamp: new Date().toISOString()
              };
              updatedTxs = [newTx, ...updatedTxs];
            }
          }

          return {
            milestones: updatedMilestones,
            transactions: updatedTxs
          };
        });
      },

      createDispute: (data) => {
        const disputeId = `disp-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const newDispute: MockDispute = {
          id: disputeId,
          milestoneId: data.milestoneId,
          projectId: data.projectId,
          projectName: data.projectName,
          milestoneName: data.milestoneName,
          category: data.category,
          description: data.description,
          evidence: data.evidence,
          status: "open",
          mediatorName: "Eng. Alexis Kamanzi (IER Arbitrator)",
          resolutionEta: "14 days",
          lockedAmount: data.lockedAmount,
          timeline: [
            {
              date: new Date().toISOString(),
              title: "Dispute Initiated",
              desc: `Client raised a dispute under category [${data.category}]. Escrow funds of ${data.lockedAmount.toLocaleString()} RWF are locked.`
            },
            {
              date: new Date(Date.now() + 60000).toISOString(),
              title: "Notifications Dispatched",
              desc: "Engineer, Supervisor, and IER Arbitrators have been notified via Email & SMS."
            }
          ]
        };

        set(state => {
          const newTx: MockTransaction = {
            id: `tx-${Date.now()}`,
            projectId: data.projectId,
            projectName: data.projectName,
            amount: data.lockedAmount,
            type: "withdraw",
            method: "bk",
            description: `Escrow funds of ${data.lockedAmount.toLocaleString()} RWF locked under dispute for milestone: "${data.milestoneName}"`,
            timestamp: new Date().toISOString()
          };

          return {
            disputes: [newDispute, ...state.disputes],
            milestones: state.milestones.map(ms => 
              ms.id === data.milestoneId ? { ...ms, status: "revision_required", disputeId } : ms
            ),
            transactions: [newTx, ...state.transactions]
          };
        });

        return disputeId;
      },

      linkBankAccount: (type, details) => {
        set(state => ({
          bankAccounts: state.bankAccounts.map(acc => 
            acc.type === type ? { ...acc, ...details, linked: true } : acc
          )
        }));
      },

      unlinkBankAccount: (type) => {
        set(state => ({
          bankAccounts: state.bankAccounts.map(acc => 
            acc.type === type ? { ...acc, linked: false } : acc
          )
        }));
      },

      fundProjectFromBank: async (projectId, projectName, amount, type) => {
        const accounts = get().bankAccounts;
        const acc = accounts.find(a => a.type === type);
        
        if (!acc || !acc.linked || acc.balance < amount) {
          return false;
        }

        // Deduct from bank account
        set(state => ({
          bankAccounts: state.bankAccounts.map(a => 
            a.type === type ? { ...a, balance: a.balance - amount } : a
          )
        }));

        // Add to project funds (escrow wallet)
        await addFunds(
          projectId,
          projectName,
          amount * 4,
          amount,
          type,
          type === "bk" ? "Bank of Kigali" : "MTN Mobile Money"
        );

        // Ensure we seed milestones for this project if not already present
        const currentMilestones = get().milestones.filter(m => m.projectId === projectId);
        if (currentMilestones.length === 0) {
          const seeded = INITIAL_MILESTONES(projectId);
          set(state => ({
            milestones: [...state.milestones, ...seeded]
          }));
        }

        // Log transaction
        const newTx: MockTransaction = {
          id: `tx-${Date.now()}`,
          projectId,
          projectName,
          amount,
          type: "deposit",
          method: type,
          description: `Deposited ${amount.toLocaleString()} RWF from linked ${type === "bk" ? "Bank of Kigali" : "MTN MoMo"} to project escrow`,
          timestamp: new Date().toISOString()
        };

        set(state => ({
          transactions: [newTx, ...state.transactions]
        }));

        return true;
      },

      resetStore: () => {
        set({
          engineers: INITIAL_ENGINEERS,
          invitations: [],
          milestones: [],
          disputes: [],
          transactions: [],
          bankAccounts: [
            {
              type: "bk",
              accountName: "Client Account - BK",
              accountNumber: "00010-09876543-21",
              bankName: "Bank of Kigali",
              balance: 15500000,
              linked: true
            },
            {
              type: "momo",
              accountName: "MTN Wallet",
              accountNumber: "+250788102030",
              bankName: "MTN Mobile Money",
              balance: 3200000,
              linked: true
            }
          ]
        });
      }
    }),
    {
      name: "inkingi-sample-flow-store-v2",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
