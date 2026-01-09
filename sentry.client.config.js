import * as Sentry from "@sentry/nextjs";

console.log("Sentry client replay init"); // optional debug

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,


  replaysSessionSampleRate: 0.0,

  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.Replay(),
  ],
});
