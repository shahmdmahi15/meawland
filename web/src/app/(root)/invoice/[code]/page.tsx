import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderInvoiceDataAction } from "@/actions/invoice/get-invoice-data";
import { StandaloneInvoiceView } from "./invoice-view";

interface InvoicePageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({
  params,
}: InvoicePageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Sales Invoice #${code} | Meawland`,
    description: `Official Sales Invoice for Order #${code} from Meawland Pet Store.`,
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { code } = await params;

  const result = await getOrderInvoiceDataAction(code);
  if (!result.success || !result.data) {
    notFound();
  }

  return <StandaloneInvoiceView invoiceData={result.data} />;
}
