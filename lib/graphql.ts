import "server-only";

import type { WPMenuItem, WPPage, WPSiteSettings } from "@/types";

const REVALIDATE_SECONDS = 60;

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function getGraphqlEndpoint(): string {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_URL is not set");
  }
  return `${url.replace(/\/$/, "")}/graphql`;
}

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { revalidate?: number | false }
): Promise<T> {
  const revalidate = options?.revalidate ?? REVALIDATE_SECONDS;
  const response = await fetch(getGraphqlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next:
      revalidate === false
        ? undefined
        : {
            revalidate,
          },
    cache: revalidate === false ? "no-store" : undefined,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `WPGraphQL HTTP error ${response.status}: ${body.slice(0, 300)}`
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("WPGraphQL returned no data");
  }
  return json.data;
}

const SITE_SETTINGS_QUERY = /* GraphQL */ `
  query SiteSettings {
    generalSettings {
      title
      description
      url
    }
  }
`;

const MENU_QUERY = /* GraphQL */ `
  query PrimaryMenu($location: String!) {
    menuItems(where: { location: $location }, first: 50) {
      nodes {
        id
        label
        url
        path
        parentId
        cssClasses
      }
    }
  }
`;

const PAGE_BY_SLUG_QUERY = /* GraphQL */ `
  query PageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      slug
      title
      content
      excerpt
      date
      modified
    }
  }
`;

const PAGES_SLUGS_QUERY = /* GraphQL */ `
  query PageSlugs($first: Int!) {
    pages(first: $first, where: { status: PUBLISH }) {
      nodes {
        slug
      }
    }
  }
`;

export async function getSiteSettings(): Promise<WPSiteSettings> {
  const data = await graphqlFetch<{
    generalSettings: WPSiteSettings;
  }>(SITE_SETTINGS_QUERY);
  return data.generalSettings;
}

function toAppPath(urlOrPath: string, siteUrl?: string): string {
  if (!urlOrPath) return "/";
  if (urlOrPath.startsWith("/")) return urlOrPath;
  try {
    const parsed = new URL(urlOrPath);
    if (siteUrl) {
      const origin = new URL(siteUrl).origin;
      if (parsed.origin === origin) {
        return parsed.pathname || "/";
      }
    }
    return urlOrPath;
  } catch {
    return urlOrPath;
  }
}

export async function getPrimaryMenu(
  location = "PRIMARY"
): Promise<WPMenuItem[]> {
  try {
    const data = await graphqlFetch<{
      menuItems: { nodes: WPMenuItem[] };
    }>(MENU_QUERY, { location });

    const siteUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    return data.menuItems.nodes.map((item) => ({
      ...item,
      path: item.path || toAppPath(item.url, siteUrl),
    }));
  } catch {
    // Menu location names vary by theme; fall back to empty nav.
    return [];
  }
}

export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  const uri = slug.startsWith("/") ? slug : `/${slug}`;
  try {
    const data = await graphqlFetch<{
      page: {
        id: string;
        slug: string;
        title: string;
        content: string;
        excerpt?: string;
        date?: string;
        modified?: string;
      } | null;
    }>(PAGE_BY_SLUG_QUERY, { slug: uri });

    if (!data.page) return null;

    return {
      id: data.page.id,
      slug: data.page.slug,
      title: data.page.title,
      content: data.page.content,
      excerpt: data.page.excerpt,
      date: data.page.date,
      modified: data.page.modified,
    };
  } catch {
    return null;
  }
}

export async function getPageSlugs(first = 50): Promise<string[]> {
  try {
    const data = await graphqlFetch<{
      pages: { nodes: Array<{ slug: string }> };
    }>(PAGES_SLUGS_QUERY, { first });
    return data.pages.nodes.map((n) => n.slug).filter(Boolean);
  } catch {
    return [];
  }
}
