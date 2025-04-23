'use client';

import { useEffect, useState } from 'react';
import EditableFields from '../components/EditableFields';
import ProjectSelector from '../components/ProjectSelector';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { InvoiceField } from '../types';
import PdfPreviewFrame from '../components/PdfPreviewFrame';

const EditPage = () => {
    const router = useRouter();
    const supabase = createSupabaseClient();

    const [fields, setFields] = useState<InvoiceField[]>([]);
    const [project, setProject] = useState<string>('');
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [projects, setProjects] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const raw = localStorage.getItem('openai_json');
                const pdf = localStorage.getItem('pdf_url');

                if (raw && pdf) {
                    const parsed = JSON.parse(raw);
                    if (parsed.invoice_data && Array.isArray(parsed.invoice_data)) {
                        setFields(parsed.invoice_data);
                    } else {
                        console.error('Invalid JSON structure (expected invoice_data array):', parsed);
                    }
                    setPdfUrl(pdf);
                }

                const { data, error } = await supabase.from('projects').select('name');
                if (error) throw error;
                setProjects(data.map((p) => p.name));
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };

        loadData();
    }, []);

    const createProjectIfNeeded = async () => {
        if (!project) throw new Error('No project selected');
        if (projects.includes(project)) return;

        const { error } = await supabase.from('projects').insert({ name: project });
        if (error) throw error;
    };

    const handleSave = async () => {
        if (!project || fields.length === 0) {
            return alert('Please complete all fields.');
        }

        try {
            await createProjectIfNeeded();

            const response = await fetch('/api/saveProcessedData', {
                method: 'POST',
                body: JSON.stringify({ fields, project, pdfUrl }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                localStorage.removeItem('openai_json');
                localStorage.removeItem('pdf_url');
                router.push('/dashboard');
            } else {
                alert('Error saving data');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save data.');
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* PDF Preview */}
            <div className="w-full md:w-1/2 h-[90vh] border rounded-xl shadow">
                <PdfPreviewFrame src={pdfUrl} />
            </div>
            {/* Editor */}
            <div className="w-full md:w-1/2 space-y-6">
                <EditableFields fields={fields} onChange={setFields} />
                <ProjectSelector projects={projects} onSelect={setProject} />
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded text-black font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-semibold"
                    >
                        Save to Database
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPage;
