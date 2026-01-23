-- docker/supabase/migrations/004_add_families_and_fees.sql
-- Migration 004: families + fees + payments + notes
-- Date: 2026-01-21

-- Families
CREATE TABLE IF NOT EXISTS education.families (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    label TEXT,
    divorced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id)
);

ALTER TABLE education.users
ADD COLUMN IF NOT EXISTS family_id UUID;

ALTER TABLE education.users
ADD CONSTRAINT users_family_id_fkey FOREIGN KEY (family_id)
  REFERENCES education.families(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_family_id_idx ON education.users(family_id);

-- Fees
CREATE TABLE IF NOT EXISTS education.fees (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    student_id UUID,
    academic_year TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id),
    CONSTRAINT fees_fee_type_check CHECK (fee_type IN ('registration', 'membership')),
    CONSTRAINT fees_amount_due_check CHECK (amount_due >= 0),
    CONSTRAINT fees_family_id_fkey FOREIGN KEY (family_id)
        REFERENCES education.families(id) ON DELETE CASCADE,
    CONSTRAINT fees_student_id_fkey FOREIGN KEY (student_id)
        REFERENCES education.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS fees_family_id_idx ON education.fees(family_id);
CREATE INDEX IF NOT EXISTS fees_student_id_idx ON education.fees(student_id);
CREATE INDEX IF NOT EXISTS fees_academic_year_idx ON education.fees(academic_year);

-- Payments
CREATE TABLE IF NOT EXISTS education.fee_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    fee_id UUID NOT NULL,
    amount_paid NUMERIC(10,2) NOT NULL,
    method TEXT NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fee_payments_method_check CHECK (
      method IN ('cheque', 'liquide', 'espece', 'cb', 'helloasso', 'exoneration')
    ),
    CONSTRAINT fee_payments_amount_paid_check CHECK (amount_paid > 0),
    CONSTRAINT fee_payments_fee_id_fkey FOREIGN KEY (fee_id)
        REFERENCES education.fees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS fee_payments_fee_id_idx ON education.fee_payments(fee_id);
CREATE INDEX IF NOT EXISTS fee_payments_paid_at_idx ON education.fee_payments(paid_at);

-- Notes
CREATE TABLE IF NOT EXISTS education.fee_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    fee_id UUID NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT fee_notes_fee_id_fkey FOREIGN KEY (fee_id)
        REFERENCES education.fees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS fee_notes_fee_id_idx ON education.fee_notes(fee_id);
