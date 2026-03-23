CREATE EXTENSION IF NOT EXISTS pgcrypto;   

CREATE TABLE IF NOT EXISTS safe_products (
  product_id   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category_id  UUID         NOT NULL
);

INSERT INTO safe_products (product_name, category_id) VALUES
  ('Safe Widget',  gen_random_uuid()),
  ('Safe Gadget',  gen_random_uuid()),
  ('Safe Doohickey', gen_random_uuid());
