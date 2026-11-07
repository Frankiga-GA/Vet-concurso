# Run only against the existing local Supabase Docker container.
import json, queue, subprocess, threading, time, uuid
cmd = [
    "docker", "exec", "-i", "supabase_db_concurso", "sh", "-c",
    'exec psql -X -qAt -U postgres -d postgres "$@" 2>&1', "psql",
]
def once(sql):
    p = subprocess.run(cmd+['-v','ON_ERROR_STOP=1'], input=sql, text=True, capture_output=True, timeout=25)
    if p.returncode: raise RuntimeError((p.stderr or p.stdout).strip())
    return p.stdout.strip()
def uid(): return str(uuid.uuid4())
def lit(x): return "'" + x.replace("'","''") + "'"
def ids(xs): return ','.join(map(lit,xs))
people = [uid() for _ in range(3)]
sessions = [uid() for _ in range(2)]
apps = [uid() for _ in range(5)]
clinics = [uid() for _ in apps]
revision = '2026-11-06T02:00:00.123456Z'
tag = uid()[:12]
print('Run:',tag,flush=True)
assert once("select count(*) from supabase_migrations.schema_migrations where version in ('20261106010000','20261106020000','20261106030000');") == '3'
class Conn:
    def __init__(self):
        self.p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        self.q = queue.Queue()
        threading.Thread(target=self.read, daemon=True).start()
        self.pid = int(self.query('select pg_backend_pid();')[0])
    def read(self):
        for line in self.p.stdout: self.q.put(line.rstrip())
        self.q.put(None)
    def send(self, sql):
        marker = 'done_'+uuid.uuid4().hex
        self.p.stdin.write('\\set VERBOSITY terse\n'+sql+'\n\\echo '+marker+'\n')
        self.p.stdin.flush()
        return marker
    def wait(self, marker):
        lines=[]
        end=time.monotonic()+20
        while True:
            try: line=self.q.get(timeout=max(.01,end-time.monotonic()))
            except queue.Empty: raise RuntimeError('psql timed out: '+repr(lines))
            if line is None: raise RuntimeError('psql closed: '+repr(lines))
            if line==marker: return lines
            if line: lines.append(line)
    def query(self,sql): return self.wait(self.send(sql))
    def close(self):
        self.p.stdin.close()
        self.p.wait(timeout=15)
def start(c, actor):
    sql=f"""begin isolation level read committed;
    set local statement_timeout = '15s';
    set local role authenticated;
    do $claims$ begin
      perform set_config('request.jwt.claim.sub',{lit(people[actor])},true);
      perform set_config('request.jwt.claims',jsonb_build_object(
        'sub',{lit(people[actor])},'role','authenticated','aal','aal2',
        'session_id',{lit(sessions[actor])},'exp',floor(extract(epoch from clock_timestamp()))+3600,
        'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from clock_timestamp())))))::text,true);
    end $claims$;"""
    assert c.query(sql)==[]
def blocked(a,b,kind):
    assert a.query('reset role;')==[]
    for _ in range(40):
        lines=a.query(f"""select pg_stat_clear_snapshot(); select coalesce((select wait_event_type||':'||wait_event from pg_stat_activity where pid={b.pid} and {a.pid}=any(pg_blocking_pids(pid))),'');""")
        if lines:
            assert lines==[kind], lines
            return lines[0]
        time.sleep(.1)
    raise AssertionError('B never visibly blocked on A: '+repr(a.query(f"select pg_stat_clear_snapshot(); select state,wait_event_type,wait_event,pg_blocking_pids(pid) from pg_stat_activity where pid={b.pid};")))
def conflict(b,marker,message):
    lines=b.wait(marker)
    assert lines==['ERROR:  '+message], lines
    state=b.query('\\echo :SQLSTATE')
    assert state==['PT409'],state
    assert b.query('rollback;')==[]
    return state[0]
def activate(clinic, key):
    return f"select public.vetia_activate_clinic({lit(clinic)},{lit(revision)},{lit(key)});"


def receipt(lines):
    assert len(lines) == 1, lines
    value = json.loads(lines[0])
    assert value["lifecycle_status"] == "active", value
    return value


def verify(index, active):
    clinic = lit(clinics[index])
    expected = {
        "lifecycle": "active" if active else "pending_activation",
        "membership": "active" if active else "pending",
        "profile": "incomplete",
        "publication": "unpublished",
        "receipts": int(active),
        "audits": int(active),
        "linked_audits": int(active),
    }
    actual = json.loads(once(f"""
      select jsonb_build_object(
        'lifecycle',c.lifecycle_status,'membership',m.status,
        'profile',c.profile_status,'publication',c.publication_status,
        'receipts',(select count(*) from private.clinic_activation_receipts r where r.clinic_id=c.id),
        'audits',(select count(*) from private.audit_events e where e.entity_id=c.id and e.action='clinic.activate'),
        'linked_audits',(select count(*) from private.audit_events e
          join private.clinic_activation_receipts r on r.id::text=e.metadata->>'receipt_id'
            and r.operation_id::text=e.metadata->>'operation_id' and r.actor_user_id=e.actor_user_id
          where e.entity_id=c.id and r.clinic_id=c.id and e.action='clinic.activate'))
      from public.clinics c join public.clinic_memberships m on m.clinic_id=c.id
      where c.id={clinic} and m.user_id={lit(people[2])} and m.role='clinic_admin';
    """))
    assert actual == expected, (actual, expected)


