import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
import { syncUser } from "@/lib/actions/users";

async function AdminPage() {
  const user = await currentUser();

  // user is not logged in
  if (!user) redirect("/");

  // Ensure user is synced to database
  await syncUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = user.emailAddresses[0]?.emailAddress;

  // user is not the admin
  if (!adminEmail || userEmail !== adminEmail) redirect("/dashboard");

  return <AdminDashboardClient />;
}

export default AdminPage;
