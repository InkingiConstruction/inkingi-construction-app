import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "payments", title: "Payments", icon: "card-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
      ]}
      hiddenRoutes={[
        "create-project",
        "progress",
        "assign-engineer",
        "assign-supervisor",
        "notifications",
        "profile",
        "profile-edit",
        "settings",
      ]}
    />
  );
}
