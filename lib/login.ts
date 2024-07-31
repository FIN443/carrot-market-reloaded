import { redirect } from "next/navigation";
import getSession from "./session";

export default async function logIn(userId: number) {
  const session = await getSession();
  session.id = userId;
  await session.save();
  redirect("/profile");
}
