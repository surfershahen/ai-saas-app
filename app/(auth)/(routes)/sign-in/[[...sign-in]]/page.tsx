import React from "react";
import { SignIn } from "@clerk/nextjs";
export default function page() {
  return <SignIn afterSignInUrl="/dashboard" />;
}
