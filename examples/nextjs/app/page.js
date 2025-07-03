import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>app/page.js</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        {/* Pinggy usage info */}
        <section className={styles.pinggySection}>
          <h2>Using Pinggy with Next.js</h2>
          <p>
            This project is configured to use{" "}
            <a
              href="https://pinggy.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pinggy
            </a>{" "}
            for secure public tunneling to your local Next.js dev server.
            <br />
            When you run <code>npm run dev</code>, Pinggy will print a public
            URL in your terminal, e.g.:
            <br />
            <code>
              Forwarding to: localhost:3000 from ingress at:
              https://your-subdomain.pinggy.link
            </code>
          </p>
          <ul>
            <li>
              <strong>Share this public URL</strong> to let others access your
              local dev server from anywhere.
            </li>
            <li>
              <strong>Note:</strong> For future Next.js versions, you may need
              to add your Pinggy public URL to <code>allowedDevOrigins</code> in{" "}
              <code>next.config.js</code> to avoid CORS issues. See{" "}
              <a
                href="https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins"
                target="_blank"
                rel="noopener noreferrer"
              >
                the docs
              </a>
              .
            </li>
          </ul>
        </section>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
