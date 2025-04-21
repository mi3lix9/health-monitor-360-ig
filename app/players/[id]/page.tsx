import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { RealtimePlayerDetails } from "@/components/realtime-player-details";

interface PlayerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  return (
    <SidebarLayout>
      <RealtimePlayerDetails id={(await params).id} />
    </SidebarLayout>
  );
}
