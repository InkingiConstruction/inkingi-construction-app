import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "projects", title: "Projects", icon: "business-outline" },
        { name: "inspections", title: "Inspect", icon: "clipboard-outline" },
        { name: "progress-review", title: "Review", icon: "checkmark-done-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "notifications", title: "Alerts", icon: "notifications-outline" },
        { name: "profile", title: "Profile", icon: "person-circle-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
    />
  );
}
