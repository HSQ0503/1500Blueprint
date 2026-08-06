-- Restore underline formatting that the original DOCX importer discarded.
-- This patches content in place so question IDs, attempts, figures, and choices
-- remain unchanged. Source of truth: the checked Google Docs for Tests 2-5.

create or replace function pg_temp.restore_practice_test_underline(
  test_slug text,
  module_order int,
  module_variant text,
  question_position int,
  underlined_text text
)
returns void
language plpgsql
as $$
declare
  current_passage text;
  occurrence_count int;
begin
  select q.passage
  into strict current_passage
  from public.questions q
  join public.modules m on m.id = q.module_id
  join public.tests t on t.id = m.test_id
  where t.slug = test_slug
    and m.section = 'rw'
    and m."order" = module_order
    and m.variant = module_variant
    and q.position = question_position;

  -- Keep the migration safe to retry manually.
  if strpos(current_passage, '<u>' || underlined_text || '</u>') > 0 then
    return;
  end if;

  occurrence_count := (
    length(current_passage) - length(replace(current_passage, underlined_text, ''))
  ) / length(underlined_text);

  if occurrence_count <> 1 then
    raise exception
      'Expected one underline match for % module %/% question %, found %',
      test_slug,
      module_order,
      module_variant,
      question_position,
      occurrence_count;
  end if;

  update public.questions q
  set passage = replace(current_passage, underlined_text, '<u>' || underlined_text || '</u>')
  from public.modules m
  join public.tests t on t.id = m.test_id
  where q.module_id = m.id
    and t.slug = test_slug
    and m.section = 'rw'
    and m."order" = module_order
    and m.variant = module_variant
    and q.position = question_position;
end;
$$;

-- Practice Test 2
select pg_temp.restore_practice_test_underline(
  'practice-test-2',
  1,
  'm1',
  5,
  'Vertical transmission involves the passing of genetic material from parent to offspring; horizontal transmission, by contrast, refers to the exchange of genetic material between organisms without a parent-offspring relationship.'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-2',
  2,
  'hard',
  7,
  'An encounter between a prairie dog and an unfamiliar member of the same species illustrates a key dimension of social behavior across animals'
);

-- Practice Test 3
select pg_temp.restore_practice_test_underline(
  'practice-test-3',
  1,
  'm1',
  5,
  'This evidence could help researchers better understand how V. asymmetrica is related to other arthropods, such as desert crickets and shrimp.'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-3',
  1,
  'm1',
  7,
  'More recently, Japanese recording artist Yuko Tanaka has contributed to that sound by incorporating traditional pop song structures into it.'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-3',
  2,
  'easy',
  5,
  'the HC places a distinctive emphasis on popular material, including amusements like folktales, and on practical content, such as household advice.'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-3',
  2,
  'hard',
  5,
  'Most other contemporary personal manuscripts, such as the Greenwick Collection (GC), consist primarily of works by well-known medieval writers like Gower as well as other texts favored by aristocratic audiences, whereas the HC places a distinctive emphasis on popular material, including amusements like folktales, and on practical content, such as household advice.'
);

-- Practice Test 4
select pg_temp.restore_practice_test_underline(
  'practice-test-4',
  2,
  'easy',
  7,
  'The male red kangaroo uses a specialized fold of fur along his abdomen to support the newborn and keep it warm.'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-4',
  2,
  'hard',
  5,
  'We children asked why they put nothing in the crate but straw and a piece of fabric, but she told us all to be quiet'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-4',
  2,
  'hard',
  8,
  'Over a span of eight weeks in 2011, McNeill and his research team asked volunteers to record their daily choices by rating how strongly they experienced basic motivations such as curiosity, caution, and confidence'
);

-- Practice Test 5
select pg_temp.restore_practice_test_underline(
  'practice-test-5',
  1,
  'm1',
  3,
  'Earlier investigations aimed at interpreting the significance of these eye movements were often unsuccessful in part because they depended on human participants accurately recalling dream content'
);

select pg_temp.restore_practice_test_underline(
  'practice-test-5',
  1,
  'm1',
  4,
  'However, magnetoreception is not restricted to birds.'
);

update public.tests
set updated_at = now()
where slug in ('practice-test-2', 'practice-test-3', 'practice-test-4', 'practice-test-5');
