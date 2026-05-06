import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body { background-color: #080810; color-scheme: dark; }
              * { box-sizing: border-box; }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
