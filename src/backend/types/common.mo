module {
  // Cross-cutting identifiers shared across all domains.
  // `UserId` is the Internet Identity-derived caller principal.
  public type UserId = Principal;

  // Nanosecond timestamp (Time.now()) used for all createdAt/updatedAt/date
  // fields across every domain.
  public type Timestamp = Int;

  // Generic numeric entity id used by domains that key records by a Nat.
  public type Id = Nat;

  // Common result/error type for domain APIs that return a shared failure a
  // caller can act on. Domains may define their own richer error variants
  // (e.g. VitalsError) where the failure carries domain-specific data.
  public type CommonError = {
    #notAuthorized;
    #notFound;
    #invalidInput;
    #conflict;
  };
};
