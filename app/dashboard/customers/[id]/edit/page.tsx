import { notFound } from 'next/navigation';
import { fetchCustomerById } from '@/app/lib/data';
import Breadcrumbs from '@/app/ui/breadcrumbs';
import { Metadata } from 'next';

type PropTypes = {
  params: {
    id: string;
  };
};

export const metadata: Metadata = {
  title: 'Edit Customer',
};

async function EditCustomer({ params }: PropTypes) {
  const { id } = params;
  const customer = await fetchCustomerById(id);

  if (!customer) return notFound();
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Edit Customer',
            href: `/dashboard/customers/${id}/edit`,
            active: true,
          },
        ]}
      />
    </main>
  );
}

export default EditCustomer;
