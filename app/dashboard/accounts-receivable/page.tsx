'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { getReceivablesSummary } from '@/lib/accountsReceivable';
import { getCustomersWithBalance } from '@/lib/customers';
import {
  getOverdueCustomers,
  getCustomerAccountStatus,
} from '@/lib/customerTransactions';
import type { Customer } from '@/types/customer';
import type { AccountStatus, AgingData } from '@/types/transaction';
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
import { CustomerPaymentForm } from '@/components/transactions/CustomerPaymentForm';
import { CustomerTransactionsList } from '@/components/transactions/CustomerTransactionsList';
import { AccountStatusPDF } from '@/components/transactions/AccountStatusPDF';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, AlertCircle, Users, FileText } from 'lucide-react';
import { IconChip } from '@/components/common/IconChip';
import { StatusPill } from '@/components/common/StatusPill';
import { DualCurrency } from '@/components/common/DualCurrency';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type OverdueCustomerRow = {
  id: string;
  storeId: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  balance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  daysOverdue?: number;
};

export default function AccountsReceivablePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const exchangeRate = activeRate?.usdToVes;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary data
  const [summary, setSummary] = useState({
    totalReceivable: 0,
    overdueAmount: 0,
    currentAmount: 0,
    customersWithBalance: 0,
    agingData: { current: 0, days30: 0, days60: 0, days90: 0 } as AgingData,
  });

  // Tables data
  const [customersWithBalance, setCustomersWithBalance] = useState<Customer[]>(
    []
  );
  const [overdueCustomers, setOverdueCustomers] = useState<
    OverdueCustomerRow[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
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

      const [summaryData, customersData, overdueData] = await Promise.all([
        getReceivablesSummary(profile.storeId),
        getCustomersWithBalance(profile.storeId),
        getOverdueCustomers(profile.storeId),
      ]);

      setSummary(summaryData);
      setCustomersWithBalance(customersData);
      setOverdueCustomers(overdueData.customers || []);
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

  const handleShowAccountStatus = async (customer: { id: string }) => {
    const status = await getCustomerAccountStatus(customer.id);
    if (status) {
      setAccountStatus(status);
      setShowAccountStatusDialog(true);
    }
  };

  const handleShowPaymentForm = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedCustomer(null);
    loadData(); // Reload data
  };

  const filteredCustomers = customersWithBalance.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const agingChartData = [
    { name: '0-30 días', amount: summary.agingData.current },
    { name: '31-60 días', amount: summary.agingData.days30 },
    { name: '61-90 días', amount: summary.agingData.days60 },
    { name: '90+ días', amount: summary.agingData.days90 },
  ];

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
      loadingMessage="Cargando cuentas por cobrar..."
    >
      <div className="space-y-6 p-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Cuentas por Cobrar
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Gestión de créditos a clientes y cartera
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total por Cobrar
              </CardTitle>
              <IconChip icon={DollarSign} tone="accent" />
            </CardHeader>
            <CardContent>
              <DualCurrency
                usd={summary.totalReceivable}
                exchangeRate={exchangeRate}
                size="lg"
                align="left"
              />
              <p className="text-muted-foreground text-xs">
                {summary.customersWithBalance} clientes con saldo
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Vencido
              </CardTitle>
              <IconChip icon={AlertCircle} tone="danger" />
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
                {overdueCustomers.length} clientes con saldo vencido
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Vigente
              </CardTitle>
              <IconChip icon={Users} tone="accent" />
            </CardHeader>
            <CardContent>
              <DualCurrency
                usd={summary.currentAmount}
                exchangeRate={exchangeRate}
                size="lg"
                align="left"
                primaryClassName="text-tsuma-primary-dark"
              />
              <p className="text-muted-foreground text-xs">Sin vencimiento</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
            <TabsTrigger value="all">Clientes con Saldo</TabsTrigger>
            <TabsTrigger value="overdue">
              Cuentas Vencidas ({overdueCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="aging">Aging de Cartera</TabsTrigger>
          </TabsList>

          {/* Tab: Todos los clientes con saldo */}
          <TabsContent value="all" className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Input
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus-visible:ring-brand-primary max-w-sm border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground py-8 text-center"
                      >
                        No hay clientes con saldo
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>{customer.document}</TableCell>
                        <TableCell className="text-right">
                          <DualCurrency
                            usd={customer.balance}
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
                              onClick={() => handleShowAccountStatus(customer)}
                            >
                              <FileText className="mr-1 h-4 w-4" />
                              Estado de Cuenta
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleShowPaymentForm(customer)}
                            >
                              Registrar Abono
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

          {/* Tab: Cuentas vencidas */}
          <TabsContent value="overdue" className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Balance Total</TableHead>
                    <TableHead className="text-center">
                      Días de atraso
                    </TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-8 text-center"
                      >
                        No hay cuentas vencidas
                      </TableCell>
                    </TableRow>
                  ) : (
                    overdueCustomers.map((status) => (
                      <TableRow key={status.id}>
                        <TableCell className="font-medium">
                          {status.name}
                        </TableCell>
                        <TableCell>{status.document}</TableCell>
                        <TableCell className="text-right">
                          <DualCurrency
                            usd={status.balance}
                            exchangeRate={exchangeRate}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusPill tone="crit">
                            {status.daysOverdue
                              ? `${status.daysOverdue} días`
                              : 'Vencido'}
                          </StatusPill>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowAccountStatus(status)}
                            >
                              Ver Detalle
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

          {/* Tab: Aging de cartera */}
          <TabsContent value="aging" className="space-y-4">
            <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle>Distribución de Cartera Vencida por Días</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(Number(value), 'USD')
                      }
                    />
                    <Bar dataKey="amount" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    0-30 días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DualCurrency
                    usd={summary.agingData.current}
                    exchangeRate={exchangeRate}
                    size="lg"
                    align="left"
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    31-60 días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DualCurrency
                    usd={summary.agingData.days30}
                    exchangeRate={exchangeRate}
                    size="lg"
                    align="left"
                    primaryClassName="text-amber-600 dark:text-amber-400"
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    61-90 días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DualCurrency
                    usd={summary.agingData.days60}
                    exchangeRate={exchangeRate}
                    size="lg"
                    align="left"
                    primaryClassName="text-orange-600 dark:text-orange-400"
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-200 shadow-sm dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    90+ días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DualCurrency
                    usd={summary.agingData.days90}
                    exchangeRate={exchangeRate}
                    size="lg"
                    align="left"
                    primaryClassName="text-red-600 dark:text-red-400"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog: Registrar Abono */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="rounded-2xl border-gray-200 sm:max-w-[500px] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>Registrar Abono de Cliente</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <CustomerPaymentForm
                customer={selectedCustomer}
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
                      {accountStatus.document}
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
                    type="customer"
                  />
                </div>

                <CustomerTransactionsList
                  customerId={accountStatus.customerId!}
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
