-- Check database schema and permissions
SELECT 
    tablename,
    tableowner,
    has_table_privilege('service_role', tablename::regclass, 'SELECT') as can_select,
    has_table_privilege('service_role', tablename::regclass, 'INSERT') as can_insert,
    has_table_privilege('service_role', tablename::regclass, 'UPDATE') as can_update,
    has_table_privilege('service_role', tablename::regclass, 'DELETE') as can_delete
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

