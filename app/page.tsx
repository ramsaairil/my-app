import { redirect } from "next/navigation";

export default function LandingPage() {
  // Redirect directly to the login page
  redirect("/login");
}
