/**
 * (app) HOME — Redirects directly to /chat
 *
 * The chat with Creative Agent IS the home of the app.
 * No more dashboard. No more "choose your tool."
 * One conversation drives everything.
 */

import { redirect } from 'next/navigation';

export default function AppHomePage() {
  redirect('/chat');
}
