import { redirect } from '@sveltejs/kit';
import { getFirstPage } from '$lib/server/config/config';

export const load = async () => {
  const firstPage = getFirstPage();

  if (firstPage) {
    throw redirect(302, `/${firstPage.name.toLowerCase()}`);
  }

  throw redirect(302, '/home');
};
