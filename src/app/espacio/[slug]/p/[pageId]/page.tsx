import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageMenu } from "@/components/page/PageMenu";
import { PageView } from "@/components/page/PageView";
import { SubpageList } from "@/components/page/SubpageList";
import { TopBar } from "@/components/workspace/TopBar";
import { getPage, listPages } from "@/lib/pages/queries";
import { ancestorsOf, childrenOf } from "@/lib/pages/tree";
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

  // listPages is the same (cached) query the sidebar uses.
  const [page, pages] = await Promise.all([getPage(slug, pageId), listPages(slug)]);
  if (!page) notFound();
  const { access } = page;
  const base = `/espacio/${access.slug}`;
  const subpages = childrenOf(pages, page.id);

  // Long paths keep the first and last ancestors: "Espacio / Manuales / … / Alta / Página".
  let ancestors: { label: string; href?: string }[] = ancestorsOf(pages, page.id).map((p) => ({
    label: p.title || "Sin título",
    href: `${base}/p/${p.id}`,
  }));
  if (ancestors.length > 3) ancestors = [ancestors[0], { label: "…" }, ancestors[ancestors.length - 1]];

  return (
    <>
      <TopBar
        crumbs={[
          { label: access.name, href: base },
          ...ancestors,
          { label: page.title || "Sin título" },
        ]}
      >
        {can(access.role, { page: ["delete"] }) ? (
          <PageMenu
            organizationId={access.organizationId}
            pageId={page.id}
            hasSubpages={subpages.length > 0}
          />
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
      <SubpageList
        slug={access.slug}
        organizationId={access.organizationId}
        pageId={page.id}
        subpages={subpages}
        canCreate={can(access.role, { page: ["create"] })}
      />
    </>
  );
}
