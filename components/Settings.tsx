import React, { useState, useEffect } from 'react';
import { useMockApi } from '../hooks/useMockApi';
import { Service, User, ClinicalNoteTemplate, InventoryItem } from '../types';
import { SpinnerIcon, DownloadIcon, CoinsIcon, BoxIcon, TemplateIcon } from './icons';
import { FinancialsReport } from './FinancialsReport';
import { ManageInventory } from './ManageInventory';

interface SettingsProps {
    api: ReturnType<typeof useMockApi>;
    currentUser: User;
}

type SettingsTab = 'services' | 'users' | 'branches' | 'templates' | 'export' | 'financials' | 'inventory';

export const Settings: React.FC<SettingsProps> = ({ api, currentUser }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('services');
    const isAdmin = currentUser.role === 'admin';
    const isDoctor = currentUser.role === 'doctor';

    return (
        <div className="bg-white shadow-lg rounded-lg">
            <div className="p-6 border-b">
                <h1 className="text-3xl font-bold text-slate-800">Settings & Admin</h1>
                <p className="text-slate-500">Manage all aspects of your clinic's operations.</p>
            </div>
            <div className="flex border-b overflow-x-auto">
                {(isAdmin || isDoctor) && <TabButton title="Services" icon={<SpinnerIcon className="w-4 h-4" />} isActive={activeTab === 'services'} onClick={() => setActiveTab('services')} />}
                {isAdmin && <TabButton title="Users" icon={<User className="w-4 h-4" />} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />}
                {isAdmin && <TabButton title="Branches" icon={<SpinnerIcon className="w-4 h-4" />} isActive={activeTab === 'branches'} onClick={() => setActiveTab('branches')} />}
                {isDoctor && <TabButton title="Note Templates" icon={<TemplateIcon className="w-4 h-4" />} isActive={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />}
                {isAdmin && <TabButton title="Financials" icon={<CoinsIcon className="w-4 h-4" />} isActive={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />}
                {(isAdmin || isDoctor) && <TabButton title="Inventory" icon={<BoxIcon className="w-4 h-4" />} isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />}
                {isAdmin && <TabButton title="Export Data" icon={<DownloadIcon className="w-4 h-4" />} isActive={activeTab === 'export'} onClick={() => setActiveTab('export')} />}
            </div>
            <div className="p-6">
                {activeTab === 'services' && <ManageServices api={api} />}
                {activeTab === 'users' && <ManageUsers api={api} />}
                {activeTab === 'branches' && <ManageBranches api={api} />}
                {activeTab === 'templates' && isDoctor && <ManageTemplates api={api} currentUser={currentUser} />}
                {activeTab === 'export' && isAdmin && <ExportData api={api} />}
                {activeTab === 'financials' && isAdmin && <FinancialsReport api={api} />}
                {activeTab === 'inventory' && (isAdmin || isDoctor) && <ManageInventory api={api} />}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ title: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }> = ({ title, icon, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm whitespace-nowrap ${isActive ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
    >
        {icon} {title}
    </button>
);

const User: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" />
    </svg>
);


const ExportData: React.FC<{ api: ReturnType<typeof useMockApi> }> = ({ api }) => {
    const { getAllPatients, getAllInvoices } = api;
    const [isExporting, setIsExporting] = useState<null | 'patients' | 'invoices'>(null);
    
    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExportPatients = async () => {
        setIsExporting('patients');
        try {
            const patients = await getAllPatients();
            const headers = "id,name,phone,dob,gender\n";
            const csvContent = patients.map(p => `${p.id},"${p.name}","${p.phone}",${p.dob || ''},${p.gender || ''}`).join("\n");
            downloadCSV(headers + csvContent, 'patients_export.csv');
        } catch (e) {
            alert("Failed to export patients.");
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportInvoices = async () => {
        setIsExporting('invoices');
        try {
            const invoices = await getAllInvoices();
            const headers = "id,appointment_id,patient_name,service_name,amount,status,invoice_date\n";
            const csvContent = invoices.map(i => `${i.id},${i.appointment_id},"${i.patient_name}","${i.service_name}",${i.amount},${i.status},${i.invoice_date}`).join("\n");
            downloadCSV(headers + csvContent, 'invoices_export.csv');
        } catch (e) {
            alert("Failed to export invoices.");
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Export Clinic Data</h2>
            <p className="text-slate-500 mb-6">Download your clinic's data in CSV format for backups or external analysis.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={handleExportPatients} disabled={!!isExporting} className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-slate-50 disabled:opacity-50">
                    {isExporting ==='patients' ? <SpinnerIcon /> : <DownloadIcon />}
                    <span className="font-semibold">Export All Patients</span>
                </button>
                <button onClick={handleExportInvoices} disabled={!!isExporting} className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-slate-50 disabled:opacity-50">
                    {isExporting === 'invoices' ? <SpinnerIcon /> : <DownloadIcon />}
                    <span className="font-semibold">Export All Invoices</span>
                </button>
            </div>
        </div>
    );
};

const ManageTemplates: React.FC<{ api: ReturnType<typeof useMockApi>; currentUser: User }> = ({ api, currentUser }) => {
    const { getNoteTemplates, createNoteTemplate } = api;
    const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

    useEffect(() => {
        const fetchTemplates = async () => {
            if (currentUser.role === 'doctor') {
                try {
                    const data = await getNoteTemplates(currentUser.id);
                    setTemplates(data);
                } catch (e) {
                    console.error("Failed to fetch templates");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, [currentUser.id, currentUser.role, getNoteTemplates]);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newTemplate.name || !newTemplate.content || currentUser.role !== 'doctor') return;
        
        setIsSubmitting(true);
        try {
            const created = await createNoteTemplate({ ...newTemplate, doctor_id: currentUser.id });
            setTemplates(prev => [...prev, created]);
            setNewTemplate({ name: '', content: '' });
            alert('Template created!');
        } catch (err) {
            alert('Failed to create template.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) return <SpinnerIcon className="mx-auto" />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-bold mb-4">Your Note Templates</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {templates.length > 0 ? templates.map(template => (
                        <div key={template.id} className="p-3 border rounded-lg bg-slate-50">
                            <p className="font-semibold text-slate-800">{template.name}</p>
                            <p className="text-sm text-slate-600 truncate">{template.content}</p>
                        </div>
                    )) : <p className="text-slate-500">You haven't created any templates yet.</p>}
                </div>
            </div>
            <div>
                 <h2 className="text-xl font-bold mb-4">Create New Template</h2>
                 <form onSubmit={handleCreate} className="space-y-4 p-4 border rounded-lg bg-white">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                        <input 
                            value={newTemplate.name} 
                            onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} 
                            placeholder="e.g., Viral Fever Follow-up"
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                        <textarea 
                            value={newTemplate.content}
                            onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                            placeholder="Enter the note content..."
                            className="w-full p-2 border rounded-md"
                            rows={4}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300">
                             {isSubmitting && <SpinnerIcon className="w-4 h-4"/>}
                            Save Template
                        </button>
                    </div>
                 </form>
            </div>
        </div>
    );
};

const ManageServices: React.FC<{ api: ReturnType<typeof useMockApi> }> = ({ api }) => {
    const { services, updateService } = api;
    const [editingService, setEditingService] = useState<Service | null>(null);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingService) return;
        
        try {
            await updateService(editingService);
            alert("Service updated!");
            setEditingService(null);
        } catch (err) {
            alert("Failed to update service.");
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Services</h2>
            <div className="space-y-2">
                {services.map(service => (
                    <div key={service.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className="text-sm text-slate-500">Duration: {service.duration_minutes} min, Price: ₹{service.price}</p>
                        </div>
                        <button onClick={() => setEditingService(service)} className="px-3 py-1 border rounded-md text-sm hover:bg-slate-50">Edit</button>
                    </div>
                ))}
            </div>
            {editingService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Edit Service</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm">Name</label>
                                <input value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} className="w-full p-2 border rounded-md"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm">Duration (min)</label>
                                    <input type="number" value={editingService.duration_minutes} onChange={e => setEditingService({...editingService, duration_minutes: Number(e.target.value)})} className="w-full p-2 border rounded-md"/>
                                </div>
                                 <div>
                                    <label className="block text-sm">Price (₹)</label>
                                    <input type="number" value={editingService.price} onChange={e => setEditingService({...editingService, price: Number(e.target.value)})} className="w-full p-2 border rounded-md"/>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 border rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManageUsers: React.FC<{ api: ReturnType<typeof useMockApi> }> = ({ api }) => {
     const { users } = api;
     return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Users</h2>
            <div className="space-y-2">
                 {users.map(user => (
                    <div key={user.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{user.name} <span className={`text-xs px-2 py-0.5 rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></p>
                            <p className="text-sm text-slate-500">{user.email} - <span className="capitalize">{user.role}</span></p>
                        </div>
                        <button className="px-3 py-1 border rounded-md text-sm hover:bg-slate-50" disabled>Edit</button>
                    </div>
                ))}
            </div>
            <p className="text-sm text-slate-400 mt-4">User creation and detailed editing are not yet implemented in this mock UI.</p>
        </div>
     );
};

const ManageBranches: React.FC<{ api: ReturnType<typeof useMockApi> }> = ({ api }) => {
    const { branches } = api;
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Branches</h2>
             <div className="space-y-2">
                {branches.map(branch => (
                    <div key={branch.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <p className="font-semibold">{branch.name}</p>
                        <button className="px-3 py-1 border rounded-md text-sm hover:bg-slate-50" disabled>Edit</button>
                    </div>
                ))}
            </div>
            <p className="text-sm text-slate-400 mt-4">Branch management is not yet implemented in this mock UI.</p>
        </div>
    );
};