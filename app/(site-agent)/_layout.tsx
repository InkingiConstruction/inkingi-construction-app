import { RoleTabs } from "@/components/role-tabs";

export default function SiteAgentLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "daily-report", title: "Reports", icon: "clipboard-outline" },
        { name: "inventory", title: "Stock", icon: "cube-outline" },
        { name: "receiving", title: "Receive", icon: "keypad-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
      hiddenRoutes={["profile-edit"]}
    />
  );
}
