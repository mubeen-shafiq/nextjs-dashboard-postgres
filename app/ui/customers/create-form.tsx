'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import {
  CloudArrowUpIcon,
  EnvelopeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/app/ui/button';
import { createCustomer } from '@/app/lib/actions';

export default function Form() {
  const initialState = { message: '', errors: {} };
  const [state, dispatch] = useFormState(createCustomer, initialState);

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Name */}
        <div className="mb-4">
          <label
            htmlFor="customer-name"
            className="mb-2 block text-sm font-medium"
          >
            Name*
          </label>
          <div className="relative">
            <input
              id="customer-name"
              name="name"
              type="text"
              placeholder="Enter name"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="name-error"
            />
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name &&
              state.errors.name.map((error: string) => (
                <p className="name-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="customer-email"
            className="mb-2 block text-sm font-medium"
          >
            Email*
          </label>
          <div className="relative">
            <input
              id="customer-email"
              name="email"
              type="email"
              placeholder="Enter email"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="email-error"
            />
            <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email &&
              state.errors.email.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="customer-email"
            className="mb-2 block text-sm font-medium"
          >
            Image*
          </label>
          <div className="relative">
            <input
              id="customer-image-url"
              name="image_url"
              type="file"
              placeholder="Select Image"
              className="peer block w-full rounded-md border border-gray-200 bg-white py-2 pl-10 text-sm file:mr-3 file:cursor-pointer file:rounded file:border file:border-gray-300 file:bg-white file:text-gray-800"
              aria-describedby="image-url-error"
            />
            <CloudArrowUpIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="image-url-error" aria-live="polite" aria-atomic="true">
            {state.errors?.image_url &&
              state.errors.image_url.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create Customer</Button>
      </div>
    </form>
  );
}
