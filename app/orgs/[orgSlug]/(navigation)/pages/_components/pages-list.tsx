import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { PlusIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { CreatePageDialog } from "./create-page-dialog";

export async function PagesList() {
  const { org } = await getRequiredCurrentOrgCache();

  const pages = await prisma.reviewPage.findMany({
    where: {
      organizationId: org.id,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      organizationId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (pages.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <PlusIcon className="size-6 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">No review pages yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first review page to start collecting feedback
          </p>
        </div>
        <CreatePageDialog />
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id}>
              <TableCell>{page.name}</TableCell>
              <TableCell>
                {new Date(page.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/orgs/${org.slug}/pages/${page.id}`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
