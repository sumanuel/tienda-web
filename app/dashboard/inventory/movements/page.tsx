'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInventoryStore } from '@/store/inventoryStore';
import { useProductsStore } from '@/store/productsStore';
import {
  getInventoryMovements,
  registerInventoryMovement,
} from '@/lib/inventory';
import { getProducts } from '@/lib/products';
import { InventoryMovementFormData } from '@/types/inventory';
import MovementsTable from '@/components/inventory/MovementsTable';
import MovementForm from '@/components/inventory/MovementForm';
import { SidePanel } from '@/components/common/SidePanel';
import { ArrowRightLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryMovementsPage() {
  const { profile } = useAuth();
  const { movements, setMovements, addMovement } = useInventoryStore();
  const { products, setProducts } = useProductsStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!profile?.storeId) return;
      setLoading(true);

      const [movementsData, productsData] = await Promise.all([
        getInventoryMovements(profile.storeId),
        getProducts(profile.storeId),
      ]);

      setMovements(movementsData);
      setProducts(productsData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: InventoryMovementFormData) => {
    try {
      if (!profile) return;

      const movement = await registerInventoryMovement(
        profile.storeId,
        profile.id,
        profile.name,
        data
      );

      addMovement(movement);
      toast.success('Movimiento registrado exitosamente');
      setShowForm(false);

      // Recargar productos para actualizar stocks
      const productsData = await getProducts(profile.storeId);
      setProducts(productsData);
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar movimiento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-full rounded bg-gray-100 dark:bg-slate-800" />
          <div className="mt-4 h-80 w-full rounded bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Movimientos de Inventario
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {movements.length} movimientos registrados
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-primary hover:bg-brand-primary-dark inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Plus size={20} />
          Nuevo Movimiento
        </button>
      </div>

      <SidePanel
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Registrar Movimiento"
        subtitle="Registra entradas, salidas o ajustes de inventario para un producto."
      >
        <MovementForm
          products={products}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      </SidePanel>

      <MovementsTable movements={movements} />
    </div>
  );
}
