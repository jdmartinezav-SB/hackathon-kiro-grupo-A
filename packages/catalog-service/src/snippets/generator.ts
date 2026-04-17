const BASE_URL = 'https://api.conecta2.bolivar.com';

export function generateSnippet(
  lang: string,
  method: string,
  path: string,
  body?: object
): string {
  const url = `${BASE_URL}${path}`;
  const upperMethod = method.toUpperCase();
  const bodyJson = body ? JSON.stringify(body, null, 2) : undefined;
  const bodyJsonInline = body ? JSON.stringify(body) : undefined;

  switch (lang) {
    case 'curl':
      return generateCurl(upperMethod, url, bodyJsonInline);
    case 'javascript':
      return generateJavaScript(upperMethod, url, bodyJson);
    case 'python':
      return generatePython(upperMethod, url, bodyJson);
    case 'java':
      return generateJava(upperMethod, url, bodyJsonInline);
    default:
      return `// Language "${lang}" is not supported`;
  }
}

function generateCurl(method: string, url: string, body?: string): string {
  const lines = [
    `curl -X ${method} '${url}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Authorization: Bearer YOUR_TOKEN'`,
  ];

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    lines[lines.length - 1] += ' \\';
    lines.push(`  -d '${body}'`);
  }

  return lines.join('\n');
}

function generateJavaScript(
  method: string,
  url: string,
  body?: string
): string {
  const options = [
    `  method: '${method}',`,
    `  headers: {`,
    `    'Content-Type': 'application/json',`,
    `    'Authorization': 'Bearer YOUR_TOKEN'`,
    `  }`,
  ];

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.push(`  body: JSON.stringify(${body})`);
  }

  return [
    `const response = await fetch('${url}', {`,
    ...options,
    `});`,
    `const data = await response.json();`,
  ].join('\n');
}

function generatePython(method: string, url: string, body?: string): string {
  const pyMethod = method.toLowerCase();
  const lines = ['import requests', ''];

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    lines.push(
      `response = requests.${pyMethod}(`,
      `    '${url}',`,
      `    headers={'Authorization': 'Bearer YOUR_TOKEN'},`,
      `    json=${body}`,
      `)`,
    );
  } else {
    lines.push(
      `response = requests.${pyMethod}(`,
      `    '${url}',`,
      `    headers={'Authorization': 'Bearer YOUR_TOKEN'}`,
      `)`,
    );
  }

  lines.push(`data = response.json()`);
  return lines.join('\n');
}

function generateJava(method: string, url: string, body?: string): string {
  const lines = [
    `HttpClient client = HttpClient.newHttpClient();`,
    `HttpRequest request = HttpRequest.newBuilder()`,
    `    .uri(URI.create("${url}"))`,
    `    .header("Content-Type", "application/json")`,
    `    .header("Authorization", "Bearer YOUR_TOKEN")`,
  ];

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    const escaped = body.replace(/"/g, '\\"');
    lines.push(
      `    .${method}(HttpRequest.BodyPublishers.ofString("${escaped}"))`,
    );
  } else {
    lines.push(`    .${method}()`);
  }

  lines.push(
    `    .build();`,
    `HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`,
  );

  return lines.join('\n');
}
