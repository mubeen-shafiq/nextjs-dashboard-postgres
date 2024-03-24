'use server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import fs from 'fs/promises';

export async function saveFile(file: File, url: string) {
  const data = await file.arrayBuffer();
  await fs.writeFile(`./public${url}`, Buffer.from(data));
}

const invoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

export type InvoiceState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
const CreateInvoice = invoiceFormSchema.omit({ id: true, date: true });
export async function createInvoice(
  prevState: InvoiceState,
  formData: FormData,
) {
  // better way
  // const rawFormData = Object.fromEntries(formData.entries())
  // course way

  /**
   * {parse} gives the fields and throw error if validation fails
   * {safeParse} gives errors or success state of the fields
   */
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch (error) {
    return {
      message: 'Database Error: Unable to create invoice.',
    };
  }

  // ** revalidate cached data in the dashboard/invoices route segment
  revalidatePath('/dashboard/invoices');

  // ** redirect to the listing page
  redirect('/dashboard/invoices');
}

const UpdateInvoice = invoiceFormSchema.omit({ date: true });
export async function updateInvoice(
  invoiceId: string,
  prevState: InvoiceState,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    id: invoiceId,
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Missing fields. Failed to update invoice!',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Unable to update invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Unable to delete invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
}

// customers actions

type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url: string[];
  };
  message?: string | null;
};

const customerSchema = z.object({
  id: z.string(),
  name: z
    .string({
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Please enter name!'),
  email: z.string().email({
    message: 'Please enter a valid email!',
  }),
  image_url: z.string({
    invalid_type_error: 'Please select a image!',
  }),
});

const CreateCustomer = customerSchema.omit({ id: true });

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
) {
  const image = formData.get('image_url') as File;
  const validationResults = CreateCustomer.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: image.name,
  });

  if (!validationResults.success) {
    return {
      errors: validationResults.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create customer',
    };
  }

  const { email, name, image_url } = validationResults.data;
  const updatedUrl = `/customers/${Date.now()}-${image_url.replaceAll(' ', '_')}`;

  try {
    const result =
      await sql`SELECT COUNT(*) FROM customers where customers.email = ${email}`;

    if (Number(result.rows[0].count) != 0)
      return {
        errors: {
          email: ['Email already exist'],
        },
        message: 'Invalid Fields!',
      };

    await sql`INSERT INTO customers (name, email, image_url) VALUES (${name}, ${email}, ${updatedUrl})`;

    await saveFile(image, updatedUrl);
  } catch (error) {
    console.log(error);
    return {
      message: 'Database Error. Unable to create customer',
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    const result =
      await sql`SELECT customers.image_url FROM customers WHERE customers.id = ${id}`;

    if (result.rowCount === 0)
      return {
        message: 'Customer not found!',
      };

    const { image_url } = result.rows[0];
    await fs.unlink(`./public${image_url}`);

    await sql`DELETE FROM customers WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Unable to delete customer.',
    };
  }
  revalidatePath('/dashboard/customers');
}

// ...

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
