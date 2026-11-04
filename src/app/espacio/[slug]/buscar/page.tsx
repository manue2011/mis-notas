import { Suspense } from "react";
import { HandUnderline } from "@/components/ui/HandUnderline";
import { SearchField } from "@/components/search/SearchField";
import { SearchResults } from "@/components/search/SearchResults";
import { TopBar } from "@/components/workspace/TopBar";
import { listPages } from "@/lib/pages/queries";
import { searchPages, searchQuerySchema } from "@/lib/pages/search";
import { searchTerms } from "@/lib/pages/search-terms";
import { ancestorsOf } from "@/lib/pages/tree";
import { requireWorkspaceBySlug } from "@/lib/workspace/access";

type Props = PageProps<"/espacio/[slug]/buscar">;

export default function SearchPage(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-16 border-b border-dashed border-border" />}>
      <SearchScreen {...props} />
    </Suspense>
  );
}

async function SearchScreen({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q } = await searchParams;
  const parsed = searchQuerySchema.safeParse(typeof q === "string" ? q : "");
  const query = parsed.success ? parsed.data : "";

  const access = await requireWorkspaceBySlug(slug, { page: ["read"] });
  const terms = searchTerms(query);
  const [hits, pages] = await Promise.all([searchPages(access.organizationId, query), listPages(slug)]);
  const withPaths = hits.map((hit) => ({
    ...hit,
    path: ancestorsOf(pages, hit.id).map((p) => p.title || "Sin título"),
  }));

  return (
    <>
      <TopBar crumbs={[{ label: access.name, href: `/espacio/${access.slug}` }, { label: "Buscar" }]} />
      <div className="w-full max-w-3xl px-6 py-12 md:px-16">
        <h1 className="inline-block font-serif text-4xl font-medium tracking-tight">
          Buscar
          <HandUnderline className="mt-1" />
        </h1>
        <div className="mt-8">
          <SearchField slug={access.slug} defaultValue={query} variant="page" autoFocus={!query} />
        </div>
        {terms.length > 0 ? (
          <SearchResults slug={access.slug} hits={withPaths} terms={terms} query={query} />
        ) : (
          <p className="ruled mt-10 max-w-xl font-serif text-lg">
            Busca por título o por cualquier palabra de dentro de las páginas. Da igual escribir con tildes o
            sin ellas.
          </p>
        )}
      </div>
    </>
  );
}
