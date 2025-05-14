"use client";

import { useEffect, useState } from "react";
import EditableFields from "../components/EditableFields";
import ProjectSelector from "../components/ProjectSelector";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { EditableInvoice } from "../types";
import PdfPreviewFrame from "../components/PdfPreviewFrame";
import SaveButton from "../components/SaveButton";
import { AlertCircle } from "lucide-react";

const EditPage = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [project, setProject] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [projects, setProjects] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = sessionStorage.getItem("openai_json");
        const pdfBase64 = sessionStorage.getItem("pdf_base64");
        
        if (raw && pdfBase64) {
          try {
            const parsed = JSON.parse(raw);
            
            if (
              parsed &&
              typeof parsed === "object" &&
              parsed.invoice_data &&
              Array.isArray(parsed.invoice_data)
            ) {
              setFields({ ...parsed, id: parsed.id || crypto.randomUUID() });
            } else {
              setError("Invalid data structure received from AI processing");
            }
          } catch {
            setError("Failed to parse JSON data from AI processing");
          }
          
          setPdfUrl(pdfBase64);
        } else {
          setError(
            "No data found. Please upload and process an invoice first."
          );
        }

        const { data, error } = await supabase.from("projects").select("name");
        if (error) throw error;
        setProjects(data.map((p) => p.name));
      } catch {
        setError("Failed to load data. Please try again.");
      }
    };

    loadData();

  }, [supabase]);

  const createProjectIfNeeded = async () => {
    if (!project) throw new Error("No project selected");
    if (projects.includes(project)) return;

    const { data: projectData } = await supabase
      .from('projects')
      .select('id')
      .eq('name', project)
      .single();

    if (!projectData) {
      const { error } = await supabase.from("projects").insert({ name: project });
      if (error) throw error;
    }
  };

  const handleSave = async () => {
    if (!project || !fields) {
      setError('Please complete all fields and select a project.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createProjectIfNeeded();

      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('You must be logged in to save data.');
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/saveProcessedData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fields, project }),
      });

      if (response.ok) {
        sessionStorage.removeItem('openai_json');
        sessionStorage.removeItem('pdf_base64');
        router.push('/dashboard');
      } else {
        throw new Error('Failed to save data');
      }
    } catch {
      setError('Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-3/4 h-[90vh] rounded-xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 shadow-xl flex items-center justify-center">
            {pdfUrl && <PdfPreviewFrame src={pdfUrl} />}
          </div>

          <div className="w-full md:w-1/2 space-y-6 md:max-w-lg">
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 space-y-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Edit Invoice Data
              </h2>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {fields && (
                <EditableFields fields={fields} onChange={setFields} />
              )}
              <ProjectSelector onSelect={setProject} />
            </div>

            <div className="flex gap-4 justify-end">
              <SaveButton isSaving={isSaving} onSave={handleSave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPage;
