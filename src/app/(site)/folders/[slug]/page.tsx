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
  const index = folders.findIndex((item) => item.slug === folder.slug);
  const next = folders.length > 1 ? folders[(index + 1) % folders.length] : null;

  return (
    <CollectionView
      code={`Series ${String(Math.max(index, 0) + 1).padStart(2, "0")}`}
      title={folder.title}
      subtitle={folder.subtitle}
      description={folder.description}
      meta={[
        { label: "作品", value: `${String(folder.count).padStart(2, "0")} frames` },
        { label: "标签", value: `${folder.tags.length}` },
        { label: "最近拍摄", value: formatDate(folder.latestTakenAt) },
      ]}
      accent={folder.accent}
      cover={folder.cover}
      photos={folder.photos}
      backHref="/folders"
      backLabel="返回专题 / SERIES"
      next={
        next
          ? {
              href: `/folders/${next.slug}`,
              title: next.title,
              label: `Series ${String(
                ((index + 1) % folders.length) + 1,
              ).padStart(2, "0")} / 下一组`,
            }
          : undefined
      }
    />
  );
}
