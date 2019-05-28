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
