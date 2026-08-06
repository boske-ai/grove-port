/** Argument parsing for `grove-port convert`, split out so it is testable. */

export interface ConvertOptions {
  from: string;
  inputPath: string;
  outputPath?: string;
  preview: boolean;
  userEmail?: string;
  label?: string;
}

const VALUE_FLAGS = new Set(['--from', '-o', '--output', '--email', '--label']);

/**
 * Flag-aware parse: a flag's value must not itself be a flag, and the input path
 * is any bare positional rather than strictly `--from`+2. Previously
 * `convert input.json --from chatgpt -o out` failed and `--email --label x`
 * silently captured `--label` as the address.
 */
export function parseConvertArgs(argv: string[]): ConvertOptions | null {
  const values = new Map<string, string>();
  const positionals: string[] = [];
  let preview = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]!;

    if (token === '--preview') {
      preview = true;
      continue;
    }

    if (VALUE_FLAGS.has(token)) {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) {
        console.error(`Missing value for ${token}`);
        return null;
      }
      values.set(token === '--output' ? '-o' : token, value);
      index += 1;
      continue;
    }

    if (token.startsWith('-')) {
      console.error(`Unknown flag: ${token}`);
      return null;
    }

    positionals.push(token);
  }

  const from = values.get('--from');
  if (!from) {
    return null;
  }

  const inputPath = positionals[0];
  if (!inputPath) {
    return null;
  }

  if (positionals.length > 1) {
    console.error(`Unexpected extra argument: ${positionals[1]}`);
    return null;
  }

  const outputPath = values.get('-o');
  if (!preview && !outputPath) {
    return null;
  }

  return {
    from,
    inputPath,
    outputPath,
    preview,
    userEmail: values.get('--email'),
    label: values.get('--label'),
  };
}
