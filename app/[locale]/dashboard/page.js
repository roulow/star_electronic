/** @format */
import DashboardClient from "./page.client";
import { getMessages } from "../../../lib/i18n";

export default async function DashboardPage({ params }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  return <DashboardClient locale={locale} messages={messages} />;
}
