import { StatsCards } from '@/components/dashboard/stats-cards';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { ExpensesPieChart } from '@/components/dashboard/expenses-pie-chart';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, Bem-vindo(a) de volta!</h1>
        <p className="text-muted-foreground">
          Aqui está um resumo do seu negócio.
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OverviewChart />
        <ExpensesPieChart />
      </div>
    </div>
  );
}
