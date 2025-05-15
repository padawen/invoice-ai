"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import { useUser } from "../providers";
import { fakeProjects } from "../fakeData";
import ProjectCard from "../components/ProjectCard";
import slugify from "slugify";
import BackButton from "../components/BackButton";
import DeleteModal from "../components/DeleteModal";

interface Project {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!supabaseRef.current) {
        supabaseRef.current = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
      }
      setSupabase(supabaseRef.current);
    }
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user && supabase) {
        const { data, error } = await supabase.from("projects").select("id, name");
        if (!error && data) {
          setProjects(data);
        }
      } else {
        setProjects(fakeProjects);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user, supabase]);

  const handleNameSave = async (id: string, newName: string) => {
    if (user && supabase) {
      await supabase.from("projects").update({ name: newName }).eq("id", id);
    }
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  };

  const handleDelete = async (projectId: string) => {
    if (user && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert("You must be logged in to delete a project.");
        return;
      }

      const res = await fetch("/api/project", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: projectId }),
      });

      if (!res.ok) {
        console.error("Failed to delete project:", await res.text());
        alert("Failed to delete project.");
        setShowDeleteModal(null);
        return;
      }
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setShowDeleteModal(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-full flex items-center justify-between mb-4">
            <BackButton fallbackUrl="/" />
            <div className="flex-1 flex justify-center">
              <h1 className="text-4xl font-extrabold text-green-400 text-center tracking-tight drop-shadow-lg">
                Dashboard
              </h1>
            </div>
            <div className="w-24" />
          </div>
          <div className="w-full border-b border-zinc-700/60 mb-6" />
        </div>

        <div className="bg-zinc-900/70 rounded-2xl shadow-2xl p-8 border border-zinc-800">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-zinc-400 text-lg mb-6">No projects found.</div>
              <button
                className="bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg text-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={() => router.push("/upload")}
              >
                Upload your first invoice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {projects.map(({ id, name }) => {
                const slug = slugify(name, { lower: true, strict: true });
                return (
                  <ProjectCard
                    key={id}
                    id={id}
                    name={name}
                    onSave={handleNameSave}
                    onClick={() => router.push(`/projects/${slug}`)}
                    onDelete={() => setShowDeleteModal({ id, name })}
                  />
                );
              })}
            </div>
          )}

          {showDeleteModal && (
            <DeleteModal
              open={!!showDeleteModal}
              onClose={() => setShowDeleteModal(null)}
              onConfirm={() => handleDelete(showDeleteModal.id)}
              title={`Delete Project "${showDeleteModal.name}"`}
              description="Are you sure you want to delete this project and all its data? This action cannot be undone."
            />
          )}
        </div>
      </div>
    </div>
  );
}
