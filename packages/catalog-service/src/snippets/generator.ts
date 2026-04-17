import { ParsedEndpoint } from '../parser/types';

type SnippetLanguage = 'javascript' | 'python' | 'java' | 'curl';

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

/**
 * Generate a code snippet for a given endpoint in the specified language.
 */
export function generateSnippet(
  endpoint: ParsedEndpoint,
  baseUrl: string,
  lang: SnippetLanguage,
): string {
  const method = endpoint.method.toUpperCase();
  const url = `${baseUrl}${endpoint.path}`;
  const hasBody = METHODS_WITH_BODY.includes(method);

  switch (lang) {
    case 'curl':
      return generateCurl(method, url, hasBody);
    case 'javascript':
      return generateJavaScript(method, url, hasBody);
    case 'python':
      return generatePython(method, url, hasBody);
    case 'java':
      return generateJava(method, url, hasBody);
  }
}

function generateCurl(method: string, url: string, hasBody: boolean): string {
  const lines = [
    `curl -X ${method} '${url}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Authorization: Bearer <YOUR_TOKEN>'`,
  ];

  if (hasBody) {
    lines[lines.length - 1] += ' \\';
    lines.push(`  -d '{"key": "value"}'`);
  }

  return lines.join('\n');
}

function generateJavaScript(method: string, url: string, hasBody: boolean): string {
  const lines: string[] = [];
  lines.push(`const response = await fetch('${url}', {`);
  lines.push(`  method: '${method}',`);
  lines.push(`  headers: {`);
  lines.push(`    'Content-Type': 'application/json',`);
  lines.push(`    'Authorization': 'Bearer <YOUR_TOKEN>',`);
  lines.push(`  },`);

  if (hasBody) {
    lines.push(`  body: JSON.stringify({ key: 'value' }),`);
  }

  lines.push(`});`);
  lines.push(``);
  lines.push(`const data = await response.json();`);
  lines.push(`console.log(data);`);

  return lines.join('\n');
}

function generatePython(method: string, url: string, hasBody: boolean): string {
  const lines: string[] = [];
  lines.push(`import requests`);
  lines.push(``);
  lines.push(`headers = {`);
  lines.push(`    'Content-Type': 'application/json',`);
  lines.push(`    'Authorization': 'Bearer <YOUR_TOKEN>',`);
  lines.push(`}`);
  lines.push(``);

  if (hasBody) {
    lines.push(`payload = {'key': 'value'}`);
    lines.push(``);
    lines.push(`response = requests.${method.toLowerCase()}('${url}', headers=headers, json=payload)`);
  } else {
    lines.push(`response = requests.${method.toLowerCase()}('${url}', headers=headers)`);
  }

  lines.push(``);
  lines.push(`print(response.status_code)`);
  lines.push(`print(response.json())`);

  return lines.join('\n');
}

function generateJava(method: string, url: string, hasBody: boolean): string {
  const lines: string[] = [];
  lines.push(`import java.net.URI;`);
  lines.push(`import java.net.http.HttpClient;`);
  lines.push(`import java.net.http.HttpRequest;`);
  lines.push(`import java.net.http.HttpResponse;`);
  lines.push(``);
  lines.push(`HttpClient client = HttpClient.newHttpClient();`);
  lines.push(``);

  if (hasBody) {
    lines.push(`String body = "{\\\"key\\\": \\\"value\\\"}";`);
    lines.push(``);
    lines.push(`HttpRequest request = HttpRequest.newBuilder()`);
    lines.push(`    .uri(URI.create("${url}"))`);
    lines.push(`    .header("Content-Type", "application/json")`);
    lines.push(`    .header("Authorization", "Bearer <YOUR_TOKEN>")`);
    lines.push(`    .method("${method}", HttpRequest.BodyPublishers.ofString(body))`);
    lines.push(`    .build();`);
  } else {
    lines.push(`HttpRequest request = HttpRequest.newBuilder()`);
    lines.push(`    .uri(URI.create("${url}"))`);
    lines.push(`    .header("Content-Type", "application/json")`);
    lines.push(`    .header("Authorization", "Bearer <YOUR_TOKEN>")`);
    lines.push(`    .method("${method}", HttpRequest.BodyPublishers.noBody())`);
    lines.push(`    .build();`);
  }

  lines.push(``);
  lines.push(`HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`);
  lines.push(`System.out.println(response.statusCode());`);
  lines.push(`System.out.println(response.body());`);

  return lines.join('\n');
}
