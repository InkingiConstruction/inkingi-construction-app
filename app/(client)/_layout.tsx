import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "payments", title: "Payments", icon: "card-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
      hiddenRoutes={[
        "create-project/index",
        "create-project/_steps/Step1_BasicInfo",
        "create-project/_steps/Step2_Budget",
        "create-project/_steps/Step3_Location",
        "create-project/_steps/Step4_Documents",
        "create-project/_steps/Step5_Review",
        "progress",
        "progress-detail",
        "project/[id]",
        "assign-engineer",
        "assign-supervisor",
        "assign-site-agent",
        "notifications",
        "profile",
        "profile-edit",
        "milestones",
        "disputes",
      ]}
    />
  );
}
