'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPayablesSummary } from '@/lib/accountsReceivable';
import { getSuppliersWithBalance } from '@/lib/suppliers';
import {
  getUpcomingPayables,
  getSupplierAccountStatus,
} from '@/lib/supplierTransactions';
import type { Supplier } from '@/types/supplier';
import type { AccountStatus } from '@/types/transaction';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SupplierPaymentForm } from '@/components/transactions/SupplierPaymentForm';
import { SupplierTransactionsList } from '@/components/transactions/SupplierTransactionsList';
import { AccountStatusPDF } from '@/components/transactions/AccountStatusPDF';
import { DollarSign, AlertTriangle, Building2, FileText } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function AccountsPayablePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

  // Summary data
  const [summary, setSummary] = useState({
    totalPayable: 0,
    overdueAmount: 0,
    upcomingAmount: 0,
    suppliersWithBalance: 0,
  });

  // Tables data
  const [suppliersWithBalance, setSuppliersWithBalance] = useState<Supplier[]>(
    []
  );
  const [upcomingPayables, setUpcomingPayables] = useState<AccountStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAccountStatusDialog, setShowAccountStatusDialog] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );

  useEffect(() => {
    if (profile?.storeId) {
      loadData();
    }
  }, [profile?.storeId]);

  const loadData = async () => {
    if (!profile?.storeId) return;

    try {
      setLoading(true);

      const [summaryData, suppliersData, upcomingData] = await Promise.all([
        getPayablesSummary(profile.storeId),
        getSuppliersWithBalance(profile.storeId),
        getUpcomingPayables(profile.storeId),
      ]);

      setSummary(summaryData);
      setSuppliersWithBalance(suppliersData);
      setUpcomingPayables(upcomingData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAccountStatus = async (supplier: Supplier) => {
    const status = await getSupplierAccountStatus(supplier.id);
    if (status) {
      setAccountStatus(status);
      setShowAccountStatusDialog(true);
    }
  };

  const handleShowPaymentForm = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedSupplier(null);
    loadData(); // Reload data
  };

  const filteredSuppliers = suppliersWithBalance.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEarliestDueDate = (accountStatus: AccountStatus) => {
    const chargesWithDueDate = accountStatus.transactions
      .filter((t) => t.type === 'charge' && t.dueDate)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));

    return chargesWithDueDate[0]?.dueDate || null;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cuentas por Pagar</h1>
        <p className="text-muted-foreground">
          Gestión de deudas con proveedores
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total por Pagar
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.totalPayable.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              {summary.suppliersWithBalance} proveedores con saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Por Vencer (7 días)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${summary.upcomingAmount.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              {upcomingPayables.length} proveedores próximos a vencer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Vencido</CardTitle>
            <Building2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.overdueAmount.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              Requiere atención inmediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Proveedores con Saldo</TabsTrigger>
          <TabsTrigger value="upcoming">
            Por Vencer ({upcomingPayables.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Todos los proveedores con saldo */}
        <TabsContent value="all" className="space-y-4">
          <div>
            <Input
              placeholder="Buscar por nombre o RIF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>RIF</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No hay proveedores con saldo
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>{supplier.rif}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ${supplier.balance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowAccountStatus(supplier)}
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            Estado de Cuenta
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleShowPaymentForm(supplier)}
                          >
                            Registrar Pago
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab: Por vencer (próximos 7 días) */}
        <TabsContent value="upcoming" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>RIF</TableHead>
                  <TableHead className="text-right">Balance Total</TableHead>
                  <TableHead className="text-center">Vence en</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPayables.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No hay cuentas próximas a vencer
                    </TableCell>
                  </TableRow>
                ) : (
                  upcomingPayables.map((status) => {
                    const earliestDueDate = getEarliestDueDate(status);
                    const daysUntilDue = earliestDueDate
                      ? differenceInDays(earliestDueDate, new Date())
                      : null;

                    const isUrgent = daysUntilDue !== null && daysUntilDue <= 3;

                    return (
                      <TableRow key={status.supplierId}>
                        <TableCell className="font-medium">
                          {status.name}
                        </TableCell>
                        <TableCell>{status.rif}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${status.currentBalance.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {daysUntilDue !== null ? (
                            <span
                              className={`font-medium ${
                                isUrgent ? 'text-red-600' : 'text-yellow-600'
                              }`}
                            >
                              {daysUntilDue === 0
                                ? 'HOY'
                                : daysUntilDue === 1
                                  ? 'Mañana'
                                  : `${daysUntilDue} días`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAccountStatus(status);
                                setShowAccountStatusDialog(true);
                              }}
                            >
                              Ver Detalle
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Registrar Pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago a Proveedor</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierPaymentForm
              supplier={selectedSupplier}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Estado de Cuenta */}
      <Dialog
        open={showAccountStatusDialog}
        onOpenChange={setShowAccountStatusDialog}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Estado de Cuenta</DialogTitle>
          </DialogHeader>
          {accountStatus && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium">{accountStatus.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {accountStatus.rif}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Saldo Actual:{' '}
                    <span className="text-red-600">
                      ${accountStatus.currentBalance.toFixed(2)}
                    </span>
                  </p>
                </div>
                <AccountStatusPDF
                  accountStatus={accountStatus}
                  type="supplier"
                />
              </div>

              <SupplierTransactionsList
                supplierId={accountStatus.supplierId!}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
