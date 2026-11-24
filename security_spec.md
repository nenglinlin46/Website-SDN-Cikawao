# Security Specification — Portal SDN Cikawao

## 1. Data Invariants
1. **Admin Authority**: Only verified Google accounts matching `neng.linlin46@admin.sd.belajar.id` (with `email_verified == true`) or registered in `/admins/{uid}` can publish/edit news, announcements, PKKS records, gallery items, student academic records, GTK staff directory (`/staff/{staffId}`), or respond to SILOKA tickets.
2. **PII & Student Academic Isolation**: `/students/{studentId}` and `/parent_subscriptions/{uid}` and `/siloka_complaints/{complaintId}` cannot be listed or read by unrelated users. Parents can only read student records where `parentUid == request.auth.uid` or `parentEmail == request.auth.token.email`. Public `/staff/{staffId}` records intentionally exclude personal contact PII (phone, address, personal email).
3. **Immutable Ownership & Timestamps**: `createdAt` must equal `request.time` on creation and never change on update. `updatedAt` must equal `request.time` on every write. Author/owner UIDs (`authorUid`, `reporterUid`, `requesterUid`) must match `request.auth.uid` on create and stay immutable.
4. **Terminal State Locking**: Once a SILOKA ticket reaches `status == 'Selesai'` or a student link request reaches `'approved'` / `'rejected'`, non-admin users cannot modify it.
5. **Query Cost Protection**: `allow list` rules strictly evaluate `resource.data` or token-based `isBootstrappedAdmin()`, avoiding `get()` or `exists()` lookups in `list`.

## 2. Dirty Dozen Adversarial Payloads
1. Unverified email spoofing admin (`email: neng.linlin46@admin.sd.belajar.id`, `email_verified: false`) attempting write on `/news/n1` -> `PERMISSION_DENIED`.
2. Non-admin parent injecting shadow field `{"isVerified": true}` into `/siloka_complaints/c1` -> `PERMISSION_DENIED`.
3. Oversized ID poisoning (`1500` chars) on `/students/{studentId}` -> `PERMISSION_DENIED`.
4. Non-admin reading another parent's `/parent_subscriptions/{otherUid}` -> `PERMISSION_DENIED`.
5. Blank or unauthenticated `list` attempt on `/students` -> `PERMISSION_DENIED`.
6. Non-admin attempting to create a SILOKA ticket with `status: 'Selesai'` and pre-filled `adminResponse` -> `PERMISSION_DENIED`.
7. Reporter attempting to change `reporterUid` on update -> `PERMISSION_DENIED`.
8. Forged historical `createdAt` timestamp not equal to `request.time` -> `PERMISSION_DENIED`.
9. Non-admin attempting to self-promote in `/admins/{uid}` -> `PERMISSION_DENIED`.
10. Invalid score (`mathScore: 150` or `-5`) on `/students/{studentId}` -> `PERMISSION_DENIED`.
11. Unauthenticated user attempting to write `/jabar_beraksi/{reportId}` -> `PERMISSION_DENIED`.
12. Parent attempting to modify academic scores directly on `/students/{studentId}` -> `PERMISSION_DENIED`.
