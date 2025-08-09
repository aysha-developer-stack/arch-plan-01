import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/Header";
import SearchInterface from "@/components/SearchInterface";
import type { UserType } from "@shared/schema";

export default function Home() {
  const { user } = useAuth({ skipAuthCheck: true }) as { user: UserType | undefined };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <SearchInterface />
    </div>
  );
}
