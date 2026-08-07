'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getReceivablesSummary } from '@/lib/accountsReceivable';
import { getCustomersWithBalance } from '@/lib/customers';
import {
  getOverdueCustomers,
  getCustomerAccountStatus,
} from '@/lib/customerTransactions';
import type { Customer } from '@/types/customer';
import type { AccountStatus, AgingData } from '@/types/transaction';

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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AccountsReceivablePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

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
  const [overdueCustomers, setOverdueCustomers] = useState<AccountStatus[]>([]);
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

      const [summaryData, customersData, overdueData] = await Promise.all([
        getReceivablesSummary(profile.storeId),
        getCustomersWithBalance(profile.storeId),
        getOverdueCustomers(profile.storeId),
      ]);

      setSummary(summaryData);
      setCustomersWithBalance(customersData);
      setOverdueCustomers(overdueData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAccountStatus = async (customer: Customer) => {
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
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cuentas por Cobrar
        </h1>
        <p className="text-muted-foreground">
          Gestión de créditos a clientes y cartera
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total por Cobrar
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalReceivable.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              {summary.customersWithBalance} clientes con saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.overdueAmount.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              {overdueCustomers.length} clientes con saldo vencido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Vigente</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.currentAmount.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">Sin vencimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Clientes con Saldo</TabsTrigger>
          <TabsTrigger value="overdue">
            Cuentas Vencidas ({overdueCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="aging">Aging de Cartera</TabsTrigger>
        </TabsList>

        {/* Tab: Todos los clientes con saldo */}
        <TabsContent value="all" className="space-y-4">
          <div>
            <Input
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
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
                      <TableCell className="text-right font-medium text-red-600">
                        ${customer.balance.toFixed(2)}
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Balance Total</TableHead>
                  <TableHead className="text-right">Monto Vencido</TableHead>
                  <TableHead className="text-center">Cargos Vencidos</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No hay cuentas vencidas
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueCustomers.map((status) => (
                    <TableRow key={status.customerId}>
                      <TableCell className="font-medium">
                        {status.name}
                      </TableCell>
                      <TableCell>{status.document}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${status.currentBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        ${status.overdueAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-red-600">
                          {status.overdueCount}
                        </span>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab: Aging de cartera */}
        <TabsContent value="aging" className="space-y-4">
          <Card>
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
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Bar dataKey="amount" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">0-30 días</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summary.agingData.current.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  31-60 días
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ${summary.agingData.days30.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  61-90 días
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${summary.agingData.days60.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">90+ días</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${summary.agingData.days90.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Registrar Abono */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Abono de Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerPaymentForm
              customer={selectedCustomer}
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
                    {accountStatus.document}
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
                  type="customer"
                />
              </div>

              <CustomerTransactionsList
                customerId={accountStatus.customerId!}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
