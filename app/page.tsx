import { redirect } from "next/navigation";

// The drills hub is the student home; every signed-in entry point lands here.
export default function Home() {
  redirect("/drills");
}
