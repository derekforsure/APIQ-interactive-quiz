-- Fix audit_logs table to allow NULL user_id for failed login attempts
ALTER TABLE audit_logs 
MODIFY COLUMN user_id INT NULL,
DROP FOREIGN KEY audit_logs_ibfk_1;

-- Add back foreign key without ON DELETE restriction
ALTER TABLE audit_logs
ADD CONSTRAINT fk_audit_user_id 
FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE SET NULL;
