import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
      hiddenRoutes={[
        "inspections",
        "progress-review",
        "progress-detail",
        "notifications",
        "profile",
        "profile-edit",
      ]}
    />
  );
}
