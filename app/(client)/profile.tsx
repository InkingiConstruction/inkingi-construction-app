import { Redirect } from "expo-router";

// Profile is now consolidated into the Settings screen.
export default function ProfileRedirect() {
  return <Redirect href="/(client)/settings" />;
}
