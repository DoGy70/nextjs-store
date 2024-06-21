"use client";

import { adminLinks } from "@/app/utils/links";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside>
      {adminLinks.map((adminLink) => {
        const isActivePage = pathname === adminLink.href;
        const variant = isActivePage ? "default" : "ghost";

        return (
          <Button
            key={adminLink.href}
            asChild
            variant={variant}
            className="w-full mb-2 capitalize font-normal justify-start"
          >
            <Link key={adminLink.href} href={adminLink.href}>
              {adminLink.label}
            </Link>
          </Button>
        );
      })}
    </aside>
  );
}
export default Sidebar;
