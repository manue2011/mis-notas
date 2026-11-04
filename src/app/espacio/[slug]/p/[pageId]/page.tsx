import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageMenu } from "@/components/page/PageMenu";
import { PageView } from "@/components/page/PageView";
import { SubpageList } from "@/components/page/SubpageList";
import { TrashedPageNotice } from "@/components/trash/TrashedPageNotice";
import { TopBar } from "@/components/workspace/TopBar";
import { requireUser } from "@/lib/auth/session";
import { env, realtimeEnabled } from "@/lib/env";
import { screenshotUrlPattern } from "@/lib/pages/content";
import { getPage, listPages } from "@/lib/pages/queries";
import { getTrashedPageTitle } from "@/lib/pages/trash";
import { ancestorsOf, childrenOf, moveTargets, siblingMoves } from "@/lib/pages/tree";
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
  if (!page) {
    // A link to a deleted page: say where it went rather than a bare 404.
    const trashedTitle = await getTrashedPageTitle(slug, pageId);
    if (trashedTitle === null) notFound();
    return (
      <>
        <TopBar
          crumbs={[
            { label: "Papelera", href: `/espacio/${slug}/papelera` },
            { label: trashedTitle || "Sin título" },
          ]}
        />
        <TrashedPageNotice slug={slug} title={trashedTitle} />
      </>
    );
  }
  const { access } = page;
  const base = `/espacio/${access.slug}`;
  const subpages = childrenOf(pages, page.id);
  const canDelete = can(access.role, { page: ["delete"] });
  const canMove = can(access.role, { page: ["update"] });
  const user = await requireUser();
  const realtime = realtimeEnabled()
    ? { url: env().REALTIME_URL!, user: { id: user.id, name: user.name } }
    : undefined;

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
        {canDelete || canMove ? (
          <PageMenu
            organizationId={access.organizationId}
            pageId={page.id}
            hasSubpages={subpages.length > 0}
            canDelete={canDelete}
            move={
              canMove
                ? {
                    ...siblingMoves(pages, page.id),
                    parentId: pages.find((p) => p.id === page.id)?.parentId ?? null,
                    targets: moveTargets(pages, page.id),
                  }
                : undefined
            }
          />
        ) : null}
      </TopBar>
      <PageView
        // Remount when switching pages so the editor starts from that page's content.
        key={page.id}
        organizationId={access.organizationId}
        slug={access.slug}
        pageId={page.id}
        pages={pages}
        ownImagePattern={screenshotUrlPattern(env().CLOUDINARY_CLOUD_NAME, access.organizationId)?.source ?? null}
        realtime={realtime}
        title={page.title}
        content={page.content}
        updatedAt={page.updatedAt.toISOString()}
        updatedByName={page.updatedByName}
        editable={canMove}
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
