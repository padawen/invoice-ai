"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../providers";
import { fakeProjects } from "../fakeData";
import ProjectCard from "../components/ProjectCard";
import slugify from "slugify";
import BackButton from "../components/BackButton";
import DeleteModal from "../components/modals/DeleteModal";
import Footer from "../components/Footer";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Skeleton } from "../components/ui/Skeleton";
import { logger } from "@/lib/logger";

interface Project {
  id: string;
  name: string;
}

interface ExtractionStats {
  openai: number;
  privacy: number;
  total: number;
}

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();

  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    if (!supabaseRef.current) {
      const client = createSupabaseBrowserClient();
      if (client) {
        supabaseRef.current = client;
        setSupabase(client);
      }
    }
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [projectStats, setProjectStats] = useState<Record<string, ExtractionStats>>({});

  useEffect(() => {
    if (user !== undefined) {
      setAuthInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!authInitialized) return;

      if (user && supabase) {
        try {
          const { data: projectsData, error: projectsError } = await supabase
            .from("projects")
            .select("id, name");

          if (projectsError) {
            logger.error("Error fetching projects", projectsError);
            return;
          }

          if (projectsData) {
            setProjects(projectsData);

            const projectIds = projectsData.map(p => p.id);

            if (projectIds.length > 0) {
              const { data: allStats, error: statsError } = await supabase
                .from("processed_data")
                .select("project_id, extraction_method")
                .in("project_id", projectIds);

              if (statsError) {
                logger.error("Error fetching stats", statsError);
              } else if (allStats) {
                const stats: Record<string, ExtractionStats> = {};

                projectsData.forEach(p => {
                  stats[p.id] = { openai: 0, privacy: 0, total: 0 };
                });

                allStats.forEach(item => {
                  if (stats[item.project_id]) {
                    stats[item.project_id].total++;
                    if (item.extraction_method === 'openai') {
                      stats[item.project_id].openai++;
                    } else if (item.extraction_method === 'privacy') {
                      stats[item.project_id].privacy++;
                    }
                  }
                });

                setProjectStats(stats);
              }
            }
          }
        } catch (err) {
          logger.error("Failed to fetch projects", err);
        }
      } else if (authInitialized && !user) {
        setProjects(fakeProjects);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user, supabase, authInitialized]);

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
        logger.error("Failed to delete project", undefined, { data: { response: await res.text() } });
        alert("Failed to delete project.");
        setShowDeleteModal(null);
        return;
      }
    } else {
      alert("This is a demo mode - your project is not actually being deleted from a database.");
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setShowDeleteModal(null);
  };

  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white select-none pb-16">
        <div className="max-w-5xl mx-auto py-12 px-4">
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="w-24" />
              <div className="flex-1 flex justify-center">
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="w-24" />
            </div>
            <div className="w-full border-b border-zinc-700/60 mb-6" />
          </div>

          <div className="bg-zinc-900/70 rounded-2xl shadow-2xl p-8 border border-zinc-800">
            <div className="flex items-center mb-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="ml-3 h-6 w-24 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-6 flex flex-col gap-4">
                  <Skeleton className="h-8 w-3/4" />
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white select-none pb-16">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-full flex items-center justify-between mb-4">
            <BackButton fallbackUrl="/" />
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-green-400 text-center tracking-tight drop-shadow-lg">
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
                className="bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg text-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
                onClick={() => router.push("/upload")}
              >
                Upload your first invoice
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Your Projects</h2>
                <div className="ml-3 px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                {projects.map(({ id, name }) => {
                  const slug = slugify(name, { lower: true, strict: true });
                  return (
                    <ProjectCard
                      key={id}
                      id={id}
                      name={name}
                      onClick={() => router.push(`/projects/${slug}`)}
                      onDelete={() => setShowDeleteModal({ id, name })}
                      extractionStats={projectStats[id]}
                    />
                  );
                })}
              </div>
            </>
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
      <Footer />
    </div>
  );
}