a = b = None
try:
    once("begin;\n" +
        "insert into auth.users (id,aud,role,email,email_confirmed_at) values " +
        ",".join(f"({lit(p)},'authenticated','authenticated','vetia-activation-{tag}-{i}@example.test',now())"
                 for i,p in enumerate(people)) + ";\n" +
        "insert into auth.sessions (id,user_id) values " +
        ",".join(f"({lit(s)},{lit(people[i])})" for i,s in enumerate(sessions)) + ";\n" +
        "insert into private.platform_admins (user_id) values " +
        ",".join(f"({lit(p)})" for p in people[:2]) + ";\n" +
        "insert into public.clinic_applications (id,applicant_user_id,business_name,city,contact_name,"
        "contact_email,contact_phone,submission_status,reviewed_at,reviewed_by) values " +
        ",".join(f"({lit(app)},{lit(people[2])},'Activation {tag} {i}','Chincha','Fixture',"
                 f"'fixture@example.test','900000000','approved',{lit(revision)},{lit(people[0])})"
                 for i,app in enumerate(apps)) + ";\n" +
        "insert into public.clinics (id,application_id,slug,name,city,approved_at,approved_by) values " +
        ",".join(f"({lit(c)},{lit(apps[i])},'activation-{tag}-{i}','Activation {tag} {i}','Chincha',"
                 f"{lit(revision)},{lit(people[0])})" for i,c in enumerate(clinics)) + ";\n" +
        "insert into public.clinic_memberships (clinic_id,user_id,role,status) values " +
        ",".join(f"({lit(c)},{lit(people[2])},'clinic_admin','pending')" for c in clinics) + ";\n" +
        "insert into private.clinic_application_representations "
        "(application_id,applicant_user_id,verified_by,evidence_reference) values " +
        ",".join(f"({lit(app)},{lit(people[2])},{lit(people[0])},'local-{tag}')" for app in apps) + ";\ncommit;")

    a, b = Conn(), Conn()
    assert a.pid != b.pid
    print("Independent PostgreSQL PIDs:", a.pid, b.pid, flush=True)

    start(a, 0)
    start(b, 1)
    receipt(a.query(activate(clinics[0], uid())))
    pending = b.send(activate(clinics[0], uid()))
    blocked(a, b, "Lock:transactionid")
    assert a.query("commit;") == []
    conflict(b, pending, "Clinic or approval revision is not eligible for activation")
    verify(0, True)
    print("PASS: two administrators, same clinic; B waited on the row and received PT409", flush=True)

    start(a, 0)
    start(b, 0)
    key = uid()
    first = receipt(a.query(activate(clinics[1], key)))
    pending = b.send(activate(clinics[1], key))
    blocked(a, b, "Lock:advisory")
    assert a.query("commit;") == []
    assert receipt(b.wait(pending)) == first
    assert b.query("commit;") == []
    verify(1, True)
    print("PASS: same clinic and operation; B received the exact same receipt", flush=True)

    assert a.query("begin isolation level read committed;") == []
    assert a.query(f"select 1 from public.clinic_applications where id={lit(apps[2])} for update;") == ["1"]
    assert a.query(f"update private.clinic_application_representations set revoked_at=clock_timestamp() "
                   f"where application_id={lit(apps[2])};") == []
    start(b, 1)
    pending = b.send(activate(clinics[2], uid()))
    blocked(a, b, "Lock:transactionid")
    assert a.query("commit;") == []
    conflict(b, pending, "Applicant representation is not valid for activation")
    verify(2, False)
    assert once(f"select (revoked_at is not null)::text from private.clinic_application_representations "
                f"where application_id={lit(apps[2])};") == "true"
    print("PASS: revocation committed first; B received PT409 and left no activation writes", flush=True)

    start(a, 0)
    start(b, 0)
    key = uid()
    receipt(a.query(activate(clinics[3], key)))
    pending = b.send(activate(clinics[4], key))
    blocked(a, b, "Lock:advisory")
    assert a.query("commit;") == []
    conflict(b, pending, "Activation operation key already used with different input")
    verify(3, True)
    verify(4, False)
    print("PASS: two clinics, same actor and operation; B received PT409 with no partial writes", flush=True)
finally:
    if a:
        a.close()
    if b:
        b.close()
    ax, cx, px, sx = ids(apps), ids(clinics), ids(people), ids(sessions)
    once(f"""begin;
      delete from private.audit_events where action='clinic.activate' and entity_id in ({cx});
      delete from private.clinic_activation_receipts where clinic_id in ({cx});
      delete from public.clinic_memberships where clinic_id in ({cx}) and user_id in ({px});
      delete from public.clinics where id in ({cx}) and application_id in ({ax});
      delete from private.clinic_application_representations where application_id in ({ax});
      delete from public.clinic_applications where id in ({ax});
      delete from private.platform_admins where user_id in ({px});
      delete from auth.sessions where id in ({sx});
      delete from auth.users where id in ({px});
    commit;""")
    remaining = json.loads(once(f"""select jsonb_build_object(
      'audit',(select count(*) from private.audit_events where entity_id in ({cx})),
      'receipts',(select count(*) from private.clinic_activation_receipts where clinic_id in ({cx})),
      'memberships',(select count(*) from public.clinic_memberships where clinic_id in ({cx})),
      'clinics',(select count(*) from public.clinics where id in ({cx})),
      'applications',(select count(*) from public.clinic_applications where id in ({ax})),
      'representations',(select count(*) from private.clinic_application_representations where application_id in ({ax})),
      'admins',(select count(*) from private.platform_admins where user_id in ({px})),
      'sessions',(select count(*) from auth.sessions where id in ({sx})),
      'profiles',(select count(*) from public.profiles where user_id in ({px})),
      'users',(select count(*) from auth.users where id in ({px})));"""))
    assert all(count == 0 for count in remaining.values()), remaining
    print("Cleanup verified:", remaining, flush=True)
