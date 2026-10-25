# Forma Furniture — Phase 5 Merchant Approval Record

**Purpose:** Collect the merchant's decisions and written approvals required
before production delivery quotes or COD orders are enabled. This is a blank
approval record; no product, price, policy, legal fact, or permission is
pre-approved here.

**Current gate:** BLOCKED. The local readiness check recorded in
[`PHASE_STATUS.md`](PHASE_STATUS.md) found COD disabled, no valid delivery PINs,
and no published merchant-approved product with sellable inventory. The local
PostgreSQL database and local preview are not production evidence.

## How to complete this record

1. The merchant or an authorized business representative supplies the facts
   and policy choices below and attaches supporting records where relevant.
2. The merchant confirms authority to approve the business, product, image,
   privacy and fulfillment content. Legal/tax advice remains with the
   merchant's qualified advisers.
3. The developer records how each approved decision is represented and tested
   in the application. DevOps records where the approved runtime settings are
   installed and who controls them; this document must not contain secrets.
4. Keep this record and its referenced evidence with the release record. A
   blank field, draft, chat statement, sample product, or test fixture does not
   count as approval.

## Merchant decisions and sign-off

Every row is **Pending** until the merchant supplies evidence and signs the
approval below. Use an attached, dated sheet for multiple SKUs or PIN-code
zones; identify that sheet in the Evidence column.

| Decision | Information the merchant must approve | Evidence to retain | Status | Responsible owner |
|---|---|---|---|---|
| Seller identity and customer contact | Legal seller name, trading name, registered/business address as applicable, monitored customer-support email/phone, public contact details and any showroom/address/hours claims shown at checkout or in the footer. | Business identity record and approved public copy/contact ownership. | Pending | Merchant; DevOps verifies controlled contact channels; Developer updates approved copy. |
| Initial real SKU and variants | For each sellable item: stable SKU, product name, category, variant/options, materials/finish, dimensions, weight where relevant, included components, care/safety facts, lead time, warranty, and any limitations. Confirm exact source of every factual claim. | Signed SKU sheet or merchant catalogue record with a reviewer and date. | Pending | Merchant supplies and approves; Developer models/validates. |
| Price and tax presentation | Currency (INR), selling price per variant, whether prices include applicable taxes, tax classification/rate supplied by the merchant's tax adviser, rounding/promotion rules, and permitted price-change authority. | Approved price/tax sheet and written tax-adviser/merchant determination as appropriate. | Pending | Merchant and tax adviser; Developer implements integer-paise server pricing. |
| Product media and usage rights | Canonical image/gallery file for each SKU, source/creator, rights or license covering website/app commerce and any geographic/channel limits; identify which image is the authoritative product depiction. | Asset-to-SKU register, license/ownership evidence, merchant approval. | Pending | Merchant approves rights and accuracy; Developer maps files and preserves originals. |
| Inventory source and sellable quantity | System/source of truth, opening on-hand quantity by SKU/variant, reserved/damaged/safety stock treatment, refresh/reconciliation cadence, replenishment authority and person permitted to adjust stock. | Dated stock count/export and named reconciliation owner. | Pending | Merchant/warehouse owner supplies counts; Developer maps SKUs and guards adjustments; DevOps controls production database access/backups. |
| Delivery coverage | Exact six-digit serviceable PIN codes or formally defined zones, exclusions, oversized-item exceptions, remote-area rules, and how coverage changes are approved. | Dated service-area list and exception policy. | Pending | Merchant/logistics owner; Developer validates server-side; DevOps applies approved non-secret runtime configuration. |
| Delivery and assembly charges | Per-zone shipping/delivery fees, assembly/handling charges, tax treatment, thresholds, bulky-item/split-shipment rules, and whether any promotion is active. State exact amounts and currency. | Approved fee table, effective date, and promotion terms if any. | Pending | Merchant/logistics and tax adviser; Developer implements authoritative quote rules. |
| Delivery estimate and promises | Dispatch/lead-time calculation, business-day/calendar convention, carrier assumptions, areas excluded, and exact wording customers may rely on. Approve or remove existing delivery promises. | Approved service-level table and storefront wording. | Pending | Merchant/logistics owner; Developer updates customer-facing copy. |
| COD eligibility and collection | Whether COD is offered; eligible PINs/SKUs/order-value bounds; COD fee or confirmation that it is zero; excluded products/customers; collection, failed-delivery, refusal, reconciliation, and remittance process; who confirms funds collected and closes the order. | Signed COD policy and named collection/reconciliation owner. | Pending | Merchant/finance/logistics; Developer enforces policy; DevOps does not enable COD without release authorization. |
| Guest/account and identity requirements | Approve sign-in and verified-email requirement for ordering, profile fields, guest-cart merge behavior, and what happens when identity verification fails. The current checkout requires a signed-in, email-verified customer. | Approved checkout requirements and customer-support handling. | Pending | Merchant; Developer implements and documents behavior. |
| Address and phone collection | Required/optional fields, address line limits, phone format/use, delivery-contact use, handling of delivery instructions, and whether collection of each field is necessary. | Approved field-purpose matrix. | Pending | Merchant/privacy owner; Developer validates and limits collection. |
| Fulfillment consent and privacy notice | Exact notice and affirmative consent for using the delivery address/contact data to fulfil the order; lawful basis, purposes, sharing with carriers, retention/deletion schedule, customer rights/contact, and any consent withdrawal behavior. | Merchant-approved privacy wording and privacy/legal review. | Pending | Merchant/privacy or legal owner; Developer stores consent version/time and enforces it; DevOps enforces approved retention/security controls. |
| Order acknowledgement and receipt | Approved success/acknowledgement wording; distinguish “order placed / COD amount due” from paid; order number and amount fields; sender/channel; seller/tax fields required on a receipt or invoice; correction/contact instructions. Confirm whether a tax invoice is separate and when issued. | Approved message/receipt specimen and seller/tax data. | Pending | Merchant and tax adviser; Developer implements the agreed acknowledgement. A formal invoice/receipt delivery workflow is not represented as implemented in Phase 5. |
| Changes, cancellation and failed delivery | Customer/merchant change window, COD cancellation rules, stock release behavior, failed delivery/refusal/return-to-origin charges, dispute escalation and who may authorize exceptions. | Dated written policy and operator escalation route. | Pending | Merchant/logistics/support; Developer maps permitted actions; later fulfillment functionality remains a separate phase. |
| Support and incident ownership | Who handles order questions, PIN/quote disputes, cancellation, COD reconciliation discrepancies, privacy requests and production incidents; support hours and escalation target. | Named role/team and monitored contact/escalation record. | Pending | Merchant names business owners; DevOps names technical on-call; Developer documents application failure modes. |

