'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, UserPlus, User } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface Customer {
  id: string;
  name: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateCustomer?: (data: {
    name: string;
    documentNumber: string;
    phone?: string;
    address?: string;
  }) => Promise<Customer>;
  storeId: string;
}

export function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
  onCreateCustomer,
  storeId,
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    documentNumber: '',
    phone: '',
    address: '',
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Buscar clientes
  useEffect(() => {
    async function searchCustomers() {
      if (!debouncedSearch || debouncedSearch === '1') {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/customers?storeId=${storeId}&search=${encodeURIComponent(debouncedSearch)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.customers || []);
        }
      } catch (error) {
        console.error('Error buscando clientes:', error);
      } finally {
        setIsSearching(false);
      }
    }

    searchCustomers();
  }, [debouncedSearch, storeId]);

  // Manejar selección de cliente genérico
  const handleGenericCustomer = () => {
    onSelectCustomer({
      id: 'generic',
      name: 'Cliente Genérico',
      documentNumber: '1',
    });
    setSearchQuery('1');
    setSearchResults([]);
  };

  // Manejar selección de cliente de resultados
  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchQuery(customer.documentNumber || customer.name);
    setSearchResults([]);
  };

  // Manejar creación de nuevo cliente
  const handleCreateCustomer = async () => {
    if (!onCreateCustomer) return;

    if (!newCustomer.name.trim() || !newCustomer.documentNumber.trim()) {
      alert('Nombre y documento son obligatorios');
      return;
    }

    try {
      const created = await onCreateCustomer(newCustomer);
      handleSelectCustomer(created);
      setShowCreateModal(false);
      setNewCustomer({ name: '', documentNumber: '', phone: '', address: '' });
    } catch (error: any) {
      alert(error.message || 'Error al crear cliente');
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="customer">Cliente</Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="customer"
            placeholder="Buscar por documento o nombre (1 = genérico)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
              {searchResults.map((customer) => (
                <button
                  key={customer.id}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Doc: {customer.documentNumber}
                      {customer.phone && ` • Tel: ${customer.phone}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGenericCustomer}
          title="Cliente Genérico"
        >
          <User className="h-4 w-4" />
        </Button>

        {onCreateCustomer && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowCreateModal(true)}
            title="Crear Cliente"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Cliente seleccionado */}
      {selectedCustomer && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <User className="h-4 w-4 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-green-900">
              {selectedCustomer.name}
            </p>
            {selectedCustomer.documentNumber !== '1' && (
              <p className="text-xs text-green-700">
                Doc: {selectedCustomer.documentNumber}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onSelectCustomer(null);
              setSearchQuery('');
            }}
          >
            Cambiar
          </Button>
        </div>
      )}

      {/* Modal crear cliente */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-name">Nombre *</Label>
              <Input
                id="new-name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <Label htmlFor="new-document">Documento *</Label>
              <Input
                id="new-document"
                value={newCustomer.documentNumber}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    documentNumber: e.target.value,
                  })
                }
                placeholder="V12345678"
              />
            </div>

            <div>
              <Label htmlFor="new-phone">Teléfono</Label>
              <Input
                id="new-phone"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                placeholder="04141234567"
              />
            </div>

            <div>
              <Label htmlFor="new-address">Dirección</Label>
              <Input
                id="new-address"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
                placeholder="Dirección completa"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCustomer}
              className="bg-[#2D7A5B] hover:bg-[#236449]"
            >
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
