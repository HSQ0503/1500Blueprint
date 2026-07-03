-- OPTIONAL demo content for the community board. Run AFTER community.sql if you
-- want a populated feed to look at. Idempotent (fixed ids + on conflict do
-- nothing). Delete these anytime from the /admin -> Community tab.

insert into public.community_posts
  (id, author_email, author_name, author_initials, author_handle, author_level, category, body, created_at)
values
  ('seed-1480', 'alejandro@example.com', 'Alejandro Fonseca', 'AF', 'alejandrof', 14, 'scores',
   'Just hit 1480 on Practice Test 4, up from a 1350 back in March. The reading recall drill is unreal for training focus. Two months of daily reps finally paying off.',
   now() - interval '2 hours'),
  ('seed-q17', 'priya@example.com', 'Priya Nair', 'PN', 'priya.nair', 9, 'questions',
   'Can someone explain why Q17 in Math Module 2 is B and not C? I set up the system the same way but the ''no solution'' wording threw me off.',
   now() - interval '4 hours'),
  ('seed-grammar', 'marcus@example.com', 'Marcus Bell', 'MB', 'marcusb', 21, 'wins',
   'Finally mastered the boundaries pattern, 5 perfect drills in a row. The ''find the independent clause on both sides of the blank'' trick from Scott''s walkthrough just clicked.',
   now() - interval '6 hours'),
  ('seed-plan', 'sofia@example.com', 'Sofia Ramirez', 'SR', 'sofiar', 11, 'plans',
   'My 6-week plan before the August SAT: Mon-Fri 2 targeted drills + 1 vocab set, Sat one full module under time, Sun a full-length test with review. Week 5 is all weak-spot drills. Steal it.',
   now() - interval '1 day')
on conflict (id) do nothing;

insert into public.community_comments
  (id, post_id, author_email, author_name, author_initials, author_handle, author_level, body, created_at)
values
  ('seed-c1', 'seed-1480', 'marcus@example.com', 'Marcus Bell', 'MB', 'marcusb', 21,
   'huge jump, congrats! what did your reading routine look like day to day?', now() - interval '1 hour'),
  ('seed-c2', 'seed-1480', 'alejandro@example.com', 'Alejandro Fonseca', 'AF', 'alejandrof', 14,
   'one recall drill every morning + a full RW module twice a week. the from-memory summary part is what fixed my comprehension.', now() - interval '50 minutes')
on conflict (id) do nothing;

insert into public.community_likes (id, post_id, email) values
  ('seed-l1', 'seed-1480', 'priya@example.com'),
  ('seed-l2', 'seed-1480', 'marcus@example.com'),
  ('seed-l3', 'seed-1480', 'sofia@example.com'),
  ('seed-l4', 'seed-grammar', 'priya@example.com'),
  ('seed-l5', 'seed-grammar', 'alejandro@example.com')
on conflict (post_id, email) do nothing;
