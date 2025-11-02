import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, Invoice } from '../types';
import { SpinnerIcon, ReceiptIcon, PrintIcon } from './icons';

interface BillingModalProps {
  appointment: Appointment;
  onClose: () => void;
  getInvoiceApi: (appointmentId: number) => Promise<Invoice | undefined>;
  recordPaymentApi: (invoiceId: number) => Promise<Invoice>;
}

const PrintableInvoice: React.FC<{ invoice: Invoice | null, appointment: Appointment }> = ({ invoice, appointment }) => (
    <div className="print-only hidden p-8">
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="mb-6">Dr. Prasanna's Clinic</p>
        
        {invoice && (
            <>
                <p><strong>Invoice ID:</strong> {invoice.id}</p>
                <p><strong>Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                <p><strong>Patient:</strong> {invoice.patient_name}</p>
                <hr className="my-4"/>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left">Service</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{invoice.service_name}</td>
                            <td className="text-right">₹{invoice.amount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                <hr className="my-4"/>
                <p className="text-right text-xl font-bold">Total: ₹{invoice.amount.toFixed(2)}</p>
                <p className="text-right font-semibold mt-2">Status: {invoice.status.toUpperCase()}</p>
            </>
        )}
    </div>
);

export const BillingModal: React.FC<BillingModalProps> = ({ appointment, onClose, getInvoiceApi, recordPaymentApi }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!appointment.invoice_id) {
        setLoading(false);
        return;
    }
    try {
      const inv = await getInvoiceApi(appointment.id);
      setInvoice(inv || null);
    } catch (err) {
      console.error("Failed to fetch invoice", err);
    } finally {
      setLoading(false);
    }
  }, [appointment, getInvoiceApi]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);
  
  const handleRecordPayment = async () => {
    if (!invoice) return;
    setIsSubmitting(true);
    try {
        const updatedInvoice = await recordPaymentApi(invoice.id);
        setInvoice(updatedInvoice);
        alert('Payment recorded successfully!');
    } catch (err) {
        console.error("Failed to record payment", err);
        alert('Error recording payment.');
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl flex flex-col printable-area" onClick={e => e.stopPropagation()}>
        <PrintableInvoice invoice={invoice} appointment={appointment} />
        <div className="p-6 border-b flex items-center gap-3 no-print">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <ReceiptIcon className="w-6 h-6"/>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Billing Details</h2>
                <p className="text-slate-500">For appointment on {new Date(appointment.start_time).toLocaleDateString()}</p>
            </div>
        </div>

        <div className="p-6 flex-grow no-print">
          {loading ? (
            <div className="flex justify-center items-center h-32"><SpinnerIcon /></div>
          ) : !invoice ? (
            <div className="text-center text-slate-500 h-32">No invoice found for this appointment.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600">Patient:</span>
                <span className="font-semibold text-slate-800 text-lg">{invoice.patient_name}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600">Service:</span>
                <span className="font-semibold text-slate-800 text-lg">{invoice.service_name}</span>
              </div>
               <div className="my-4 border-t border-dashed"></div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600 text-xl">Total Amount:</span>
                <span className="font-bold text-slate-900 text-2xl">₹{invoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-100">
                <span className="text-slate-600 font-medium">Status:</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${invoice.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                    {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-between gap-3 rounded-b-lg no-print">
            <div>
                 {invoice && <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-white hover:bg-slate-50"><PrintIcon /> Print Invoice</button>}
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50">Close</button>
                {invoice && invoice.status === 'pending' && (
                    <button
                    type="button"
                    onClick={handleRecordPayment}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2"
                    >
                    {isSubmitting && <SpinnerIcon className="w-4 h-4" />}
                    Record Payment
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};