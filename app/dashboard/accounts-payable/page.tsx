'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { getPayablesSummary } from '@/lib/accountsReceivable';
import { getSuppliersWithBalance } from '@/lib/suppliers';
import {
  getUpcomingPayables,
  getSupplierAccountStatus,
} from '@/lib/supplierTransactions';
import type { Supplier } from '@/types/supplier';
import type { AccountStatus } from '@/types/transaction';
import { PageContainer } from '@/components/common/PageContainer';

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
import { IconChip } from '@/components/common/IconChip';
import { StatusPill } from '@/components/common/StatusPill';
import { DualCurrency } from '@/components/common/DualCurrency';
import { differenceInDays } from 'date-fns';

type UpcomingPayableRow = {
  id: string;
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  balance: number;
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function AccountsPayablePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const exchangeRate = activeRate?.usdToVes;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [upcomingPayables, setUpcomingPayables] = useState<
    UpcomingPayableRow[]
  >([]);
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
      setError(null);

      const [summaryData, suppliersData, upcomingData] = await Promise.all([
        getPayablesSummary(profile.storeId),
        getSuppliersWithBalance(profile.storeId),
        getUpcomingPayables(profile.storeId),
      ]);

      setSummary(summaryData);
      setSuppliersWithBalance(suppliersData);
      setUpcomingPayables(upcomingData.payables || []);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      const errorMessage = error.message || 'Error al cargar datos';
      setError(errorMessage);

      // Si es error de autenticación, redirigir a login
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('Token') ||
        errorMessage.includes('Sesión expirada')
      ) {
        setTimeout(() => router.push('/login'), 2000);
      }
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

  const getEarliestDueDate = (payable: UpcomingPayableRow) => {
    return payable.dueDate ? new Date(payable.dueDate) : null;
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
    <PageContainer
      loading={loading}
      error={error}
      onRetry={loadData}
      loadingMessage="Cargando cuentas por pagar..."
    >
      <div className="space-y-6 p-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Cuentas por Pagar
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestión de deudas con proveedores
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total por Pagar
              </CardTitle>
              <IconChip icon={DollarSign} tone="danger" />
            </CardHeader>
            <CardContent>
              <DualCurrency
                usd={summary.totalPayable}
                exchangeRate={exchangeRate}
                size="lg"
                align="left"
                primaryClassName="text-red-600 dark:text-red-400"
              />
              <p className="text-muted-foreground text-xs">
                {summary.suppliersWithBalance} proveedores con saldo
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Por Vencer (7 días)
              </CardTitle>
              <IconChip icon={AlertTriangle} tone="warning" />
            </CardHeader>
            <CardContent>
              <DualCurrency
                usd={summary.upcomingAmount}
                exchangeRate={exchangeRate}
                size="lg"
                align="left"
                primaryClassName="text-amber-600 dark:text-amber-400"
              />
              <p className="text-muted-foreground text-xs">
                {upcomingPayables.length} proveedores próximos a vencer
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Vencido
              </CardTitle>
              <IconChip icon={Building2} tone="danger" />
            </CardHeader>
            <CardContent>
              <DualCurrency
                usd={summary.overdueAmount}
                exchangeRate={exchangeRate}
                size="lg"
                align="left"
                primaryClassName="text-red-600 dark:text-red-400"
              />
              <p className="text-muted-foreground text-xs">
                Requiere atención inmediata
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
            <TabsTrigger value="all">Proveedores con Saldo</TabsTrigger>
            <TabsTrigger value="upcoming">
              Por Vencer ({upcomingPayables.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Todos los proveedores con saldo */}
          <TabsContent value="all" className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Input
                placeholder="Buscar por nombre o RIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus-visible:ring-brand-primary max-w-sm border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                        <TableCell className="text-right">
                          <DualCurrency
                            usd={supplier.balance}
                            exchangeRate={exchangeRate}
                            size="sm"
                            primaryClassName="text-red-600 dark:text-red-400"
                          />
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
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
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

                      const isUrgent =
                        daysUntilDue !== null && daysUntilDue <= 3;

                      return (
                        <TableRow key={status.id}>
                          <TableCell className="font-medium">
                            {status.name}
                          </TableCell>
                          <TableCell className="text-right">
                            <DualCurrency
                              usd={Math.abs(status.balance)}
                              exchangeRate={exchangeRate}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {daysUntilDue !== null ? (
                              <StatusPill tone={isUrgent ? 'crit' : 'warn'}>
                                {daysUntilDue === 0
                                  ? 'HOY'
                                  : daysUntilDue === 1
                                    ? 'Mañana'
                                    : `${daysUntilDue} días`}
                              </StatusPill>
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
                                  const supplier = suppliersWithBalance.find(
                                    (item) => item.id === status.id
                                  );
                                  if (supplier) {
                                    handleShowAccountStatus(supplier);
                                  }
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
          <DialogContent className="rounded-2xl border-gray-200 sm:max-w-[500px] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>Registrar Pago a Proveedor</DialogTitle>
            </DialogHeader>
            {selectedSupplier && (
              <SupplierPaymentForm
                supplier={selectedSupplier}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentDialog(false)}
                exchangeRate={exchangeRate}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog: Estado de Cuenta */}
        <Dialog
          open={showAccountStatusDialog}
          onOpenChange={setShowAccountStatusDialog}
        >
          <DialogContent className="max-h-[80vh] overflow-y-auto rounded-2xl border-gray-200 sm:max-w-[900px] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>Estado de Cuenta</DialogTitle>
            </DialogHeader>
            {accountStatus && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {accountStatus.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {accountStatus.rif}
                    </p>
                    <p className="mt-2 mb-1 text-sm font-medium">
                      Saldo Actual:
                    </p>
                    <DualCurrency
                      usd={accountStatus.currentBalance}
                      exchangeRate={exchangeRate}
                      align="left"
                      primaryClassName="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <AccountStatusPDF
                    accountStatus={accountStatus}
                    type="supplier"
                  />
                </div>

                <SupplierTransactionsList
                  supplierId={accountStatus.supplierId!}
                  exchangeRate={exchangeRate}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
