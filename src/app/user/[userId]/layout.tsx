// app/app/[userId]/layout.tsx
import { ReactNode } from "react";
import RoleRedirect from "@/components/RoleRedirect";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RoleRedirect />
      {children}
    </>
  );
}