# BIMI for the Gmail sender avatar

The avatar next to `OpenWorlds Careers Bot` in Gmail is controlled by BIMI, not by the email HTML. Gmail only displays BIMI for a domain with a VMC or CMC, so the remaining steps are external.

## Prepared

- `public/bimi-logo.svg` — square, solid-background, SVG Tiny PS artwork for the VMC/CMC application.
- DMARC on `openworlds.dk` is already `p=reject`; `pct` defaults to `100`.
- Gmail reads the logo from the PEM certificate, not from a standalone SVG.

## 1. Deploy the logo

Deploy the site and confirm:

`https://openworlds.dk/bimi-logo.svg` returns `image/svg+xml`.

## 2. Get a VMC or CMC

Submit `public/bimi-logo.svg` to a BIMI certificate authority. A VMC requires a registered trademark; a CMC is the option for an unregistered mark. The CA returns a PEM file containing the verified logo and certificate.

## 3. Publish the PEM

Append the intermediate and root certificates in the order issued, then upload the file as:

`public/bimi-certificate.pem`

Confirm it is publicly reachable at:

`https://openworlds.dk/bimi-certificate.pem`

## 4. Add the DNS record

At Simply.com, add a TXT record:

- Name: `default._bimi`
- Value: `v=BIMI1;l=;a=https://openworlds.dk/bimi-certificate.pem`

Do not add the record until the PEM URL is live. The empty `l=` is intentional: Gmail reads the logo from the PEM.

## 5. Verify

- BIMI Group SVG assistant: https://bimigroup.org/bimi-svg-assistant-tool
- BIMI Group BIMI Inspector: https://bimigroup.org/bimi-generator
- Send a test to a Gmail inbox. DNS can take up to 48 hours.

## Notes

- Gmail requires the PEM/VMC route; a standalone SVG is not enough for Gmail.
- The message must pass DMARC for `openworlds.dk`. Keep the sending provider's DKIM aligned with the domain.
- Keep the SVG and PEM at stable URLs, and renew the certificate before it expires.
