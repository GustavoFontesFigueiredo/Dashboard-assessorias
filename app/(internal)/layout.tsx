import { BrandHeader } from "@/components/brand/BrandHeader";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <BrandHeader />
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
