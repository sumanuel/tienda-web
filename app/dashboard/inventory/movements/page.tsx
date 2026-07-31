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
import { Plus, X } from 'lucide-react';
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
    return <div className="p-6">Cargando movimientos...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimientos de Inventario</h1>
          <p className="text-gray-600">
            {movements.length} movimientos registrados
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? (
            <>
              <X size={20} />
              Cancelar
            </>
          ) : (
            <>
              <Plus size={20} />
              Nuevo Movimiento
            </>
          )}
        </button>
      </div>

      {/* Formulario de Nuevo Movimiento */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Registrar Movimiento</h2>
          <MovementForm
            products={products}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Tabla de Movimientos */}
      <MovementsTable movements={movements} />
    </div>
  );
}
