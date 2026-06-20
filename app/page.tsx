import { redirect } from "next/navigation";

// Students arriving from the 1500 dashboard land straight on the practice-test picker.
export default function Home() {
  redirect("/practice-test");
}
