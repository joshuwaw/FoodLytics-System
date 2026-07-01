import sys
sys.path.append('.')
from database import supabase

roles_to_try = ['Staf', 'Staff', 'Staf Operasi', 'Operator', 'Pekerja', 'Admin']
for role in roles_to_try:
    try:
        # Try to insert
        res = supabase.table('tbl_pengguna').insert({
            'nama': 'Test Role',
            'emel': f'test_{role.lower().replace(" ", "")}@test.com',
            'kata_laluan': 'testpass',
            'peranan': role
        }).execute()
        if res.data:
            print(f'SUCCESS for role: {role}')
            # Clean up
            supabase.table('tbl_pengguna').delete().eq('id_pengguna', res.data[0]['id_pengguna']).execute()
    except Exception as e:
        print(f'FAILED for role: {role} -> {str(e)}')
