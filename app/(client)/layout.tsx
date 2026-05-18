import { BrandHeader } from "@/components/brand/BrandHeader";
import { ClientNav } from "@/components/brand/ClientNav";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <BrandHeader actions={<ClientNav />} />
      <main className="flex-1 bg-background p-6 md:p-8">{children}</main>
      <ChatWidget />
    </div>
  );
}
