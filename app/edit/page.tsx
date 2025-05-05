'use client';

import { useEffect, useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import EditableFields from '../components/EditableFields';
import ProjectSelector from '../components/ProjectSelector';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { InvoiceField } from '../types';
import PdfPreviewFrame from '../components/PdfPreviewFrame';

// Helper to convert base64 to Blob
function base64ToBlob(base64: string, mime = 'application/pdf') {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
}

const EditPage = () => {
    const router = useRouter();
    const supabase = createSupabaseClient();

    const [fields, setFields] = useState<InvoiceField[]>([]);
    const [project, setProject] = useState<string>('');
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [projects, setProjects] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const raw = sessionStorage.getItem('openai_json');
                const pdfBase64 = sessionStorage.getItem('pdf_base64');

                if (raw && pdfBase64) {
                    const parsed = JSON.parse(raw);
                    if (parsed.invoice_data && Array.isArray(parsed.invoice_data)) {
                        setFields(parsed.invoice_data);
                    } else {
                        setError('Invalid data structure received from AI processing');
                    }
                    // Convert base64 to Blob and create a blob URL
                    const blob = base64ToBlob(pdfBase64);
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                } else {
                    setError('No data found. Please upload and process an invoice first.');
                }

                const { data, error } = await supabase.from('projects').select('name');
                if (error) throw error;
                setProjects(data.map((p) => p.name));
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data. Please try again.');
            }
        };

        loadData();

        // Cleanup function to revoke blob URL when component unmounts
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, []);

    const createProjectIfNeeded = async () => {
        if (!project) throw new Error('No project selected');
        if (projects.includes(project)) return;

        const { error } = await supabase.from('projects').insert({ name: project });
        if (error) throw error;
    };

    const handleSave = async () => {
        if (!project || fields.length === 0) {
            setError('Please complete all fields and select a project.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await createProjectIfNeeded();

            // Get the PDF base64 from sessionStorage
            const pdfBase64 = sessionStorage.getItem('pdf_base64');
            if (!pdfBase64) {
                throw new Error('PDF data not found');
            }
            // Convert base64 to Blob
            const pdfBlob = base64ToBlob(pdfBase64);

            // Create a FormData object with the PDF blob
            const formData = new FormData();
            formData.append('file', pdfBlob, 'invoice.pdf');
            formData.append('fields', JSON.stringify(fields));
            formData.append('project', project);

            const response = await fetch('/api/saveProcessedData', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Clean up sessionStorage
                sessionStorage.removeItem('openai_json');
                sessionStorage.removeItem('pdf_base64');
                router.push('/dashboard');
            } else {
                throw new Error('Failed to save data');
            }
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save data. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* PDF Preview */}
                    <div className="w-full md:w-1/2 h-[90vh] rounded-xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 shadow-xl">
                        <PdfPreviewFrame src={pdfUrl} />
                    </div>

                    {/* Editor */}
                    <div className="w-full md:w-1/2 space-y-6">
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

                            <EditableFields fields={fields} onChange={setFields} />
                            <ProjectSelector projects={projects} onSelect={setProject} />
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                <X size={20} />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={20} />
                                <span>{isSaving ? 'Saving...' : 'Save to Database'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPage;
