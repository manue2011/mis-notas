import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageMenu } from "@/components/page/PageMenu";
import { PageView } from "@/components/page/PageView";
import { TopBar } from "@/components/workspace/TopBar";
import { getPage } from "@/lib/pages/queries";
import { can } from "@/lib/workspace/access";

type Params = PageProps<"/espacio/[slug]/p/[pageId]">["params"];

export default function NotebookPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="min-h-16 border-b border-dashed border-border" />}>
      <PageScreen params={params} />
    </Suspense>
  );
}

async function PageScreen({ params }: { params: Params }) {
  const { slug, pageId } = await params;
  if (!z.uuid().safeParse(pageId).success) notFound();

  const page = await getPage(slug, pageId);
  if (!page) notFound();
  const { access } = page;

  return (
    <>
      <TopBar
        crumbs={[
          { label: access.name, href: `/espacio/${access.slug}` },
          { label: page.title || "Sin título" },
        ]}
      >
        {can(access.role, { page: ["delete"] }) ? (
          <PageMenu organizationId={access.organizationId} pageId={page.id} />
        ) : null}
      </TopBar>
      <PageView
        // Remount when switching pages so the editor starts from that page's content.
        key={page.id}
        organizationId={access.organizationId}
        pageId={page.id}
        title={page.title}
        content={page.content}
        updatedAt={page.updatedAt.toISOString()}
        updatedByName={page.updatedByName}
        editable={can(access.role, { page: ["update"] })}
      />
    </>
  );
}
