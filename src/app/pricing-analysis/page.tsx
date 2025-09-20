import { PricingForm } from "./pricing-form";

export default function PricingAnalysisPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análise de Preços com IA</h1>
        <p className="text-muted-foreground">
          Use o poder da IA para encontrar a faixa de preço ideal para suas receitas.
        </p>
      </div>
      <PricingForm />
    </div>
  );
}
