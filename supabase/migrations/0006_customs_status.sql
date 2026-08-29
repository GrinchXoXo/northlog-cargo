-- Phase 3 — Administrator Operations Dashboard
-- Migration 0006: add CUSTOMS_CLEARANCE status
--
-- This file does nothing else. Postgres does not allow a newly added
-- enum value to be referenced in the same transaction that added it, so
-- this must be run (and committed) on its own before any migration that
-- uses 'CUSTOMS_CLEARANCE' as a literal. See PRD section 20.
--
-- Run this file by itself in the SQL Editor before 0007/0008.

alter type shipment_status add value 'CUSTOMS_CLEARANCE' after 'ARRIVED_DESTINATION_COUNTRY';
