# Publisher publishing integration (frontend handoff)

Current UI: Sponsor Merkezi is public. PublisherWorkspace uses the existing AuthContext. Only an authenticated Publisher role or Admin gets the editing UI. Development-only layout preview never modifies AuthContext, JWT roles or shared sponsor data. Its form creates only an in-memory card preview; it does not publish, contact users, or write to the Gold store.

Required backend policy: Admin grants/revokes Publisher. A publisher owns their promotions. On creation/update by a verified Publisher, publish to the publisher directory automatically without a second content-approval step. The frontend must never supply authoritative owner, role, tier or approval status. Server checks JWT identity and current role for every write; enforce ownership on edit/delete. Revocation must disable new writes and follow the agreed visibility policy.

Gold slots: independent sponsorship entitlement assigned by Admin; Publisher alone cannot create/upgrade Gold campaigns. Homepage OfficialSponsor uses tier=gold; public center lists all eligible sponsors. Publish only date-eligible active campaigns. Existing sponsor admin remains Admin-only.

Backend endpoints, persistence, rate limits and application review must be implemented by the backend owner. No migration or shared publish API was invented in this frontend repository. Reuse existing identity; no second login. Keep account/UI previews out of production by import.meta.env.DEV.
