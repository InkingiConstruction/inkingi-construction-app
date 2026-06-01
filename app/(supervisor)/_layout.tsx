import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
      ]}
      hiddenRoutes={[
        "inspections",
        "progress-review",
        "notifications",
        "profile",
        "settings",
      ]}
    />
  );
}
