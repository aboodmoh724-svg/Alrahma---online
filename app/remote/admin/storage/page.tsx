import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocalUploadsDir, publicStorageUrl } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type StorageFile = {
  name: string;
  folder: string;
  relativePath: string;
  size: number;
  updatedAt: Date;
};

async function requireRemoteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: { id: true },
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

async function listStorageFiles(rootDir: string, currentDir = "", collected: StorageFile[] = []) {
  if (collected.length >= 300) return collected;

  const absoluteDir = path.join(/*turbopackIgnore: true*/ rootDir, currentDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (collected.length >= 300) break;

    const relativePath = currentDir ? `${currentDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await listStorageFiles(rootDir, relativePath, collected);
      continue;
    }

    if (!entry.isFile()) continue;

    const absolutePath = path.join(/*turbopackIgnore: true*/ rootDir, relativePath);
    const stat = await fs.stat(absolutePath).catch(() => null);
    if (!stat) continue;

    collected.push({
      name: entry.name,
      folder: currentDir || "/",
      relativePath,
      size: stat.size,
      updatedAt: stat.mtime,
    });
  }

  return collected;
}

export default async function RemoteAdminStoragePage() {
  const currentAdmin = await requireRemoteAdmin();
  if (!currentAdmin) redirect("/remote/admin/login");

  const rootDir = getLocalUploadsDir();
  const files = (await listStorageFiles(rootDir)).sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime());
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const folders = new Set(files.map((file) => file.folder)).size;

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-[#102f34] p-6 text-white shadow-xl">
          <div>
            <p className="text-sm font-black text-[#f2d18a]">لوحة الإدارة</p>
            <h1 className="mt-2 text-3xl font-black">ملفات التخزين الداخلي</h1>
            <p className="mt-3 text-sm leading-7 text-white/75">هذه الملفات محفوظة داخل السيرفر في مجلد uploads المحلي.</p>
          </div>
          <Link href="/remote/admin/dashboard" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0a3f2a]">
            الرجوع للإدارة
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/60">عدد الملفات الظاهرة</p>
            <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{files.length}</p>
          </div>
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/60">المجلدات</p>
            <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{folders}</p>
          </div>
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/60">الحجم التقريبي</p>
            <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{formatSize(totalSize)}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-white/90 shadow-sm ring-1 ring-[#d8bf83]">
          <div className="border-b border-[#ead9b4] p-5">
            <h2 className="text-xl font-black text-[#1c2d31]">آخر الملفات</h2>
            <p className="mt-2 text-xs font-bold text-[#1c2d31]/55">المسار على السيرفر: {rootDir}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-[#fffaf4] text-[#1c2d31]/65">
                <tr>
                  <th className="px-4 py-3">الملف</th>
                  <th className="px-4 py-3">المجلد</th>
                  <th className="px-4 py-3">الحجم</th>
                  <th className="px-4 py-3">آخر تعديل</th>
                  <th className="px-4 py-3">فتح</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.relativePath} className="border-t border-[#f0e2c2]">
                    <td className="px-4 py-3 font-black text-[#1c2d31]">{file.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#1c2d31]/65" dir="ltr">{file.folder}</td>
                    <td className="px-4 py-3 text-[#1c2d31]/75">{formatSize(file.size)}</td>
                    <td className="px-4 py-3 text-[#1c2d31]/75">{file.updatedAt.toLocaleString("ar")}</td>
                    <td className="px-4 py-3">
                      <Link href={publicStorageUrl(file.relativePath) || "#"} target="_blank" className="rounded-xl bg-[#0a3f2a] px-4 py-2 text-xs font-black text-white">
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center font-bold text-[#1c2d31]/55">
                      لا توجد ملفات داخل مجلد التخزين حاليا.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

