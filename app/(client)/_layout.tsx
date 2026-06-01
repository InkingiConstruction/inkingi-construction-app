import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "create-project", title: "Create", icon: "add-circle-outline" },
        {
          name: "assign-engineer",
          title: "Engineer",
          icon: "construct-outline",
        },
        {
          name: "assign-supervisor",
          title: "Supervisor",
          icon: "shield-checkmark-outline",
        },
        { name: "payments", title: "Payments", icon: "card-outline" },
        { name: "progress", title: "Progress", icon: "trending-up-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "notifications", title: "Alerts", icon: "notifications-outline" },
        { name: "profile", title: "Profile", icon: "person-circle-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
    />
  );
}
