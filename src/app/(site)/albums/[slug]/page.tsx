import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionView } from "@/components/site/CollectionView";
import { getAlbumBySlug, getAlbums } from "@/lib/api/portfolio";
import { formatDate } from "@/lib/format";

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const albums = await getAlbums();
  return albums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) return { title: "相册未找到" };

  return {
    title: album.title,
    description:
      album.description ??
      `${album.title}：${album.count} 张摄影作品，拍摄于 ${album.location?.name ?? "未知地点"}。`,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();

  const albums = await getAlbums();
  const index = albums.findIndex((item) => item.slug === album.slug);
  const next = albums.length > 1 ? albums[(index + 1) % albums.length] : null;

  return (
    <CollectionView
      code={`Album ${String(Math.max(index, 0) + 1).padStart(2, "0")}`}
      title={album.title}
      subtitle={album.subtitle}
      description={album.description}
      meta={[
        { label: "年份", value: album.year },
        { label: "地点", value: album.location?.name ?? "—" },
        { label: "作品", value: `${String(album.count).padStart(2, "0")} frames` },
        { label: "最近拍摄", value: formatDate(album.latestTakenAt) },
      ]}
      accent={album.accent}
      cover={album.cover}
      photos={album.photos}
      backHref="/works"
      backLabel="返回作品集 / WORKS"
      next={
        next
          ? {
              href: `/albums/${next.slug}`,
              title: next.title,
              label: `Album ${String(
                ((index + 1) % albums.length) + 1,
              ).padStart(2, "0")} / 下一组`,
            }
          : undefined
      }
    />
  );
}
