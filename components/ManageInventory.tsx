import React, { useState, useEffect } from 'react';
import { useMockApi } from '../hooks/useMockApi';
import { InventoryItem } from '../types';
import { SpinnerIcon } from './icons';

interface ManageInventoryProps {
    api: ReturnType<typeof useMockApi>;
}

export const ManageInventory: React.FC<ManageInventoryProps> = ({ api }) => {
    const { getInventory, updateInventoryItem } = api;
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const data = await getInventory();
                setInventory(data);
            } catch (e) {
                console.error("Failed to load inventory");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, [getInventory]);

    const handleSave = async () => {
        if (!editingItem) return;
        try {
            const updated = await updateInventoryItem(editingItem);
            setInventory(prev => prev.map(item => item.id === updated.id ? updated : item));
            setEditingItem(null);
        } catch (e) {
            alert('Failed to update inventory.');
        }
    };

    if (isLoading) return <SpinnerIcon className="mx-auto" />;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Inventory Management</h2>
            <p className="text-slate-500 mb-6">Track stock levels for medications and supplies. Stock is automatically deducted when prescriptions are completed.</p>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3 text-left">Item Name</th>
                            <th className="p-3 text-left">Current Stock</th>
                            <th className="p-3 text-left">Low Stock Threshold</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => {
                            const isLowStock = item.stock < item.low_stock_threshold;
                            return (
                                <tr key={item.id} className={`border-b ${isLowStock ? 'bg-red-50' : ''}`}>
                                    <td className="p-3 font-semibold">{item.name}</td>
                                    <td className="p-3">{editingItem?.id === item.id ? 
                                        <input type="number" value={editingItem.stock} onChange={e => setEditingItem({...editingItem, stock: Number(e.target.value)})} className="p-1 border rounded w-20"/>
                                        : item.stock
                                    }</td>
                                    <td className="p-3">{editingItem?.id === item.id ? 
                                        <input type="number" value={editingItem.low_stock_threshold} onChange={e => setEditingItem({...editingItem, low_stock_threshold: Number(e.target.value)})} className="p-1 border rounded w-20"/>
                                        : item.low_stock_threshold
                                    }</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isLowStock ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                            {isLowStock ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        {editingItem?.id === item.id ? (
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs">Save</button>
                                                <button onClick={() => setEditingItem(null)} className="px-3 py-1 border rounded-md text-xs">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setEditingItem(item)} className="px-3 py-1 border rounded-md text-xs hover:bg-slate-50">Edit</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};