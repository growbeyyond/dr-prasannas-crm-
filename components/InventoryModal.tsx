
import React, { useState } from 'react';
import { InventoryItem } from '../types/inventory';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
  itemToEdit?: InventoryItem;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
}) => {
  const [name, setName] = useState(itemToEdit?.name || '');
  const [stock, setStock] = useState(itemToEdit?.stock || 0);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    itemToEdit?.low_stock_threshold || 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(stock) || isNaN(lowStockThreshold)) {
      return;
    }
    onSave({ name, stock, low_stock_threshold: lowStockThreshold });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {itemToEdit ? 'Edit Item' : 'Add New Item'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Low Stock Threshold</label>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
