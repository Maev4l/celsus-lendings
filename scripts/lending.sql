CREATE TABLE IF NOT EXISTS "lending"
(
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    book_id VARCHAR(36) NOT NULL,
    borrower_id VARCHAR(36) NOT NULL,
    status VARCHAR(100) NOT NULL,
    lent_at DATE NOT NULL DEFAULT CURRENT_DATE,
    returned_at DATE DEFAULT(NULL),
    CONSTRAINT lending_id_key UNIQUE (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

-- Test for PENDING lend book transaction with SUCCESSFUL book validation
INSERT INTO "lending" ("id", "user_id", "book_id", "borrower_id", "status") VALUES ('1', 'user1', 'book1', 'contact1','PENDING');
-- Test for PENDING lend book transaction with FAILED book validation
INSERT INTO "lending" ("id", "user_id", "book_id", "borrower_id", "status") VALUES ('2', 'user1', 'book2', 'contact1','PENDING');

-- Test for BOOK_VALIDATED lend book transaction with SUCCESSFUL borrower validation
INSERT INTO "lending" ("id", "user_id", "book_id", "borrower_id", "status") VALUES ('3', 'user1', 'book3', 'contact1','BOOK_VALIDATED');
-- Test for BOOK_VALIDATED lend book transaction with FAILED borrower validation
INSERT INTO "lending" ("id", "user_id", "book_id", "borrower_id", "status") VALUES ('4', 'user1', 'book4', 'contact1','BOOK_VALIDATED');