import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import SearchInterface from "@/components/SearchInterface";
import AdminInterface from "@/components/AdminInterface";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"search" | "admin">("search");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        user={user} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {activeTab === "search" ? (
        <SearchInterface />
      ) : (
        <AdminInterface />
      )}
    </div>
  );
}
