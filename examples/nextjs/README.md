This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Using Pinggy for Public Tunneling

This example is configured to use [Pinggy](https://pinggy.io/) to expose your local Next.js dev server to the public internet via a secure tunnel.

### How it works

- When you run the dev server, Pinggy will automatically start and print a public URL in your terminal, e.g.:
  ```
  Forwarding to: localhost:3000 from ingress at: https://your-subdomain.pinggy.link
  ```
- Share this public URL to let others access your local dev server from anywhere.

### Requirements

- Make sure you have the `pinggy` package installed:
  ```bash
  npm install @pinggy/pinggy
  ```
- The tunnel is started via the `pinggy.config.js` file in the project root. You can customize the tunnel options there if needed.

### Note for Next.js 15 and above

- For future Next.js versions, you may need to add your Pinggy public URL to the `allowedDevOrigins` array in `next.config.js` to avoid CORS issues. See the [Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins) for details.

### Example: Customizing Pinggy

You can edit `pinggy.config.js` to customize the tunnel. For example:

```js
import { pinggy } from "@pinggy/pinggy";

const makeListener = process.send === undefined;
let host = "localhost";
let port = process.env.PORT || "3000";

if (makeListener) {
  pinggy
    .forward({
      type: "http",
      forwardTo: `${host}:${port}`,
      // token: "your-premium-token", // Uncomment to use a premium token
      // ipWhitelist: ["192.168.1.0/24"], // Restrict access
      // basicAuth: { admin: "password123" }, // Add basic auth
    })
    .then((tunnel) => {
      console.log("Tunnel URLs:", tunnel.urls());
    });
}
```
## Detailed documentation

For detailed usage, API reference, and examples, see the Pinggy Node.js SDK documentation: [Pinggy SDK for Node.js](https://pinggy-io.github.io/sdk-nodejs/).

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
