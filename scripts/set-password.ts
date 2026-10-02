/**
 * Set (or reset) the password for any account from your terminal — useful for the owner account before email works.
 *
 *   npm run user:password -- sales@liquidationpalletssale.com
 *
 * You type the new password when asked (it isn't shown or saved anywhere except as a secure hash).
 */
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Hide typed characters.
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
        if (s.includes(question)) process.stdout.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const email = (process.argv[2] ?? (await ask("Account email: "))).trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) throw new Error(`No account with the email ${email}`);
  const pw = await ask("New password (min 10 characters): ", true);
  if (pw.length < 10) throw new Error("Use at least 10 characters.");
  if ((await ask("Repeat the password: ", true)) !== pw) throw new Error("The passwords don't match.");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(pw, 10) } });
  await db.passwordReset.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({ data: { userId: user.id, userEmail: email, action: "user.password", target: email, detail: "Password set from the command line" } });
  console.log(`Password updated for ${email} (${user.role}). You can sign in at /login.`);
}

main()
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
