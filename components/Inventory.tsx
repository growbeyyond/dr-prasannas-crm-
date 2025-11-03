
import React from 'react';
import { InventoryItem } from '../types/inventory';

interface InventoryProps {
  inventory: InventoryItem[];
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: number) => void;
  loading: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onAddItem, onEditItem, onDeleteItem, loading }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Inventory</h2>
        <button
          onClick={onAddItem}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Stock</th>
              <th className="py-2 px-4 border-b">Low Stock Threshold</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No inventory items found.
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
              <tr key={item.id} className={item.stock <= item.low_stock_threshold ? 'bg-red-100' : ''}>
                <td className="py-2 px-4 border-b">{item.name}</td>
                <td className="py-2 px-4 border-b">{item.stock}</td>
                <td className="py-2 px-4 border-b">{item.low_stock_threshold}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => onEditItem(item)}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 ml-2"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
