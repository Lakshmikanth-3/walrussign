module walrussign::document {
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};
  use std::string::{String};
  use sui::clock::{Self, Clock};

  const E_ALREADY_SIGNED: u64 = 1;
  const E_NOT_PARTY:       u64 = 2;

  public struct Document has key, store {
    id:             UID,
    walrus_blob_id: String,     // Walrus blob ID of the document
    doc_hash:       vector<u8>, // SHA-256 of original file
    party_a:        address,
    party_b:        address,
    signed_a:       bool,
    signed_b:       bool,
    signed_at:      u64,        // Sui clock timestamp (ms) when both signed
    locked:         bool,
  }

  public fun create_document(
    blob_id:  String,
    hash:     vector<u8>,
    party_b:  address,
    ctx:      &mut TxContext
  ) {
    let doc = Document {
      id:             object::new(ctx),
      walrus_blob_id: blob_id,
      doc_hash:       hash,
      party_a:        tx_context::sender(ctx),
      party_b,
      signed_a:       false,
      signed_b:       false,
      signed_at:      0,
      locked:         false,
    };
    transfer::share_object(doc);
  }

  public fun sign(
    doc:   &mut Document,
    clock: &Clock,
    ctx:   &mut TxContext
  ) {
    assert!(!doc.locked, E_ALREADY_SIGNED);
    let signer = tx_context::sender(ctx);
    assert!(signer == doc.party_a || signer == doc.party_b, E_NOT_PARTY);

    if (signer == doc.party_a) { doc.signed_a = true; }
    else                       { doc.signed_b = true; };

    if (doc.signed_a && doc.signed_b) {
      doc.locked    = true;
      doc.signed_at = clock::timestamp_ms(clock);
    };
  }
}
