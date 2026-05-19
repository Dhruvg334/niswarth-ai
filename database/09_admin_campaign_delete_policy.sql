create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  );
$$;

grant execute on function public.is_org_admin(uuid) to authenticated;

grant delete on campaigns to authenticated;

drop policy if exists "Admins can delete organization campaigns" on campaigns;
create policy "Admins can delete organization campaigns"
on campaigns for delete
to authenticated
using (public.is_org_admin(organization_id));
