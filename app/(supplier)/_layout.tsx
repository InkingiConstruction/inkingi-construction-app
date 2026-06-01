import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "rfqs", title: "RFQs", icon: "receipt-outline" },
        { name: "quotes", title: "Quotes", icon: "document-text-outline" },
        { name: "purchase-orders", title: "Orders", icon: "cart-outline" },
        { name: "deliveries", title: "Deliver", icon: "cube-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "notifications", title: "Alerts", icon: "notifications-outline" },
        { name: "profile", title: "Profile", icon: "person-circle-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
    />
  );
}
