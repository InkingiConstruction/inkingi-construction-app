import { RoleTabs } from "@/components/role-tabs";

export default function SiteAgentLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
      hiddenRoutes={["daily-report", "inventory", "profile-edit", "privacy", "receiving", "terms"]}
    />
  );
}
