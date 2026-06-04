import { RoleTabs } from "@/components/role-tabs";

export default function RootLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Home", icon: "home-outline" },
        { name: "inventory", title: "Store", icon: "storefront-outline" },
        { name: "rfqs", title: "RFQs", icon: "receipt-outline" },
        { name: "quotes", title: "Quotes", icon: "document-text-outline" },
        { name: "purchase-orders", title: "Orders", icon: "cart-outline" },
        { name: "deliveries", title: "Deliver", icon: "cube-outline" },
        { name: "messages", title: "Chat", icon: "chatbubbles-outline" },
        { name: "settings", title: "Settings", icon: "settings-outline" },
      ]}
      hiddenRoutes={["notifications", "profile", "profile-edit"]}
    />
  );
}
