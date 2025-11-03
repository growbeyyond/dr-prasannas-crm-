
import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadModalProps {
  onClose: () => void;
  onSave: (signature: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({ onClose, onSave }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    const signature = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (signature) {
      onSave(signature);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Sign Consent Form</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          <div className="border border-slate-300 rounded-md">
            <SignatureCanvas
              ref={sigCanvas}
              penColor='black'
              canvasProps={{ className: 'w-full h-64' }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            By signing, you acknowledge that you have read and understood the consent form.
          </p>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
          <button type="button" onClick={clear} className="px-4 py-2 border rounded-md">
            Clear
          </button>
          <button type="button" onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};
