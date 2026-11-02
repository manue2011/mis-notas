// Tiny terminal prompts for the admin scripts, without readline: readline's
// echo misbehaved in Windows terminals (typed text didn't show).
//
// In a real terminal, keys are read in raw mode and echoed by hand (or as
// "*" for secrets). When stdin is piped (tests, CI), answers are read line
// by line.

import { stdin, stdout } from "node:process";

let pipedLines = null;

async function readPipedLine() {
  if (!pipedLines) {
    let data = "";
    for await (const chunk of stdin) data += chunk;
    pipedLines = data.split(/\r?\n/);
  }
  return pipedLines.shift() ?? "";
}

function readTtyLine({ secret }) {
  return new Promise((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();

    const finish = (result) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      resolve(result);
    };

    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish(value);
        if (ch === "\u0003") {
          // Ctrl+C
          stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = Array.from(value).slice(0, -1).join("");
            stdout.write("\b \b");
          }
          continue;
        }
        if (ch < " ") continue; // other control keys
        value += ch;
        stdout.write(secret ? "*" : ch);
      }
    };
    stdin.on("data", onData);
  });
}

/** Asks a question and returns the answer. Secrets are shown as "*". */
export async function ask(question, { secret = false } = {}) {
  stdout.write(question);
  if (!stdin.isTTY) {
    const line = await readPipedLine();
    stdout.write(secret ? "\n" : `${line}\n`);
    return line;
  }
  return readTtyLine({ secret });
}
