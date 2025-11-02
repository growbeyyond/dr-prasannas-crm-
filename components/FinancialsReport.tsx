import React, { useState } from 'react';
import { useMockApi } from '../hooks/useMockApi';
import { Invoice } from '../types';
import { SpinnerIcon } from './icons';

interface FinancialsReportProps {
    api: ReturnType<typeof useMockApi>;
}

export const FinancialsReport: React.FC<FinancialsReportProps> = ({ api }) => {
    const { getInvoicesForDateRange } = api;
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [report, setReport] = useState<{ invoices: Invoice[], total: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        try {
            const invoices = await getInvoicesForDateRange(startDate, endDate);
            const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
            setReport({ invoices, total });
        } catch (e) {
            alert('Failed to generate report.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Financials Report</h2>
            <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-slate-50 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md" />
                </div>
                <button onClick={handleGenerateReport} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 disabled:bg-blue-300">
                    {isLoading && <SpinnerIcon className="w-4 h-4" />} Generate Report
                </button>
            </div>

            {report && (
                <div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold">Report for {startDate} to {endDate}</h3>
                        <p className="text-2xl font-bold text-green-600">Total Revenue: ₹{report.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-left">Invoice ID</th>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Patient</th>
                                    <th className="p-3 text-left">Service</th>
                                    <th className="p-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.invoices.map(invoice => (
                                    <tr key={invoice.id} className="border-b">
                                        <td className="p-3">#{invoice.id}</td>
                                        <td className="p-3">{invoice.invoice_date}</td>
                                        <td className="p-3">{invoice.patient_name}</td>
                                        <td className="p-3">{invoice.service_name}</td>
                                        <td className="p-3 text-right font-semibold">₹{invoice.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {report.invoices.length === 0 && <p className="p-8 text-center text-slate-500">No paid invoices found in this date range.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};