## Approval signatures

**Merchant legal/business entity:** ______________________________________

**Authorized representative and role:** __________________________________

**Signature / approved electronic record reference:** _____________________

**Date and timezone:** ____________________  **Approval version:** ________

**Scope approved:** (attach SKU, service-area, fee, COD, privacy and receipt
records and list their document IDs here)

___________________________________________________________________________

**Conditions/exclusions:**

___________________________________________________________________________

Approval applies only to the named facts, policy version, products, areas and
effective date. It does not authorize online payments, production deployment,
or a live COD pilot unless those are separately approved under their own
phase/release gates.

## Separate implementation and operations sign-off

| Role | Confirms | Name / record | Date | Status |
|---|---|---|---|---|
| Developer | Approved data and policy are implemented server-side; client-supplied totals are not authoritative; tests and migration evidence are attached; unsupported receipt/invoice/fulfillment scope is explicitly described. |  |  | Pending |
| DevOps / release owner | Production database, access controls, backups/restore, secrets, TLS, trusted ingress/rate limiting, monitoring, rollback, email delivery and configuration custody are verified. No secret is written into this document. |  |  | Pending |
| Merchant operations / finance | Named staff can manage orders, verify COD collection, reconcile receipts and escalate customer issues under the approved policy. |  |  | Pending |

**Phase 5 merchant approval is not itself a PASS.** The developer and DevOps
owners must complete the separate checklist, then the merchant must explicitly
authorize the final acceptance run. Keep the phase BLOCKED until all evidence
exists and the acceptance order has been authorized and verified.
