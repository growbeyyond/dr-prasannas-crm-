import React, { useState } from 'react';
import { Appointment } from '../types';
import { SpinnerIcon, MessageIcon } from './icons';

interface CommunicationModalProps {
  appointment: Appointment;
  onClose: () => void;
  sendMessageApi: (patientId: number, message: string) => Promise<boolean>;
}

export const CommunicationModal: React.FC<CommunicationModalProps> = ({ appointment, onClose, sendMessageApi }) => {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const templates = [
    `Hi ${appointment.patient.name}, this is a confirmation for your appointment on ${new Date(appointment.start_time).toLocaleDateString()} at ${new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    `Hi ${appointment.patient.name}, Dr. Prasanna is running approximately 15 minutes behind schedule. We apologize for any inconvenience.`,
    `Hi ${appointment.patient.name}, we have an opening for an earlier appointment today. Would you be interested? Please call the clinic at [Clinic Phone].`,
  ];

  const handleSendMessage = async (msg: string) => {
    setIsSending(true);
    try {
      await sendMessageApi(appointment.patient.id, msg);
      alert('Message sent successfully!');
      onClose();
    } catch (err) {
      alert('Failed to send message.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex items-center gap-3">
          <MessageIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">Send Message</h2>
            <p className="text-slate-500">To: {appointment.patient.name}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-700">Use a template:</h3>
          <div className="space-y-2">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(template)}
                disabled={isSending}
                className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 border rounded-md text-sm text-slate-700 disabled:opacity-50"
              >
                {template}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <hr className="flex-grow" />
            <span className="text-slate-400 text-sm">OR</span>
            <hr className="flex-grow" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Write a custom message:</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full p-2 border rounded-md"
              placeholder="Type your message here..."
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            onClick={() => handleSendMessage(message)}
            disabled={isSending || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
          >
            {isSending && <SpinnerIcon className="w-4 h-4" />}
            Send Custom Message
          </button>
        </div>
      </div>
    </div>
  );
};
