# Security Policy

## Principles
1. **Zero Trust**: No implicit trust granted based on network location.
2. **Tenant Isolation**: Mandatory `tenant_id` for all tenant-owned objects, enforced via application logic and database Row Level Security (RLS).
3. **Least Privilege**: Strict RBAC for all system and tenant users.
4. **Human in the Loop**: AI actions with side effects require explicit human approval.

## Data Classification
- PUBLIC
- INTERNAL
- CONFIDENTIAL
- PERSONAL_DATA
- SENSITIVE_PERSONAL_DATA

## Reporting a Vulnerability
Please do not open a public issue. Email security@example.com instead.
