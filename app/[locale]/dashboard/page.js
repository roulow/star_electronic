/** @format */
import DashboardClient from './page.client';
import { getMessages } from '../../../lib/i18n';
import RedBorderBottom from '@/components/RedBorderBottom';

export default async function DashboardPage({ params }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  return (
    <>
      <RedBorderBottom />
      <DashboardClient locale={locale} messages={messages} />
    </>
  );
}
