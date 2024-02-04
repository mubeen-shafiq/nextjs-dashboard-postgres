'use server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const invoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  // coerce == change
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = invoiceFormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
  // better way
  // const rawFormData = Object.fromEntries(formData.entries())
  // course way
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;

  // ** revalidate cached data in the dashboard/invoices route segment
  revalidatePath('/dashboard/invoices');

  // ** redirect to the listing page
  redirect('/dashboard/invoices');
}
