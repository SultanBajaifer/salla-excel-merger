# Licensing

Every installation must be activated with a license key that is tied to one
machine. Verification happens entirely offline inside the app, so there is no
server to host or pay for.

## How it works

1. On first launch the app shows an activation screen with the **Machine ID**
   (e.g. `63F8-6SYZ-G75Y-X0P9`), the contact number `00966532839958` and a
   WhatsApp button that pre-fills a message containing the Machine ID.
2. You run `npm run license:issue` on **your** computer with that Machine ID. It
   signs the ID with your **private key** and prints the license key.
3. The customer pastes the key. The app checks the signature with the **public
   key** compiled into it and that the key belongs to this machine, then saves
   it to `%APPDATA%\salla-excel-merger\license.json`.
4. From then on the app opens normally, forever, with or without internet.

Details:

- The Machine ID is a hash of the Windows `MachineGuid`. It survives app updates
  and reinstalls, but changes if Windows itself is reinstalled — in that case
  the customer sends the new ID and you issue a new key.
- A key only works on the machine it was issued for, so sharing a key or
  copying `license.json` to another PC does not activate it.
- Keys are Ed25519 signatures. Without the private key nobody can create a
  valid key, even though the app's source code is public.
- The main process also refuses every file/Excel operation while unactivated,
  so hiding the activation screen does not unlock the app.

## One-time setup (do this before releasing v2.0.0)

```bash
npm install
npm run license:keygen
```

This creates:

- `~/.salla-excel-merger/license-private-key.pem` — your **private key**
  (on Windows: `C:\Users\<you>\.salla-excel-merger\`).
- `src/main/license/publicKey.ts` — updated with the matching public key.

Then:

1. **Back up the private key file** (password manager, USB drive). If you lose
   it you can no longer issue keys that work with existing releases; if it
   leaks, anyone can. Never commit it, email it or paste it anywhere.
2. Commit `src/main/license/publicKey.ts` and release.

`license:keygen` refuses to overwrite an existing private key, because a new key
pair would invalidate every license already issued. The release workflow runs
`npm run license:check` and fails if no public key has been committed.

To keep the private key elsewhere, set `LICENSE_PRIVATE_KEY_PATH` when running
the license scripts.

## Issuing a key

```bash
npm run license:issue -- 63F8-6SYZ-G75Y-X0P9 "Customer name"
```

The output is the license key to send to the customer. Every issued key is
also appended to `~/.salla-excel-merger/issued-licenses.csv` (date, machine ID,
note) as your record of who has been licensed.

The script refuses to run if your private key does not match the public key in
`src/main/license/publicKey.ts`, so you can't accidentally issue keys that the
released app would reject.

## Developing locally

The license check also runs in `npm run dev`. Either issue a key for your own
machine, or skip the check during development only:

```bash
$env:SALLA_SKIP_LICENSE=1; npm run dev   # Windows PowerShell
SALLA_SKIP_LICENSE=1 npm run dev          # macOS/Linux
```

The variable has no effect in installed (packaged) builds.

## Limits

No client-side protection is unbreakable. A technically skilled person can
modify the app's JavaScript to remove the check, or build their own copy from
the public source code. This scheme stops casual sharing of the installer and
of license keys, which is the realistic goal for a desktop app with no server.
