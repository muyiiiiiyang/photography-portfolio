import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoon } from "@/components/site/ComingSoon";
import { CollectionView } from "@/components/site/CollectionView";
import { getFolderBySlug, getFolders } from "@/lib/api/portfolio";
import { PLACEHOLDER_FOLDER_SLUG } from "@/lib/constants";
import { formatDate } from "@/lib/format";

interface FolderPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const folders = await getFolders();
  if (folders.length === 0) return [{ slug: PLACEHOLDER_FOLDER_SLUG }];
  return folders.map((folder) => ({ slug: folder.slug }));
}

export async function generateMetadata({
  params,
}: FolderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const folder = await getFolderBySlug(slug);

  if (!folder) {
    if (slug === PLACEHOLDER_FOLDER_SLUG) {
      return { title: "专题即将上线", robots: { index: false, follow: false } };
    }
    return { title: "专题未找到" };
  }

  return {
    title: folder.title,
    description: folder.description ?? `${folder.title}：主题摄影专题。`,
  };
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { slug } = await params;
  const folder = await getFolderBySlug(slug);

  if (!folder) {
    if (slug === PLACEHOLDER_FOLDER_SLUG) {
      return (
        <ComingSoon
          eyebrow="Series / Soon"
          title="专题即将上线"
          description="一组照片，一条线索。新的主题序列将和作品一起上线。"
          backHref="/folders"
          backLabel="返回专题 / SERIES"
        />
      );
    }
    notFound();
  }

  const folders = await getFolders();
  const siblings = folders.filter(
    (item) => item.parentId === folder.parentId,
  );
  const siblingIndex = siblings.findIndex((item) => item.slug === folder.slug);
  const next =
    siblings.length > 1
      ? siblings[(siblingIndex + 1) % siblings.length]
      : null;

  const backHref = folder.parent
    ? `/folders/${folder.parent.slug}`
    : "/folders";
  const backLabel = folder.parent
    ? `返回 ${folder.parent.title}`
    : "返回专题 / SERIES";

  return (
    <CollectionView
      code={`Series ${String(Math.max(siblingIndex, 0) + 1).padStart(2, "0")}`}
      title={folder.title}
      subtitle={folder.subtitle}
      description={folder.description}
      meta={[
        { label: "作品", value: `${String(folder.count).padStart(2, "0")} frames` },
        ...(folder.parent
          ? []
          : [
              {
                label: "子专题",
                value: `${String(folder.children.length).padStart(2, "0")}`,
              },
              { label: "标签", value: `${folder.tags.length}` },
            ]),
        { label: "最近拍摄", value: formatDate(folder.latestTakenAt) },
      ]}
      cover={folder.cover}
      photos={folder.photos}
      childSeries={folder.children}
      backHref={backHref}
      backLabel={backLabel}
      next={
        next
          ? {
              href: `/folders/${next.slug}`,
              title: next.title,
              label: `Series ${String(
                ((siblingIndex + 1) % siblings.length) + 1,
              ).padStart(2, "0")} / 下一组`,
            }
          : undefined
      }
    />
  );
}
